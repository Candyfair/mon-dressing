// Garment reads and writes outside the lifecycle columns
// (those go through garmentLifecycle.ts).
import { desc, eq, max } from 'drizzle-orm';

import type { SubtypeKey } from '../../domain/catalogue/subtypes';

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

/** The last distinct types added to a wardrobe, most recent first. */
export function recentSubtypes(db: SyncDatabase, wardrobeId: string, limit: number): SubtypeKey[] {
  return db
    .select({ subtype: garments.subtype, lastAdded: max(garments.createdAt) })
    .from(garments)
    .where(eq(garments.wardrobeId, wardrobeId))
    .groupBy(garments.subtype)
    .orderBy(desc(max(garments.createdAt)))
    .limit(limit)
    .all()
    .map((row) => row.subtype);
}
