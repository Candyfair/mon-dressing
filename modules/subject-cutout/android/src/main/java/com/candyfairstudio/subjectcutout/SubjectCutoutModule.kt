package com.candyfairstudio.subjectcutout

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.graphics.Rect
import android.net.Uri
import androidx.exifinterface.media.ExifInterface
import com.google.android.gms.common.moduleinstall.InstallStatusListener
import com.google.android.gms.common.moduleinstall.ModuleInstall
import com.google.android.gms.common.moduleinstall.ModuleInstallRequest
import com.google.android.gms.common.moduleinstall.ModuleInstallStatusUpdate.InstallState
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.segmentation.subject.SubjectSegmentation
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenter
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenterOptions
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.File
import java.io.FileOutputStream
import java.util.UUID
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger
import kotlin.math.max
import kotlin.math.min

// Longest side fed to ML Kit: keeps a 12 MP photo well within the memory of an entry-level phone.
private const val MAX_SIDE_PX = 2048
private const val MODEL_TIMEOUT_S = 60L

class CutoutResult : Record {
  @Field var uri: String = ""
  @Field var width: Int = 0
  @Field var height: Int = 0
}

// Same codes as iOS, so that JS reads `error.code` identically on both platforms.
private class InvalidSourceException(uri: Uri) :
  CodedException("ERR_INVALID_SOURCE", "Could not read the image at ${uri.lastPathSegment}", null)

private class NoSubjectException :
  CodedException("ERR_NO_SUBJECT", "No subject found in the image", null)

private class ModelUnavailableException(cause: Throwable? = null) :
  CodedException("ERR_MODEL_UNAVAILABLE", "The segmentation model is not available", cause)

private class CutoutFailedException(cause: Throwable) :
  CodedException("ERR_CUTOUT_FAILED", cause.localizedMessage, cause)

class SubjectCutoutModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("SubjectCutout")

    // Async functions run off the main thread, so the blocking Tasks.await calls never freeze the UI.
    AsyncFunction("cutOutSubject") { sourceUri: String ->
      val context = appContext.reactContext ?: throw CutoutFailedException(
        IllegalStateException("React context unavailable")
      )
      try {
        cutOutSubject(context, Uri.parse(sourceUri))
      } catch (exception: CodedException) {
        throw exception
      } catch (error: Throwable) {
        throw CutoutFailedException(error)
      }
    }
  }
}

private fun cutOutSubject(context: Context, sourceUri: Uri): CutoutResult {
  val source = decodeUpright(context, sourceUri)
  val segmenter = SubjectSegmentation.getClient(
    SubjectSegmenterOptions.Builder().enableForegroundBitmap().build()
  )
  try {
    ensureModelAvailable(context, segmenter)

    // Rotation 0: decodeUpright already applied the EXIF orientation.
    val segmentation = Tasks.await(segmenter.process(InputImage.fromBitmap(source, 0)))
    val foreground = segmentation.foregroundBitmap ?: throw NoSubjectException()

    // Cropped to the subject, like croppedToInstancesExtent on iOS.
    val bounds = opaqueBounds(foreground) ?: run {
      foreground.recycle()
      throw NoSubjectException()
    }
    val cutout = Bitmap.createBitmap(foreground, bounds.left, bounds.top, bounds.width(), bounds.height())
    if (cutout !== foreground) foreground.recycle()

    val destination = makeCacheFile(context)
    val written = FileOutputStream(destination).use { cutout.compress(Bitmap.CompressFormat.PNG, 100, it) }
    if (!written) throw CutoutFailedException(IllegalStateException("PNG encoding failed"))

    val result = CutoutResult()
    result.uri = Uri.fromFile(destination).toString()
    result.width = cutout.width
    result.height = cutout.height
    cutout.recycle()
    return result
  } finally {
    segmenter.close()
    source.recycle()
  }
}

