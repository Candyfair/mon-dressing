import type { DayContext } from '../types';
import { buildForecast } from './__fixtures__/buildForecast';
import { evaluateDay, feltCategory } from './evaluate';
import { activeDayWindow, constrainingWindows, type WindowSettings } from './windows';

const DAY = { date: '2026-11-16', timeZone: 'Europe/Paris' };
const SETTINGS: WindowSettings = {
  officeDepartureTime: '08:30',
  officeReturnTime: '18:30',
  lunchOutingEnabled: false,
  activeDayStart: '09:00',
  activeDayEnd: '20:00',
};
const OFFICE_ON_FOOT: DayContext = {
  activity: 'office',
  commuteModes: ['walking'],
  occasion: 'everyday',
};

function evaluate(
  context: DayContext,
  spec: Omit<Parameters<typeof buildForecast>[0], 'date'>,
  settings = SETTINGS,
) {
  const forecast = buildForecast({ date: DAY.date, ...spec });
  return evaluateDay(
    forecast,
    constrainingWindows(DAY, context, settings),
    activeDayWindow(DAY, settings),
  );
}

describe('feltCategory', () => {
  it('uses the approved floors: 10, 17 and 22 °C', () => {
    expect(feltCategory(9.9)).toBe('cold');
    expect(feltCategory(10)).toBe('cool');
    expect(feltCategory(16.9)).toBe('cool');
    expect(feltCategory(17)).toBe('mild');
    expect(feltCategory(21.9)).toBe('mild');
    expect(feltCategory(22)).toBe('hot');
  });
});

describe('constrainingWindows', () => {
  it('gives an office day its two commutes, and the lunch window when enabled', () => {
    const kinds = (settings: WindowSettings) =>
      constrainingWindows(DAY, OFFICE_ON_FOOT, settings).map((window) => window.kind);
    expect(kinds(SETTINGS)).toEqual(['outbound', 'return']);
    expect(kinds({ ...SETTINGS, lunchOutingEnabled: true })).toEqual([
      'outbound',
      'return',
      'lunch',
    ]);
  });

  it('gives a remote day no window, unless a commute or the lunch outing is added', () => {
    const remote: DayContext = { activity: 'remote', commuteModes: [], occasion: 'everyday' };
    expect(constrainingWindows(DAY, remote, SETTINGS)).toEqual([]);
    expect(
      constrainingWindows(DAY, { ...remote, commuteModes: ['bike'] }, SETTINGS).map((w) => w.kind),
    ).toEqual(['outbound', 'return']);
    expect(
      constrainingWindows(DAY, remote, { ...SETTINGS, lunchOutingEnabled: true }).map(
        (w) => w.kind,
      ),
    ).toEqual(['lunch']);
  });

  it('gives relax and sport days the whole active day', () => {
    for (const activity of ['relax', 'sport'] as const) {
      const [window] = constrainingWindows(DAY, { ...OFFICE_ON_FOOT, activity }, SETTINGS);
      expect(window.kind).toBe('activeDay');
      expect(window.temperature.start.toISOString()).toBe('2026-11-16T08:00:00.000Z');
      expect(window.temperature.end.toISOString()).toBe('2026-11-16T19:00:00.000Z');
    }
  });

  it('widens commutes by one hour for rain only', () => {
    const [outbound] = constrainingWindows(DAY, OFFICE_ON_FOOT, SETTINGS);
    expect(outbound.temperature.start.toISOString()).toBe('2026-11-16T07:30:00.000Z');
    expect(outbound.temperature.end.toISOString()).toBe('2026-11-16T08:30:00.000Z');
    expect(outbound.rain.start.toISOString()).toBe('2026-11-16T06:30:00.000Z');
    expect(outbound.rain.end.toISOString()).toBe('2026-11-16T08:30:00.000Z');
  });
});

