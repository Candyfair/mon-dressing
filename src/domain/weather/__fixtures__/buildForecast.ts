import { addMinutes, localDate, localTime, type LocalDate, zonedInstant } from '../../time';
import type { Forecast, HourlyPoint } from '../types';

// WMO codes used in fixtures.
export const WMO = { clear: 0, mainlyClear: 1, partlyCloudy: 2, overcast: 3, rain: 61, snow: 71 };

type ByHour<T> = T | ((hour: number) => T) | Partial<Record<number, T>>;

export interface DaySpec {
  date: LocalDate;
  timeZone?: string;
  // Felt temperature for each local hour.
  felt: ByHour<number>;
  // Air temperature; defaults to felt + 2.
  temperature?: ByHour<number>;
  // Precipitation probability; hours not listed are 0.
  rain?: ByHour<number>;
  weatherCode?: ByHour<number>;
}

function valueAt<T>(spec: ByHour<T> | undefined, hour: number, fallback: T): T {
  if (spec === undefined) return fallback;
  if (typeof spec === 'function') return (spec as (hour: number) => T)(hour);
  if (typeof spec === 'object' && spec !== null) {
    return (spec as Partial<Record<number, T>>)[hour] ?? fallback;
  }
  return spec;
}

/**
 * A recorded-style forecast for one local day: one point per local hour from
 * midnight to midnight (23 or 25 points on a time switch day).
 */
export function buildForecast(...days: DaySpec[]): Forecast {
  const hourly: HourlyPoint[] = [];
  for (const day of days) {
    const timeZone = day.timeZone ?? 'Europe/Paris';
    let time = zonedInstant(day.date, '00:00', timeZone);
    while (localDate(time, timeZone) === day.date) {
      const hour = Number(localTime(time, timeZone).slice(0, 2));
      const felt = valueAt(day.felt, hour, 15);
      hourly.push({
        time,
        feltTemperature: felt,
        temperature: valueAt(day.temperature, hour, felt + 2),
        precipitationProbability: valueAt(day.rain, hour, 0),
        weatherCode: valueAt(day.weatherCode, hour, WMO.mainlyClear),
      });
      time = addMinutes(time, 60);
    }
  }
  return { hourly };
}
