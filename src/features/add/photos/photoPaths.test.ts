import { cutoutPhotoPath, garmentPhotoDirectory, originalPhotoPath } from './photoPaths';

const ID = '5b0f7f4e-2c1a-4d8e-9f3b-1a2b3c4d5e6f';

describe('photo paths', () => {
  it('places both photos in the garment directory', () => {
    expect(originalPhotoPath(ID)).toBe(`photos/${ID}/original.jpg`);
    expect(cutoutPhotoPath(ID)).toBe(`photos/${ID}/cutout.png`);
    expect(originalPhotoPath(ID).startsWith(`${garmentPhotoDirectory(ID)}/`)).toBe(true);
  });

  it('are relative: no scheme, no leading slash (DATA_MODEL.md §4)', () => {
    for (const path of [originalPhotoPath(ID), cutoutPhotoPath(ID)]) {
      expect(path).not.toMatch(/^[a-z]+:/i);
      expect(path.startsWith('/')).toBe(false);
    }
  });
});
