export type CutoutResult = {
  /** file:// URI of a PNG with alpha, cropped to the subject, in the cache directory. */
  uri: string;
  width: number;
  height: number;
};

export type CutoutErrorCode = 'ERR_INVALID_SOURCE' | 'ERR_NO_SUBJECT' | 'ERR_CUTOUT_FAILED';
