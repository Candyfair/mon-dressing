// Reads what the suggestion engine needs (SPEC §7). Read-only: the engine
// never writes, and the lifecycle columns are only passed through.
import { and, eq, inArray } from 'drizzle-orm';

import { getSubtype } from '../../domain/catalogue/subtypes';
import type { EngineGarment, OutfitSelection } from '../../domain/engine';
import { addDays, type LocalDate } from '../../domain/time';
import type { Usage } from '../../domain/types';

import { garmentEvents, garments, garmentUsages, outfits, wearLimits } from '../schema';
import type { SyncDatabase } from '../types';
import { selectionOf } from './outfits';

/** Every garment of a wardrobe, with its usages, wear limit and last wear not taken back. */
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

  const lastWorn = lastWornAt(db, ids);

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
 * Last wear of each garment that was not taken back: an `unworn` event
 * cancels a `worn` of the same garment and outfit (undone validation).
 */
function lastWornAt(db: SyncDatabase, ids: readonly string[]): Map<string, Date> {
  const events = db
    .select({
      id: garmentEvents.id,
      garmentId: garmentEvents.garmentId,
      type: garmentEvents.type,
      outfitId: garmentEvents.outfitId,
      occurredAt: garmentEvents.occurredAt,
    })
    .from(garmentEvents)
    .where(
      and(inArray(garmentEvents.type, ['worn', 'unworn']), inArray(garmentEvents.garmentId, ids)),
    )
    .all();
  // Per garment and outfit: wears minus take-backs, and the latest wear. An
  // event without an outfit cannot be paired and stands alone.
  const pairs = new Map<string, { garmentId: string; net: number; at: Date | null }>();
  for (const event of events) {
    const key = `${event.garmentId}|${event.outfitId ?? event.id}`;
    const pair = pairs.get(key) ?? { garmentId: event.garmentId, net: 0, at: null };
    if (event.type === 'worn') {
      pair.net += 1;
      if (pair.at === null || event.occurredAt > pair.at) pair.at = event.occurredAt;
    } else {
      pair.net -= 1;
    }
    pairs.set(key, pair);
  }
  const last = new Map<string, Date>();
  for (const { garmentId, net, at } of pairs.values()) {
    if (net <= 0 || at === null) continue;
    const current = last.get(garmentId);
    if (current === undefined || at > current) last.set(garmentId, at);
  }
  return last;
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
    .select({ id: outfits.id, status: outfits.status, validatedAt: outfits.validatedAt })
    .from(outfits)
    .where(and(eq(outfits.wardrobeId, wardrobeId), eq(outfits.date, addDays(today, -1))))
    .all();
  // An undone validation (validatedAt back to null) does not count.
  const outfit =
    candidates.find(
      (candidate) => candidate.status === 'validated' && candidate.validatedAt !== null,
    ) ?? candidates.find((candidate) => candidate.status === 'probable');
  return outfit ? selectionOf(db, outfit.id) : null;
}
