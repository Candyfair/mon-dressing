import { addDays, daysBetween, localDate, type LocalDate } from '../time';
import type { RotationPace } from '../types';
import type { EngineGarment } from './types';

interface RotationPreset {
  // Days since last worn stop counting after this; never worn = the cap.
  recencyCapDays: number;
  // A favourite counts as if worn this many days earlier (never an absolute priority).
  favoriteBonusDays: number;
}

/** "Rotation des tenues", decided with Candice on 2026-11-15 (SPEC §7 step 4). */
export const ROTATION_PRESETS: Record<RotationPace, RotationPreset> = {
  long: { recencyCapDays: 14, favoriteBonusDays: 3 },
  short: { recencyCapDays: 10, favoriteBonusDays: 2 },
};

export interface RankedGarment {
  garment: EngineGarment;
  explicitMatches: number;
  wornYesterday: boolean;
  score: number;
}

/** Days since last worn, capped, plus the favourite bonus. */
export function rotationScore(
  garment: EngineGarment,
  date: LocalDate,
  timeZone: string,
  pace: RotationPace,
): number {
  const { recencyCapDays, favoriteBonusDays } = ROTATION_PRESETS[pace];
  const days =
    garment.lastWornAt === null
      ? recencyCapDays
      : Math.min(daysBetween(localDate(garment.lastWornAt, timeZone), date), recencyCapDays);
  return days + (garment.isFavorite ? favoriteBonusDays : 0);
}

/** Worn yesterday, from the history or from yesterday's (possibly unsorted) outfit. */
export function wasWornYesterday(
  garment: EngineGarment,
  date: LocalDate,
  timeZone: string,
  yesterdayIds: ReadonlySet<string>,
): boolean {
  return (
    yesterdayIds.has(garment.id) ||
    (garment.lastWornAt !== null && localDate(garment.lastWornAt, timeZone) === addDays(date, -1))
  );
}

/**
 * Row order (SPEC §7 step 4): yesterday's pieces last, then explicit matches
 * first, then the rotation score, then the oldest garment, then the id, so
 * the order never depends on chance.
 */
export function compareRanked(a: RankedGarment, b: RankedGarment): number {
  return (
    Number(a.wornYesterday) - Number(b.wornYesterday) ||
    b.explicitMatches - a.explicitMatches ||
    b.score - a.score ||
    a.garment.createdAt.getTime() - b.garment.createdAt.getTime() ||
    (a.garment.id < b.garment.id ? -1 : a.garment.id > b.garment.id ? 1 : 0)
  );
}
