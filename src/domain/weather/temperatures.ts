import { localDate } from '../time';
import type { Forecast } from './types';

/** The two temperatures of Today's header: « 9° → 14° ». */
export interface HeaderTemperatures {
  // Air temperature of the current hour, rounded.
  current: number;
  // Highest air temperature of the local day, rounded.
  max: number;
}

/**
 * Current and maximum air temperature of `now`'s local day. Null when the
 * forecast has no point for that day (stale cache from another day).
 */
export function headerTemperatures(
  forecast: Forecast,
  now: Date,
  timeZone: string,
): HeaderTemperatures | null {
  const today = localDate(now, timeZone);
  const day = forecast.hourly.filter((point) => localDate(point.time, timeZone) === today);
  const first = day[0];
  if (!first) {
    return null;
  }
  // The last point at or before now; before the first point, the first one.
  const current = day.findLast((point) => point.time.getTime() <= now.getTime()) ?? first;
  return {
    current: Math.round(current.temperature),
    max: Math.round(Math.max(...day.map((point) => point.temperature))),
  };
}
