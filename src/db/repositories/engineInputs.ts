// Reads what the suggestion engine needs (SPEC §7). Read-only: the engine
// never writes, and the lifecycle columns are only passed through.
import { and, eq, inArray, max } from 'drizzle-orm';

import { getSubtype } from '../../domain/catalogue/subtypes';
import type { EngineGarment, OutfitSelection } from '../../domain/engine';
import { addDays, type LocalDate } from '../../domain/time';
import type { Usage } from '../../domain/types';

import {
  garmentEvents,
  garments,
  garmentUsages,
  outfitItems,
  outfits,
  wearLimits,
} from '../schema';
import type { SyncDatabase } from '../types';

/** Every garment of a wardrobe, with its usages, wear limit and last `worn` event. */
export function loadEngineGarments(db: SyncDatabase, wardrobeId: string): EngineGarment[] {
  const rows = db.select().from(garments).where(eq(garments.wardrobeId, wardrobeId)).all();
  if (rows.length === 0) {
    return [];
  }
  const ids = rows.map((row) => row.id);

  const usagesById = new Map<string, Usage[]>();
  for (const { garmentId, usage } of db
    .select()
    .from(garmentUsages)
    .where(inArray(garmentUsages.garmentId, ids))
    .all()) {
    usagesById.set(garmentId, [...(usagesById.get(garmentId) ?? []), usage]);
  }

  const limits = new Map(
    db
      .select()
      .from(wearLimits)
      .all()
      .map((limit) => [limit.subtype, limit.maxWears]),
  );

  // Uses the (garmentId, type, occurredAt) index.
  const lastWorn = new Map(
    db
      .select({ garmentId: garmentEvents.garmentId, at: max(garmentEvents.occurredAt) })
      .from(garmentEvents)
      .where(and(eq(garmentEvents.type, 'worn'), inArray(garmentEvents.garmentId, ids)))
      .groupBy(garmentEvents.garmentId)
      .all()
      .map((row) => [row.garmentId, row.at]),
  );

  return rows.map((row) => {
    const subtype = getSubtype(row.subtype);
    const maxWears =
      'defaultMaxWears' in subtype ? (limits.get(row.subtype) ?? subtype.defaultMaxWears) : null;
    // The row is spread as it is: the lifecycle columns are read, not set.
    return {
      ...row,
      usages: usagesById.get(row.id) ?? [],
      maxWears,
      lastWornAt: lastWorn.get(row.id) ?? null,
    };
  });
}

/**
 * Yesterday's outfit for the rotation (SPEC §7 step 5): the validated one,
 * else the probable one (displayed at the last close), else none.
 */
export function yesterdayOutfit(
  db: SyncDatabase,
  wardrobeId: string,
  today: LocalDate,
): OutfitSelection | null {
  const candidates = db
    .select({ id: outfits.id, status: outfits.status })
    .from(outfits)
    .where(and(eq(outfits.wardrobeId, wardrobeId), eq(outfits.date, addDays(today, -1))))
    .all();
  const outfit =
    candidates.find((candidate) => candidate.status === 'validated') ??
    candidates.find((candidate) => candidate.status === 'probable');
  if (!outfit) {
    return null;
  }
  const selection: OutfitSelection = {};
  for (const item of db
    .select()
    .from(outfitItems)
    .where(eq(outfitItems.outfitId, outfit.id))
    .all()) {
    if (item.garmentId !== null) {
      selection[item.slot] = item.garmentId;
    }
  }
  return selection;
}
