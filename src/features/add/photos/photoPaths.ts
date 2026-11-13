// Garment photo layout under the app documents directory (DATA_MODEL.md §1):
// the database stores these relative paths, never absolute URIs, so a backup
// or an export restored on another device still finds its photos.
const PHOTOS_DIRECTORY = 'photos';

export function garmentPhotoDirectory(garmentId: string): string {
  return `${PHOTOS_DIRECTORY}/${garmentId}`;
}

export function originalPhotoPath(garmentId: string): string {
  return `${garmentPhotoDirectory(garmentId)}/original.jpg`;
}

// PNG with alpha, as returned by the cutout module.
export function cutoutPhotoPath(garmentId: string): string {
  return `${garmentPhotoDirectory(garmentId)}/cutout.png`;
}
