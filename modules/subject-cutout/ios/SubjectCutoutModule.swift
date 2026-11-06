import CoreImage
import ExpoModulesCore
import Vision

struct CutoutResult: Record {
  @Field var uri: String = ""
  @Field var width: Int = 0
  @Field var height: Int = 0
}

public class SubjectCutoutModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SubjectCutout")

    // Async functions run on a background queue by default, so Vision never blocks the UI.
    AsyncFunction("cutOutSubject") { (sourceUri: URL) throws -> CutoutResult in
      guard #available(iOS 17.0, *) else {
        throw Exception(
          name: "UnsupportedOS",
          description: "Subject cutout requires iOS 17 or later",
          code: "ERR_UNSUPPORTED_OS"
        )
      }
      return try autoreleasepool { try cutOutSubject(from: sourceUri) }
    }
  }
}

@available(iOS 17.0, *)
private func cutOutSubject(from sourceUri: URL) throws -> CutoutResult {
  // applyOrientationProperty keeps portrait photos upright: EXIF orientation is honoured.
  guard let source = CIImage(contentsOf: sourceUri, options: [.applyOrientationProperty: true])
  else {
    throw Exception(
      name: "InvalidSource",
      description: "Could not read the image at \(sourceUri.lastPathComponent)",
      code: "ERR_INVALID_SOURCE"
    )
  }

  do {
    let handler = VNImageRequestHandler(ciImage: source)
    let request = VNGenerateForegroundInstanceMaskRequest()
    try handler.perform([request])

    guard let observation = request.results?.first, !observation.allInstances.isEmpty else {
      throw Exception(
        name: "NoSubject",
        description: "No subject found in the image",
        code: "ERR_NO_SUBJECT"
      )
    }

    // Cropped to the subject so that a garment fills its card instead of floating in empty space.
    let maskedBuffer = try observation.generateMaskedImage(
      ofInstances: observation.allInstances,
      from: handler,
      croppedToInstancesExtent: true
    )
    let cutout = CIImage(cvPixelBuffer: maskedBuffer)
    let destination = try makeCacheFileUrl()

    guard let colorSpace = CGColorSpace(name: CGColorSpace.sRGB) else {
      throw Exception(
        name: "CutoutFailed",
        description: "sRGB color space unavailable",
        code: "ERR_CUTOUT_FAILED"
      )
    }
    try CIContext().writePNGRepresentation(
      of: cutout,
      to: destination,
      format: .RGBA8,
      colorSpace: colorSpace
    )

    let result = CutoutResult()
    result.uri = destination.absoluteString
    result.width = Int(cutout.extent.width)
    result.height = Int(cutout.extent.height)
    return result
  } catch let exception as Exception {
    throw exception
  } catch {
    throw Exception(
      name: "CutoutFailed",
      description: error.localizedDescription,
      code: "ERR_CUTOUT_FAILED"
    )
  }
}

private func makeCacheFileUrl() throws -> URL {
  let directory = try FileManager.default
    .url(for: .cachesDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
    .appendingPathComponent("subject-cutout", isDirectory: true)
  try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
  return directory.appendingPathComponent("\(UUID().uuidString).png")
}
