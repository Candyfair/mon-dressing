import type { FeltCategory, WeatherUsage } from '../types';
import {
  BIKE_FELT_CORRECTION,
  FELT_CATEGORY_FLOORS,
  RAIN_PROBABILITY_THRESHOLD,
} from './thresholds';
import type {
  DayWeather,
  DayWindow,
  Forecast,
  HourlyPoint,
  Interval,
  WindowWeather,
} from './types';
import { isIndoorDay } from './windows';

const HOUR_MS = 60 * 60 * 1000;

/** The forecast hours overlapping an interval. */
export function hoursIn(forecast: Forecast, { start, end }: Interval): HourlyPoint[] {
  return forecast.hourly.filter(
    (point) =>
      point.time.getTime() < end.getTime() && point.time.getTime() + HOUR_MS > start.getTime(),
  );
}

/** SPEC §6.3: felt temperature to category, floors from thresholds.ts. */
export function feltCategory(felt: number): FeltCategory {
  if (felt >= FELT_CATEGORY_FLOORS.hot) return 'hot';
  if (felt >= FELT_CATEGORY_FLOORS.mild) return 'mild';
  if (felt >= FELT_CATEGORY_FLOORS.cool) return 'cool';
  return 'cold';
}

export function isRainy(probability: number): boolean {
  return probability >= RAIN_PROBABILITY_THRESHOLD;
}

/** Minimum felt temperature and rain peak of one window; null if not covered. */
export function windowWeather(forecast: Forecast, window: DayWindow): WindowWeather | null {
  const temperatureHours = hoursIn(forecast, window.temperature);
  const rainHours = hoursIn(forecast, window.rain);
  if (temperatureHours.length === 0 || rainHours.length === 0) {
    return null;
  }
  const correction = window.bikeCorrected ? BIKE_FELT_CORRECTION : 0;
  return {
    kind: window.kind,
    minFelt: Math.min(...temperatureHours.map((point) => point.feltTemperature)) + correction,
    maxRainProbability: Math.max(...rainHours.map((point) => point.precipitationProbability)),
  };
}

/**
 * The weather conditions of the day (SPEC §6.3): the minimum felt temperature
 * over the constraining windows gives one category; rain above the threshold
 * in any of them adds Rain. Without a window (indoor day), the active day
 * gives the category and Rain never applies.
 *
 * Returns null when the forecast does not cover a window (offline, stale cache).
 */
export function evaluateDay(
  forecast: Forecast,
  windows: readonly DayWindow[],
  activeDay: DayWindow,
): DayWeather | null {
  const indoorOnly = isIndoorDay(windows);
  const evaluated: WindowWeather[] = [];
  for (const window of indoorOnly ? [activeDay] : windows) {
    const weather = windowWeather(forecast, window);
    if (!weather) {
      return null;
    }
    evaluated.push(weather);
  }

  const minFelt = Math.min(...evaluated.map((window) => window.minFelt));
  const category = feltCategory(minFelt);
  const rain = !indoorOnly && evaluated.some((window) => isRainy(window.maxRainProbability));
  const conditions: WeatherUsage[] = rain ? [category, 'rain'] : [category];
  return { category, rain, indoorOnly, minFelt, windows: evaluated, conditions };
}
