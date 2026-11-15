// Garment reads and writes outside the lifecycle columns
// (those go through garmentLifecycle.ts).
import { desc, eq, max } from 'drizzle-orm';

import type { SubtypeKey } from '../../domain/catalogue/subtypes';
import type { CutoutOutcome, Usage } from '../../domain/types';

import { garments, garmentUsages } from '../schema';
import type { SyncDatabase } from '../types';

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

/** What the user says about a garment, outside its type and photo (SPEC §4.2). */
export interface GarmentDetails {
  isFavorite: boolean;
  statementPiece: boolean;
  usages: readonly Usage[];
}

export function getGarmentDetails(db: SyncDatabase, garmentId: string): GarmentDetails {
  const row = db
    .select({ isFavorite: garments.isFavorite, statementPiece: garments.statementPiece })
    .from(garments)
    .where(eq(garments.id, garmentId))
    .get();
  if (!row) {
    throw new Error(`Garment missing: ${garmentId}`);
  }
  const usages = db
    .select({ usage: garmentUsages.usage })
    .from(garmentUsages)
    .where(eq(garmentUsages.garmentId, garmentId))
    .all()
    .map((usage) => usage.usage);
  return { ...row, usages };
}

/** Replaces the favourite and statement flags and the usages, in one transaction. */
export function setGarmentDetails(
  db: SyncDatabase,
  garmentId: string,
  { isFavorite, statementPiece, usages }: GarmentDetails,
  { now }: { now: Date },
): void {
  db.transaction((tx) => {
    tx.update(garments)
      .set({ isFavorite, statementPiece, updatedAt: now })
      .where(eq(garments.id, garmentId))
      .run();
    tx.delete(garmentUsages).where(eq(garmentUsages.garmentId, garmentId)).run();
    if (usages.length > 0) {
      tx.insert(garmentUsages)
        .values(usages.map((usage) => ({ garmentId, usage })))
        .run();
    }
  });
}
