import { cutOutSubject } from '../../../../modules/subject-cutout';
import { db } from '../../../db/client';
import { pendingCutouts, setCutoutResult } from '../../../db/repositories/garments';
import { discardCachedFile, photoUri, storeCutoutPhoto } from '../photos/photoStore';
import { useEffect } from 'react';

import { CutoutQueue } from './cutoutQueue';

export type { CutoutJob, CutoutJobStatus } from './cutoutQueue';

// Single queue for the app: cutouts run one at a time across every screen.
export const cutoutQueue = new CutoutQueue({
  cutOut: cutOutSubject,
  storeCutout: storeCutoutPhoto,
  discard: discardCachedFile,
  record: (garmentId, outcome) => setCutoutResult(db, garmentId, outcome, { now: new Date() }),
  reportError: (error) => console.warn('Cutout queue error', error),
});

let hasResumed = false;

/**
 * Restarts the cutouts a previous run left pending. Runs once per launch,
 * even if called again (React effects run twice in development).
 */
export function resumePendingCutouts(): void {
  if (hasResumed) {
    return;
  }
  hasResumed = true;
  cutoutQueue.resume(
    pendingCutouts(db).map((garment) => ({
      garmentId: garment.id,
      sourceUri: photoUri(garment.photoOriginalPath),
    })),
  );
}

/** Mount under DatabaseProvider: the database is ready there. */
export function useResumePendingCutouts(): void {
  useEffect(resumePendingCutouts, []);
}
