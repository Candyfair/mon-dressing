import type { CutoutResult } from './src/SubjectCutout.types';
import SubjectCutoutModule from './src/SubjectCutoutModule';

export type { CutoutErrorCode, CutoutResult } from './src/SubjectCutout.types';

/** Rejects with a `code` from CutoutErrorCode. */
export function cutOutSubject(sourceUri: string): Promise<CutoutResult> {
  return SubjectCutoutModule.cutOutSubject(sourceUri);
}
