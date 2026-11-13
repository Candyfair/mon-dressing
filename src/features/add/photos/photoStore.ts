// File operations on garment photos. Paths stored in the database are
// relative (photoPaths.ts); this module is the only one resolving them.
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { cutoutPhotoPath, garmentPhotoDirectory, originalPhotoPath } from './photoPaths';

// Same size as the Android cutout input (SPEC §10.1): no loss for the cutout,
// about 0.5 MB per photo instead of 3 to 5 MB.
const MAX_SIDE = 2048;
const JPEG_QUALITY = 0.8;

export interface PhotoSize {
  width: number;
  height: number;
}

/** file:// URI of a stored photo. */
export function photoUri(relativePath: string): string {
  return new File(Paths.document, relativePath).uri;
}

/**
 * Scales a captured or picked photo down to MAX_SIDE on its longest side and
 * re-encodes it as JPEG. Returns the URI of the result, in the cache directory.
 */
export async function normalizePhoto(uri: string, { width, height }: PhotoSize): Promise<string> {
  const context = ImageManipulator.manipulate(uri);
  if (Math.max(width, height) > MAX_SIDE) {
    context.resize(width >= height ? { width: MAX_SIDE } : { height: MAX_SIDE });
  }
  const image = await context.renderAsync();
  const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: JPEG_QUALITY });
  return result.uri;
}

/**
 * Quarter turn clockwise, re-encoded like normalizePhoto. Returns a new
 * cache URI; the previous file is left to the caller.
 */
export async function rotatePhoto(uri: string): Promise<string> {
  const image = await ImageManipulator.manipulate(uri).rotate(90).renderAsync();
  const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: JPEG_QUALITY });
  return result.uri;
}

function destinationFor(relativePath: string): File {
  const destination = new File(Paths.document, relativePath);
  destination.parentDirectory.create({ intermediates: true, idempotent: true });
  return destination;
}

/**
 * Copies the normalized original into the garment folder; returns its
 * relative path. A copy, not a move: a cutout still waiting in the queue
 * reads the cache file, which is discarded once that cutout has ended.
 */
export function storeOriginalPhoto(garmentId: string, cacheUri: string): string {
  const relativePath = originalPhotoPath(garmentId);
  new File(cacheUri).copySync(destinationFor(relativePath), { overwrite: true });
  return relativePath;
}

/** Moves a cutout PNG out of the cache. Returns its relative path. */
export function storeCutoutPhoto(garmentId: string, cacheUri: string): string {
  const relativePath = cutoutPhotoPath(garmentId);
  new File(cacheUri).moveSync(destinationFor(relativePath), { overwrite: true });
  return relativePath;
}

/** Removes a temporary file (retaken photo, unused cutout). */
export function discardCachedFile(cacheUri: string): void {
  const file = new File(cacheUri);
  if (file.exists) {
    file.delete();
  }
}

/** Removes every photo of a garment, e.g. when its insertion failed. */
export function deleteGarmentPhotos(garmentId: string): void {
  const directory = new Directory(Paths.document, garmentPhotoDirectory(garmentId));
  if (directory.exists) {
    directory.delete();
  }
}
