// City search (SPEC §6.5) through Open-Meteo Geocoding: only the typed name is sent.
import { type Coordinates, withQuery } from './openMeteo';

export interface City extends Coordinates {
  name: string;
  // Region and country, to tell homonyms apart ("Île-de-France, France").
  region: string;
}

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

export function geocodingUrl(name: string, language: string): string {
  return withQuery(GEOCODING_URL, { name, count: '5', language, format: 'json' });
}

/** Checks a geocoding response; malformed entries are left out. */
export function parseGeocoding(json: unknown): City[] {
  if (typeof json !== 'object' || json === null || !('results' in json)) {
    return []; // No match: Open-Meteo omits `results`.
  }
  const { results } = json;
  if (!Array.isArray(results)) {
    return [];
  }
  return results.flatMap((result: unknown) => {
    if (typeof result !== 'object' || result === null) return [];
    const { name, latitude, longitude, admin1, country } = result as Record<string, unknown>;
    if (typeof name !== 'string' || typeof latitude !== 'number' || typeof longitude !== 'number') {
      return [];
    }
    const region = [admin1, country].filter((part) => typeof part === 'string').join(', ');
    return [{ name, latitude, longitude, region }];
  });
}

export async function searchCities(name: string, language: string): Promise<City[]> {
  const response = await fetch(geocodingUrl(name, language));
  if (!response.ok) {
    throw new Error(`Geocoding: HTTP ${response.status}`);
  }
  return parseGeocoding(await response.json());
}
