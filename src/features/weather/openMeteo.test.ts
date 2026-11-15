import { localDate } from '../../domain/time';
import recorded from './__fixtures__/openMeteoParis.json';
import { parseGeocoding } from './geocoding';
import { forecastUrl, parseOpenMeteo } from './openMeteo';

describe('forecastUrl', () => {
  it('asks for the hourly values the engine needs, in UTC, and sends only coordinates', () => {
    const url = new URL(forecastUrl({ latitude: 48.85341, longitude: 2.3488 }));
    expect(url.origin + url.pathname).toBe('https://api.open-meteo.com/v1/forecast');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      latitude: '48.8534',
      longitude: '2.3488',
      hourly: 'temperature_2m,apparent_temperature,precipitation_probability,weather_code',
      timeformat: 'unixtime',
      timezone: 'GMT',
      past_days: '1',
      forecast_days: '2',
    });
  });
});

describe('parseOpenMeteo', () => {
  it('reads a recorded response (Paris, 2026-11-15)', () => {
    const forecast = parseOpenMeteo(recorded);
    expect(forecast.hourly).toHaveLength(72);
    const [first] = forecast.hourly;
    expect(localDate(first.time, 'UTC')).toBe('2026-11-14');
    expect(first).toEqual({
      time: new Date(recorded.hourly.time[0] * 1000),
      temperature: recorded.hourly.temperature_2m[0],
      feltTemperature: recorded.hourly.apparent_temperature[0],
      precipitationProbability: recorded.hourly.precipitation_probability[0],
      weatherCode: recorded.hourly.weather_code[0],
    });
  });

  it('leaves out hours with a missing value', () => {
    const forecast = parseOpenMeteo({
      hourly: {
        time: [0, 3600],
        temperature_2m: [5, 6],
        apparent_temperature: [3, null],
        precipitation_probability: [10, 20],
        weather_code: [1, 2],
      },
    });
    expect(forecast.hourly).toHaveLength(1);
  });

  it('rejects a malformed response', () => {
    expect(() => parseOpenMeteo({ error: true, reason: 'Invalid' })).toThrow(/no hourly/);
    expect(() =>
      parseOpenMeteo({ hourly: { time: [0], temperature_2m: [], apparent_temperature: [] } }),
    ).toThrow(/temperature_2m/);
  });
});

describe('parseGeocoding', () => {
  it('keeps name, coordinates and region', () => {
    expect(
      parseGeocoding({
        results: [
          {
            name: 'Paris',
            latitude: 48.85,
            longitude: 2.35,
            admin1: 'Île-de-France',
            country: 'France',
          },
          { name: 'Broken' },
        ],
      }),
    ).toEqual([
      { name: 'Paris', latitude: 48.85, longitude: 2.35, region: 'Île-de-France, France' },
    ]);
  });

  it('returns nothing when there is no match', () => {
    expect(parseGeocoding({ generationtime_ms: 0.1 })).toEqual([]);
  });
});
