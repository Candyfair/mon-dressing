export type CutoutResult = {
  /**
   * file:// URI of a PNG with alpha, cropped to the subject, in the cache directory.
   * iOS keeps the source resolution; Android scales the longest side down to 2048 px.
   */
  uri: string;
  width: number;
  height: number;
};

export type CutoutErrorCode =
  | 'ERR_INVALID_SOURCE'
  | 'ERR_NO_SUBJECT'
  /** Android only: the Google Play services model could not be downloaded. */
  | 'ERR_MODEL_UNAVAILABLE'
  | 'ERR_CUTOUT_FAILED';
