import { hasReachedWearLimit } from '../lifecycle';
import { localDate, type LocalDate } from '../time';
import type { EngineGarment, EngineSettings } from './types';

/**
 * SPEC §8.1, DATA_MODEL §2: not to iron, and stored, airing since before
 * today (from the morning after it was set), or on the drying rack when the
 * rack counts as storage.
 */
export function isAvailable(
  garment: EngineGarment,
  date: LocalDate,
  timeZone: string,
  settings: Pick<EngineSettings, 'dryingRackCountsAsStorage'>,
): boolean {
  if (garment.toIron) {
    return false;
  }
  switch (garment.location) {
    case 'stored':
      return true;
    case 'airing':
      return localDate(garment.locationSince, timeZone) < date;
    case 'onDryingRack':
      return settings.dryingRackCountsAsStorage;
    case 'dirty':
    case 'drying':
      return false;
    default: {
      const exhaustive: never = garment.location;
      throw new Error(`Unexpected garment location ${String(exhaustive)}`);
    }
  }
}

/** Under its type's wear limit (SPEC §8.2), the same rule as the evening sort. */
export function isWithinWearLimit(garment: EngineGarment): boolean {
  return !hasReachedWearLimit(garment.wearCount, garment.maxWears);
}
