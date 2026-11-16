import type { LocalDate } from '../time';
import type { DayContext } from '../types';
import {
  activeDayWindow,
  type Ambience,
  ambience,
  constrainingWindows,
  type DayWeather,
  evaluateDay,
  type Forecast,
  isIndoorDay,
  weatherLines,
  type WeatherLines,
  type WindowSettings,
} from '../weather';
import { suggest } from './suggest';
import type { EngineGarment, EngineSettings, OutfitSelection, Suggestion } from './types';

export type PlanDaySettings = WindowSettings & EngineSettings;

export interface PlanWeatherInput {
  date: LocalDate;
  timeZone: string;
  context: DayContext;
  settings: WindowSettings;
  // Null while the forecast is unknown (loading, offline without cache).
  forecast: Forecast | null;
}

/** What the day's weather means for the outfit and the header (SPEC §6). */
export interface WeatherPlan {
  // Null without a forecast, or when it does not cover a window.
  weather: DayWeather | null;
  lines: WeatherLines | null;
  // Today's visual ambience; null when the weather or the lines are unknown.
  ambience: Ambience | null;
  // Known from the context and the settings, even without a forecast.
  indoorDay: boolean;
}

export interface PlanDayInput extends PlanWeatherInput {
  settings: PlanDaySettings;
  garments: readonly EngineGarment[];
  yesterday: OutfitSelection | null;
}

export interface DayPlan extends WeatherPlan {
  suggestion: Suggestion;
}

/** The weather half of a day: windows, evaluation, reminder lines, ambience. */
export function planWeather({
  date,
  timeZone,
  context,
  settings,
  forecast,
}: PlanWeatherInput): WeatherPlan {
  const day = { date, timeZone };
  const windows = constrainingWindows(day, context, settings);
  const activeDay = activeDayWindow(day, settings);
  const indoorDay = isIndoorDay(windows);
  if (!forecast) {
    return { weather: null, lines: null, ambience: null, indoorDay };
  }
  const weather = evaluateDay(forecast, windows, activeDay);
  const lines = weatherLines({ forecast, windows, activeDay, context, timeZone });
  return {
    weather,
    lines,
    ambience: weather && lines ? ambience(weather, lines.sky) : null,
    indoorDay,
  };
}

/**
 * One day, from its inputs to the proposed outfit: the single composition
 * shared by Today, the reference scenarios and the dev screen. Pure: the
 * date, the forecast, the wardrobe and the settings are all injected.
 */
export function planDay(input: PlanDayInput): DayPlan {
  const weatherPlan = planWeather(input);
  return {
    ...weatherPlan,
    suggestion: suggest({
      date: input.date,
      timeZone: input.timeZone,
      garments: input.garments,
      context: input.context,
      weather: weatherPlan.weather,
      indoorDay: weatherPlan.indoorDay,
      settings: input.settings,
      yesterday: input.yesterday,
    }),
  };
}
