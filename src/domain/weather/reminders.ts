import { addMinutes, localTime, type LocalTime } from '../time';
import type { CommuteMode, DayContext } from '../types';
import { hoursIn, isRainy, windowWeather } from './evaluate';
import {
  FROST_TEMPERATURE,
  GLOVES_FELT_TEMPERATURE,
  HEAT_FELT_TEMPERATURE,
  MORNING_END,
} from './thresholds';
import type { DayWindow, Forecast, HourlyPoint, Interval } from './types';
import { isCommuteWindow, isIndoorDay } from './windows';

// The two lines under the temperature (SPEC §6.4, design/specs/01): the sky,
// then one piece of advice. Structured data only: copy lives in i18n.

export type SkyLine =
  | { kind: 'rain'; probability: number; at: LocalTime } // « Pluie 70 % vers 18 h »
  | { kind: 'snow' } // « Neige »
  | { kind: 'sunnyAllDay' } // « Ensoleillé toute la journée »
  | { kind: 'cloudy' } // « Nuageux »
  | { kind: 'clearSky' }; // « Ciel dégagé »

export type AdviceLine =
  | { kind: 'umbrella'; at: LocalTime } // « Parapluie conseillé vers 12 h 30 »
  | { kind: 'frost'; until: LocalTime } // « Gel jusqu’à 10 h »
  | { kind: 'glovesAndScarf' }
  | { kind: 'heat'; at: LocalTime }
  | { kind: 'maxTemperature'; value: number; at: LocalTime }; // « Max. 27° vers 16 h »

export interface WeatherLines {
  sky: SkyLine;
  advice: AdviceLine;
}

export interface WeatherLinesInput {
  forecast: Forecast;
  // Constraining windows of the day; empty on an indoor day.
  windows: readonly DayWindow[];
  activeDay: DayWindow;
  context: DayContext;
  timeZone: string;
}

// Commute modes exposed to the wind, for the gloves reminder.
const EXPOSED_MODES: readonly CommuteMode[] = ['bike', 'scooter', 'motorbike'];

const isSnow = (code: number) => (code >= 71 && code <= 77) || code === 85 || code === 86;
const isClear = (code: number) => code <= 1;

// First point reaching the highest value: "vers 18 h" points at the peak.
function peak(points: readonly HourlyPoint[], value: (point: HourlyPoint) => number): HourlyPoint {
  return points.reduce((best, point) => (value(point) > value(best) ? point : best));
}

// The hours the two lines talk about: the active day, stretched to cover the
// commutes and their rain margin.
function dayScope(windows: readonly DayWindow[], activeDay: DayWindow): Interval {
  const spans = [activeDay.rain, ...windows.map((window) => window.rain)];
  return {
    start: new Date(Math.min(...spans.map((span) => span.start.getTime()))),
    end: new Date(Math.max(...spans.map((span) => span.end.getTime()))),
  };
}

function skyLine(hours: readonly HourlyPoint[], timeZone: string): SkyLine {
  const rainy = hours.filter((point) => isRainy(point.precipitationProbability));
  if (rainy.length > 0) {
    const top = peak(rainy, (point) => point.precipitationProbability);
    return {
      kind: 'rain',
      probability: top.precipitationProbability,
      at: localTime(top.time, timeZone),
    };
  }
  if (hours.some((point) => isSnow(point.weatherCode))) return { kind: 'snow' };
  if (hours.every((point) => isClear(point.weatherCode))) return { kind: 'sunnyAllDay' };
  const cloudy = hours.filter((point) => !isClear(point.weatherCode)).length;
  return cloudy * 2 >= hours.length ? { kind: 'cloudy' } : { kind: 'clearSky' };
}

