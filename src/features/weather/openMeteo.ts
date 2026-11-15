// Open-Meteo client (SPEC §6.1): no key, only the city's coordinates are sent.
// The response is checked by hand and turned into the provider-agnostic
// Forecast; a MET Norway provider would return the same shape.
import type { Forecast, HourlyPoint } from '../../domain/weather';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** Any forecast source (Open-Meteo today, MET Norway as a fallback, SPEC §6.1). */
export type ForecastProvider = (coordinates: Coordinates) => Promise<Forecast>;

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const HOURLY = [
  'temperature_2m',
  'apparent_temperature',
  'precipitation_probability',
  'weather_code',
];

/**
 * Query string built by hand: React Native's URLSearchParams has long been
 * incomplete, so the app does not rely on it.
 */
export function withQuery(base: string, params: Record<string, string>): string {
  const query = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return `${base}?${query}`;
}

export function forecastUrl({ latitude, longitude }: Coordinates): string {
  return withQuery(FORECAST_URL, {
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
    hourly: HOURLY.join(','),
    // Instants in UTC; local hours come from the wardrobe's time zone.
    timeformat: 'unixtime',
    timezone: 'GMT',
    // Yesterday covers the local morning of zones ahead of UTC; tomorrow the evening sort.
    past_days: '1',
    forecast_days: '2',
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function numberArray(
  hourly: Record<string, unknown>,
  key: string,
  length: number,
): (number | null)[] {
  const values = hourly[key];
  if (
    !Array.isArray(values) ||
    values.length !== length ||
    !values.every((value) => value === null || typeof value === 'number')
  ) {
    throw new Error(`Open-Meteo: invalid hourly.${key}`);
  }
  return values as (number | null)[];
}

/** Checks an Open-Meteo response; hours with a missing value are left out. */
export function parseOpenMeteo(json: unknown): Forecast {
  if (!isRecord(json) || !isRecord(json.hourly)) {
    throw new Error('Open-Meteo: no hourly data');
  }
  const { hourly } = json;
  const times = hourly.time;
  if (!Array.isArray(times) || !times.every((time) => typeof time === 'number')) {
    throw new Error('Open-Meteo: invalid hourly.time');
  }
  const length = times.length;
  const temperature = numberArray(hourly, 'temperature_2m', length);
  const felt = numberArray(hourly, 'apparent_temperature', length);
  const rain = numberArray(hourly, 'precipitation_probability', length);
  const code = numberArray(hourly, 'weather_code', length);

  const points: HourlyPoint[] = [];
  times.forEach((time: number, index) => {
    const values = [temperature[index], felt[index], rain[index], code[index]];
    if (values.some((value) => value === null)) {
      return;
    }
    points.push({
      time: new Date(time * 1000),
      temperature: temperature[index] as number,
      feltTemperature: felt[index] as number,
      precipitationProbability: rain[index] as number,
      weatherCode: code[index] as number,
    });
  });
  return { hourly: points };
}

export const openMeteoProvider: ForecastProvider = async (coordinates) => {
  const response = await fetch(forecastUrl(coordinates));
  if (!response.ok) {
    throw new Error(`Open-Meteo: HTTP ${response.status}`);
  }
  return parseOpenMeteo(await response.json());
};
