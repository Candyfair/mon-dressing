import type { DayContext } from '../types';
import { buildForecast, WMO } from '../weather/__fixtures__/buildForecast';
import { SCENARIO_SETTINGS } from './__fixtures__/scenarios';
import { referenceWardrobe } from './__fixtures__/wardrobe';
import { planDay, type PlanDayInput, planWeather } from './planDay';
import { suggest } from './suggest';

const DATE = '2026-11-17';
const TIME_ZONE = 'Europe/Paris';
const OFFICE: DayContext = { activity: 'office', commuteModes: ['walking'], occasion: 'everyday' };
const REMOTE: DayContext = { activity: 'remote', commuteModes: [], occasion: 'everyday' };

function input(overrides: Partial<PlanDayInput> = {}): PlanDayInput {
  return {
    date: DATE,
    timeZone: TIME_ZONE,
    context: OFFICE,
    settings: { ...SCENARIO_SETTINGS, lunchOutingEnabled: false },
    forecast: buildForecast({ date: DATE, felt: 13, rain: { 18: 70 }, weatherCode: WMO.rain }),
    garments: referenceWardrobe(),
    yesterday: null,
    ...overrides,
  };
}

describe('planWeather', () => {
  it('knows an indoor day without a forecast', () => {
    expect(planWeather(input({ context: REMOTE, forecast: null }))).toEqual({
      weather: null,
      lines: null,
      ambience: null,
      indoorDay: true,
    });
  });

  it('is not an indoor day when a commute constrains the outfit', () => {
    expect(planWeather(input({ forecast: null })).indoorDay).toBe(false);
  });

  it('evaluates the windows, the lines and the ambience from the forecast', () => {
    const plan = planWeather(input());
    expect(plan.weather?.conditions).toEqual(['cool', 'rain']);
    expect(plan.lines?.sky.kind).toBe('rain');
    expect(plan.ambience).toBe('rain');
  });

  it('has no ambience when the forecast does not cover a window', () => {
    const otherDay = buildForecast({ date: '2026-11-20', felt: 13 });
    const plan = planWeather(input({ forecast: otherDay }));
    expect(plan.weather).toBeNull();
    expect(plan.ambience).toBeNull();
  });
});

describe('planDay', () => {
  it('feeds the engine with the weather plan of the day', () => {
    const dayInput = input();
    const weatherPlan = planWeather(dayInput);
    expect(planDay(dayInput)).toEqual({
      ...weatherPlan,
      suggestion: suggest({
        date: DATE,
        timeZone: TIME_ZONE,
        garments: dayInput.garments,
        context: OFFICE,
        weather: weatherPlan.weather,
        indoorDay: false,
        settings: dayInput.settings,
        yesterday: null,
      }),
    });
  });

  it('still proposes an outfit without a forecast', () => {
    const plan = planDay(input({ forecast: null }));
    expect(plan.suggestion.outfit.top).toBeDefined();
    expect(plan.suggestion.proposedRows.midLayer).toBe(false);
  });
});