function umbrellaAdvice(
  forecast: Forecast,
  windows: readonly DayWindow[],
  scopeHours: readonly HourlyPoint[],
  timeZone: string,
): AdviceLine | null {
  const byTime = [...windows].sort(
    (a, b) => a.temperature.start.getTime() - b.temperature.start.getTime(),
  );
  for (const window of byTime) {
    const firstRainy = hoursIn(forecast, window.rain).find((point) =>
      isRainy(point.precipitationProbability),
    );
    if (firstRainy) {
      // A commute is announced at its own time (« vers 18 h 30 »), a long
      // window at its first rainy hour.
      const at = isCommuteWindow(window) ? window.temperature.start : firstRainy.time;
      return { kind: 'umbrella', at: localTime(at, timeZone) };
    }
  }
  // Rain outside the windows: reminder only, no Rain condition (SPEC §6).
  const outside = scopeHours.find((point) => isRainy(point.precipitationProbability));
  return outside ? { kind: 'umbrella', at: localTime(outside.time, timeZone) } : null;
}

function frostAdvice(
  forecast: Forecast,
  windows: readonly DayWindow[],
  scopeHours: readonly HourlyPoint[],
  timeZone: string,
): AdviceLine | null {
  const isMorning = (point: HourlyPoint) => localTime(point.time, timeZone) < MORNING_END;
  const isFrost = (point: HourlyPoint) => point.temperature <= FROST_TEMPERATURE;
  const frostInWindow = windows.some((window) =>
    hoursIn(forecast, window.temperature).some((point) => isMorning(point) && isFrost(point)),
  );
  if (!frostInWindow) return null;
  const lastFrost = scopeHours.filter((point) => isMorning(point) && isFrost(point)).at(-1);
  return lastFrost
    ? { kind: 'frost', until: localTime(addMinutes(lastFrost.time, 60), timeZone) }
    : null;
}

function glovesAdvice(
  forecast: Forecast,
  windows: readonly DayWindow[],
  context: DayContext,
): AdviceLine | null {
  if (!context.commuteModes.some((mode) => EXPOSED_MODES.includes(mode))) return null;
  const cold = windows.filter(isCommuteWindow).some((window) => {
    const weather = windowWeather(forecast, window);
    return weather !== null && weather.minFelt < GLOVES_FELT_TEMPERATURE;
  });
  return cold ? { kind: 'glovesAndScarf' } : null;
}

function heatAdvice(
  forecast: Forecast,
  windows: readonly DayWindow[],
  timeZone: string,
): AdviceLine | null {
  const hours = windows.flatMap((window) => hoursIn(forecast, window.temperature));
  const hot = hours.filter((point) => point.feltTemperature >= HEAT_FELT_TEMPERATURE);
  if (hot.length === 0) return null;
  const top = peak(hot, (point) => point.feltTemperature);
  return { kind: 'heat', at: localTime(top.time, timeZone) };
}

/**
 * The sky line and the advice line. Advice by priority: umbrella, frost,
 * gloves and scarf, heat, then the day's maximum. Indoor days only get heat
 * and the maximum. Null when the forecast does not cover the day.
 */
export function weatherLines({
  forecast,
  windows,
  activeDay,
  context,
  timeZone,
}: WeatherLinesInput): WeatherLines | null {
  const scopeHours = hoursIn(forecast, dayScope(windows, activeDay));
  if (scopeHours.length === 0) return null;

  const indoorOnly = isIndoorDay(windows);
  const advice =
    (indoorOnly ? null : umbrellaAdvice(forecast, windows, scopeHours, timeZone)) ??
    (indoorOnly ? null : frostAdvice(forecast, windows, scopeHours, timeZone)) ??
    glovesAdvice(forecast, windows, context) ??
    heatAdvice(forecast, indoorOnly ? [activeDay] : windows, timeZone);

  const warmest = peak(scopeHours, (point) => point.temperature);
  return {
    sky: skyLine(scopeHours, timeZone),
    advice: advice ?? {
      kind: 'maxTemperature',
      value: Math.round(warmest.temperature),
      at: localTime(warmest.time, timeZone),
    },
  };
}