/** Decodes at most MAX_SIDE_PX on the longest side, with the EXIF orientation applied. */
private fun decodeUpright(context: Context, uri: Uri): Bitmap {
  val resolver = context.contentResolver

  // With inJustDecodeBounds, decodeStream always returns null: only the stream itself is checked,
  // and an unreadable image shows up as non-positive dimensions below.
  val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
  val boundsStream = resolver.openInputStream(uri) ?: throw InvalidSourceException(uri)
  boundsStream.use { BitmapFactory.decodeStream(it, null, bounds) }
  val longestSide = max(bounds.outWidth, bounds.outHeight)
  if (longestSide <= 0) throw InvalidSourceException(uri)

  // Power-of-two subsampling first (cheap, done by the decoder), exact scaling afterwards.
  var sampleSize = 1
  while (longestSide / (sampleSize * 2) >= MAX_SIDE_PX) sampleSize *= 2
  val options = BitmapFactory.Options().apply { inSampleSize = sampleSize }
  val decoded = resolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, options) }
    ?: throw InvalidSourceException(uri)

  val exif = resolver.openInputStream(uri)?.use { ExifInterface(it) }
  val scale = min(1f, MAX_SIDE_PX.toFloat() / max(decoded.width, decoded.height))
  val matrix = Matrix().apply {
    postScale(scale, scale)
    if (exif != null) {
      postRotate(exif.rotationDegrees.toFloat())
      if (exif.isFlipped) postScale(-1f, 1f)
    }
  }
  if (matrix.isIdentity) return decoded

  val upright = Bitmap.createBitmap(decoded, 0, 0, decoded.width, decoded.height, matrix, true)
  if (upright !== decoded) decoded.recycle()
  return upright
}

/**
 * The model is downloaded by Google Play services, not shipped in the APK. The manifest asks for it at
 * install time; this covers the cases where it is not there yet (sideloaded build, download pending).
 */
private fun ensureModelAvailable(context: Context, segmenter: SubjectSegmenter) {
  val client = ModuleInstall.getClient(context)
  try {
    val availability = Tasks.await(client.areModulesAvailable(segmenter), MODEL_TIMEOUT_S, TimeUnit.SECONDS)
    if (availability.areModulesAvailable()) return

    val finished = CountDownLatch(1)
    val finalState = AtomicInteger(InstallState.STATE_UNKNOWN)
    val listener = InstallStatusListener { update ->
      when (update.installState) {
        InstallState.STATE_COMPLETED, InstallState.STATE_FAILED, InstallState.STATE_CANCELED -> {
          finalState.set(update.installState)
          finished.countDown()
        }
        else -> Unit
      }
    }
    val request = ModuleInstallRequest.newBuilder().addApi(segmenter).setListener(listener).build()
    try {
      val response = Tasks.await(client.installModules(request), MODEL_TIMEOUT_S, TimeUnit.SECONDS)
      if (response.areModulesAlreadyInstalled()) return
      val completed = finished.await(MODEL_TIMEOUT_S, TimeUnit.SECONDS) &&
        finalState.get() == InstallState.STATE_COMPLETED
      if (!completed) throw ModelUnavailableException()
    } finally {
      client.unregisterListener(listener)
    }
  } catch (exception: ModelUnavailableException) {
    throw exception
  } catch (error: Exception) {
    // No Google Play services, no network, timeout.
    throw ModelUnavailableException(error)
  }
}

/** Smallest rectangle holding every non-transparent pixel, or null when the bitmap is empty. */
private fun opaqueBounds(bitmap: Bitmap): Rect? {
  val width = bitmap.width
  val row = IntArray(width)
  var left = width
  var top = -1
  var right = -1
  var bottom = -1
  for (y in 0 until bitmap.height) {
    bitmap.getPixels(row, 0, width, 0, y, width, 1)
    for (x in 0 until width) {
      if (row[x] ushr 24 == 0) continue
      if (top < 0) top = y
      bottom = y
      if (x < left) left = x
      if (x > right) right = x
    }
  }
  return if (top < 0) null else Rect(left, top, right + 1, bottom + 1)
}

private fun makeCacheFile(context: Context): File {
  val directory = File(context.cacheDir, "subject-cutout")
  directory.mkdirs()
  return File(directory, "${UUID.randomUUID()}.png")
}
