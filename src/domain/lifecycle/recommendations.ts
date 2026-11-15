import type { SortDestination } from './commands';
import type { LifecycleGarment } from './types';

const HOUR_MS = 60 * 60 * 1000;

/**
 * "Ports avant lavage" (SPEC §8.2): at the limit a piece goes to the laundry
 * and the engine stops proposing it. Null = no limit (shoes).
 */
export function hasReachedWearLimit(wearCount: number, maxWears: number | null): boolean {
  return maxWears !== null && wearCount >= maxWears;
}

/**
 * Option highlighted in the evening sort (SPEC §8.5): airing until the wear
 * limit is reached, dirty after; shoes are put away. The user stays free.
 * Without the airing option, a piece under its limit is put away.
 */
export function recommendSort(
  garment: Pick<LifecycleGarment, 'slot' | 'wearCount'>,
  maxWears: number,
  airingEnabled: boolean,
): SortDestination {
  if (garment.slot === 'shoes') {
    return 'stored';
  }
  if (hasReachedWearLimit(garment.wearCount, maxWears)) {
    return 'dirty';
  }
  return airingEnabled ? 'airing' : 'stored';
}

/** Whether a drying piece moves to the drying rack on its own (SPEC §8.4). */
export function isDryDue(
  garment: Pick<LifecycleGarment, 'location' | 'locationSince'>,
  now: Date,
  dryingDelayHours: number,
): boolean {
  return (
    garment.location === 'drying' &&
    now.getTime() - garment.locationSince.getTime() >= dryingDelayHours * HOUR_MS
  );
}