// End-to-end verification of SPEC §6, on recorded-style forecasts.
describe('evaluateDay — SPEC §6 verification', () => {
  it('office day without lunch outing: rain at 14:00 gives no Rain condition', () => {
    const weather = evaluate(OFFICE_ON_FOOT, { felt: 14, rain: { 14: 80 } });
    expect(weather?.rain).toBe(false);
    expect(weather?.conditions).toEqual(['cool']);
  });

  it('office day: rain at 18:00 gives the Rain condition (return at 18:30, ± 1 h)', () => {
    const weather = evaluate(OFFICE_ON_FOOT, { felt: 14, rain: { 18: 70 } });
    expect(weather?.rain).toBe(true);
    expect(weather?.conditions).toEqual(['cool', 'rain']);
  });

  it('lunch outing on: rain at 12:30 gives the Rain condition', () => {
    const weather = evaluate(
      OFFICE_ON_FOOT,
      { felt: 14, rain: { 12: 60 } },
      { ...SETTINGS, lunchOutingEnabled: true },
    );
    expect(weather?.rain).toBe(true);
  });

  it('cold morning, mild afternoon: the category comes from the morning', () => {
    const weather = evaluate(OFFICE_ON_FOOT, { felt: (hour) => (hour < 12 ? 6 : 19) });
    expect(weather?.category).toBe('cold');
    expect(weather?.minFelt).toBe(6);
  });
});

describe('evaluateDay — rules', () => {
  it('ignores rain under the 40 % threshold', () => {
    expect(evaluate(OFFICE_ON_FOOT, { felt: 14, rain: { 8: 39 } })?.rain).toBe(false);
    expect(evaluate(OFFICE_ON_FOOT, { felt: 14, rain: { 8: 40 } })?.rain).toBe(true);
  });

  it('catches rain one hour before the departure', () => {
    expect(evaluate(OFFICE_ON_FOOT, { felt: 14, rain: { 7: 50 } })?.rain).toBe(true);
    expect(evaluate(OFFICE_ON_FOOT, { felt: 14, rain: { 6: 90 } })?.rain).toBe(false);
  });

  it('lowers the felt temperature of bike commutes by 3 °C, not the lunch window', () => {
    const bike: DayContext = { ...OFFICE_ON_FOOT, commuteModes: ['bike'] };
    const weather = evaluate(
      bike,
      { felt: (hour) => (hour >= 11 && hour < 15 ? 11 : 18) },
      { ...SETTINGS, lunchOutingEnabled: true },
    );
    expect(weather?.windows).toEqual([
      { kind: 'outbound', minFelt: 15, maxRainProbability: 0 },
      { kind: 'return', minFelt: 15, maxRainProbability: 0 },
      { kind: 'lunch', minFelt: 11, maxRainProbability: 0 },
    ]);
    expect(evaluate(bike, { felt: 18 })?.category).toBe('cool');
    expect(evaluate(OFFICE_ON_FOOT, { felt: 18 })?.category).toBe('mild');
  });

  it('indoor day: category from the active day, never Rain', () => {
    const remote: DayContext = { activity: 'remote', commuteModes: [], occasion: 'everyday' };
    const weather = evaluate(remote, { felt: (hour) => (hour === 10 ? 12 : 20), rain: 90 });
    expect(weather).toMatchObject({ indoorOnly: true, category: 'cool', rain: false });
    expect(weather?.conditions).toEqual(['cool']);
  });

  it('returns null when the forecast does not cover a window', () => {
    const weather = evaluateDay(
      { hourly: [] },
      constrainingWindows(DAY, OFFICE_ON_FOOT, SETTINGS),
      activeDayWindow(DAY, SETTINGS),
    );
    expect(weather).toBeNull();
  });

  it('keeps commute hours right on a time switch day', () => {
    const switchDay = { date: '2026-10-25', timeZone: 'Europe/Paris' };
    const forecast = buildForecast({ date: switchDay.date, felt: 14, rain: { 18: 70 } });
    expect(forecast.hourly).toHaveLength(25);
    const weather = evaluateDay(
      forecast,
      constrainingWindows(switchDay, OFFICE_ON_FOOT, SETTINGS),
      activeDayWindow(switchDay, SETTINGS),
    );
    expect(weather?.rain).toBe(true);
  });
});
