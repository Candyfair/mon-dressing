// Garment reads and writes outside the lifecycle columns
// (those go through garmentLifecycle.ts).
import { eq } from 'drizzle-orm';

import { garments } from '../schema';
import type { SyncDatabase } from '../types';
import type { CutoutOutcome } from './garmentLifecycle';

/** Records the end of a background cutout. */
export function setCutoutResult(
  db: SyncDatabase,
  garmentId: string,
  outcome: CutoutOutcome,
  { now }: { now: Date },
): void {
  db.update(garments)
    .set({
      cutoutStatus: outcome.status,
      photoCutoutPath: outcome.status === 'done' ? outcome.path : null,
      updatedAt: now,
    })
    .where(eq(garments.id, garmentId))
    .run();
}

/** Garments whose cutout never finished, e.g. the app was closed meanwhile. */
export function pendingCutouts(db: SyncDatabase): { id: string; photoOriginalPath: string }[] {
  return db
    .select({ id: garments.id, photoOriginalPath: garments.photoOriginalPath })
    .from(garments)
    .where(eq(garments.cutoutStatus, 'pending'))
    .orderBy(garments.createdAt)
    .all();
}
