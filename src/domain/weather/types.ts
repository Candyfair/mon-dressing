import type { FeltCategory, WeatherUsage } from '../types';

/** One hour of forecast, covering [time, time + 1 h). */
export interface HourlyPoint {
  time: Date;
  // Air temperature, °C.
  temperature: number;
  // Felt ("apparent") temperature, °C.
  feltTemperature: number;
  // 0 to 100.
  precipitationProbability: number;
  // WMO weather interpretation code, as returned by Open-Meteo.
  weatherCode: number;
}

/** Hourly forecast, sorted by time. Provider-agnostic (Open-Meteo, later MET Norway). */
export interface Forecast {
  hourly: readonly HourlyPoint[];
}

export interface Interval {
  start: Date;
  end: Date;
}

export type WindowKind = 'outbound' | 'return' | 'lunch' | 'activeDay';

/** A period spent outside that constrains the outfit (SPEC §6.2). */
export interface DayWindow {
  kind: WindowKind;
  // Hours whose felt temperature counts.
  temperature: Interval;
  // Hours whose rain counts (commutes are widened by the rain margin).
  rain: Interval;
  // Bike commute: felt temperature lowered by the relative wind (SPEC §6.3).
  bikeCorrected: boolean;
}

export interface WindowWeather {
  kind: WindowKind;
  // Minimum felt temperature over the window, bike correction applied.
  minFelt: number;
  maxRainProbability: number;
}

/** The weather conditions of the day, as the engine sees them (SPEC §6.3). */
export interface DayWeather {
  category: FeltCategory;
  rain: boolean;
  // No constraining window: the category comes from the active day, no Rain,
  // no outer layer (SPEC §6.3).
  indoorOnly: boolean;
  minFelt: number;
  windows: readonly WindowWeather[];
  // What the Weather usages are matched against: the category, plus `rain`.
  conditions: readonly WeatherUsage[];
}
