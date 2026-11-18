import { zonedInstant } from '../time';
import { buildForecast } from './__fixtures__/buildForecast';
import { headerTemperatures } from './temperatures';

const PARIS = 'Europe/Paris';
const forecast = buildForecast(
  { date: '2026-10-27', felt: 0, temperature: (hour) => 5 + hour / 2 },
  { date: '2026-10-28', felt: 0, temperature: 30 },
);

describe('headerTemperatures', () => {
  it('reads the current hour and the day maximum, rounded', () => {
    const now = zonedInstant('2026-10-27', '08:40', PARIS);
    // 8 h: 5 + 4 = 9; maximum at 23 h: 5 + 11.5 = 16.5, rounded up.
    expect(headerTemperatures(forecast, now, PARIS)).toEqual({ current: 9, max: 17 });
  });

  it('ignores the hours of the next day', () => {
    const now = zonedInstant('2026-10-27', '00:10', PARIS);
    expect(headerTemperatures(forecast, now, PARIS)?.max).toBe(17);
  });

  it('is unknown when the forecast does not cover the day', () => {
    const now = zonedInstant('2026-10-30', '09:00', PARIS);
    expect(headerTemperatures(forecast, now, PARIS)).toBeNull();
  });
});
