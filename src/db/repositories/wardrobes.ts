import { eq } from 'drizzle-orm';

import { type Wardrobe, wardrobes } from '../schema';
import type { SyncDatabase } from '../types';
import { activeWardrobeId } from './settings';

/** The wardrobe the app shows (only `main` in v1). */
export function getActiveWardrobe(db: SyncDatabase): Wardrobe {
  const id = activeWardrobeId(db);
  const row = db.select().from(wardrobes).where(eq(wardrobes.id, id)).get();
  if (!row) {
    throw new Error(`Active wardrobe missing: ${id}`);
  }
  return row;
}

export interface WardrobeLocation {
  cityName: string;
  latitude: number;
  longitude: number;
}

/** The city whose weather the wardrobe follows (SPEC §6.5). */
export function setWardrobeLocation(
  db: SyncDatabase,
  wardrobeId: string,
  city: WardrobeLocation,
): void {
  db.update(wardrobes).set(city).where(eq(wardrobes.id, wardrobeId)).run();
}
