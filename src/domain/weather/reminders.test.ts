import type { DayContext } from '../types';
import { buildForecast, type DaySpec, WMO } from './__fixtures__/buildForecast';
import { ambience } from './ambience';
import { evaluateDay } from './evaluate';
import { weatherLines } from './reminders';
import { activeDayWindow, constrainingWindows, type WindowSettings } from './windows';

const DAY = { date: '2026-11-16', timeZone: 'Europe/Paris' };
const SETTINGS: WindowSettings = {
  officeDepartureTime: '08:30',
  officeReturnTime: '18:30',
  lunchOutingEnabled: false,
  activeDayStart: '09:00',
  activeDayEnd: '20:00',
};
const OFFICE: DayContext = { activity: 'office', commuteModes: ['walking'], occasion: 'everyday' };
const REMOTE: DayContext = { activity: 'remote', commuteModes: [], occasion: 'everyday' };
const RELAX: DayContext = { activity: 'relax', commuteModes: [], occasion: 'everyday' };

function lines(context: DayContext, spec: Omit<DaySpec, 'date'>, settings = SETTINGS) {
  const forecast = buildForecast({ date: DAY.date, ...spec });
  const windows = constrainingWindows(DAY, context, settings);
  const activeDay = activeDayWindow(DAY, settings);
  return {
    lines: weatherLines({ forecast, windows, activeDay, context, timeZone: DAY.timeZone }),
    day: evaluateDay(forecast, windows, activeDay),
  };
}

describe('sky line', () => {
  it('announces the rain peak and its hour', () => {
    const { lines: result } = lines(OFFICE, { felt: 12, rain: { 16: 50, 18: 70, 19: 70 } });
    expect(result?.sky).toEqual({ kind: 'rain', probability: 70, at: '18:00' });
  });

  it('tells a sunny day, a cloudy day, a clear sky and snow apart', () => {
    expect(lines(RELAX, { felt: 25, weatherCode: WMO.clear }).lines?.sky).toEqual({
      kind: 'sunnyAllDay',
    });
    expect(lines(RELAX, { felt: 12, weatherCode: WMO.overcast }).lines?.sky).toEqual({
      kind: 'cloudy',
    });
    expect(
      lines(RELAX, {
        felt: 12,
        weatherCode: (hour) => (hour === 15 ? WMO.overcast : WMO.clear),
      }).lines?.sky,
    ).toEqual({ kind: 'clearSky' });
    expect(lines(RELAX, { felt: -1, weatherCode: { 10: WMO.snow } }).lines?.sky).toEqual({
      kind: 'snow',
    });
  });
});

describe('advice line', () => {
  it('advises an umbrella at the commute time when it rains around it', () => {
    expect(lines(OFFICE, { felt: 12, rain: { 18: 70 } }).lines?.advice).toEqual({
      kind: 'umbrella',
      at: '18:30',
    });
  });

  it('advises an umbrella at the first rainy hour of the lunch window', () => {
    const { lines: result } = lines(
      OFFICE,
      { felt: 12, rain: { 12: 60 } },
      { ...SETTINGS, lunchOutingEnabled: true },
    );
    expect(result?.advice).toEqual({ kind: 'umbrella', at: '12:00' });
  });

  it('still advises an umbrella for rain outside the windows (reminder only)', () => {
    const { lines: result, day } = lines(OFFICE, { felt: 12, rain: { 14: 80 } });
    expect(day?.rain).toBe(false);
    expect(result?.advice).toEqual({ kind: 'umbrella', at: '14:00' });
  });

  it('gives no umbrella on an indoor day', () => {
    expect(lines(REMOTE, { felt: 12, rain: { 14: 80 } }).lines?.advice.kind).toBe('maxTemperature');
  });

  it('warns of frost until the last freezing morning hour', () => {
    const { lines: result } = lines(RELAX, {
      felt: -4,
      temperature: (hour) => (hour < 10 ? -2 : 4),
    });
    expect(result?.advice).toEqual({ kind: 'frost', until: '10:00' });
  });

  it('advises gloves and scarf on a cold bike commute', () => {
    const bike: DayContext = { ...OFFICE, commuteModes: ['bike'] };
    // Felt 7 °C becomes 4 °C on the bike.
    expect(lines(bike, { felt: 7 }).lines?.advice).toEqual({ kind: 'glovesAndScarf' });
    expect(lines(OFFICE, { felt: 7 }).lines?.advice.kind).toBe('maxTemperature');
  });

  it('warns of heat at its peak', () => {
    const { lines: result } = lines(RELAX, {
      felt: (hour) => (hour === 15 ? 33 : hour === 14 ? 31 : 26),
    });
    expect(result?.advice).toEqual({ kind: 'heat', at: '15:00' });
  });

  it('falls back to the day maximum', () => {
    const { lines: result } = lines(RELAX, {
      felt: 20,
      temperature: (hour) => (hour === 16 ? 27.4 : 20),
    });
    expect(result?.advice).toEqual({ kind: 'maxTemperature', value: 27, at: '16:00' });
  });

  it('returns null without forecast', () => {
    expect(
      weatherLines({
        forecast: { hourly: [] },
        windows: [],
        activeDay: activeDayWindow(DAY, SETTINGS),
        context: REMOTE,
        timeZone: DAY.timeZone,
      }),
    ).toBeNull();
  });
});

describe('ambience', () => {
  function ambienceOf(context: DayContext, spec: Omit<DaySpec, 'date'>) {
    const { lines: result, day } = lines(context, spec);
    if (!result || !day) throw new Error('forecast should cover the day');
    return ambience(day, result.sky);
  }

  it('maps the day to rain, sun or cold', () => {
    expect(ambienceOf(OFFICE, { felt: 12, rain: { 18: 70 } })).toBe('rain');
    expect(ambienceOf(RELAX, { felt: 12, weatherCode: WMO.overcast })).toBe('rain');
    expect(ambienceOf(RELAX, { felt: 4, weatherCode: WMO.clear })).toBe('cold');
    expect(ambienceOf(RELAX, { felt: 4, weatherCode: { 10: WMO.snow } })).toBe('cold');
    expect(ambienceOf(RELAX, { felt: 24, weatherCode: WMO.clear })).toBe('sun');
  });
});
