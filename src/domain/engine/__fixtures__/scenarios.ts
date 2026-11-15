import { addDays, type LocalDate, zonedInstant } from '../../time';
import type { DayContext, Location } from '../../types';
import {
  activeDayWindow,
  constrainingWindows,
  type DayWeather,
  evaluateDay,
  isIndoorDay,
  weatherLines,
  type WeatherLines,
  type WindowSettings,
} from '../../weather';
import { buildForecast, type DaySpec, WMO } from '../../weather/__fixtures__/buildForecast';
import { suggest } from '../suggest';
import type { EngineGarment, EngineSettings, OutfitSelection, Suggestion } from '../types';

// The 10 reference scenarios (SPEC §3 R3, §12.1). Each one is a day: a
// context, a recorded-style forecast and, when it matters, a wardrobe state.
// They run on the reference wardrobe in Jest and on the real wardrobe from
// the dev screen, where Candice rates each proposal.

export const SCENARIO_KEYS = [
  'officeBikeColdMorning',
  'officeRainEvening',
  'officeRainAfternoon',
  'remoteCoolIndoor',
  'remoteLunchRain',
  'relaxHeatwave',
  'sportMild',
  'officeEvening',
  'statementPieces',
  'onlyYesterday',
] as const;
export type ScenarioKey = (typeof SCENARIO_KEYS)[number];

// Garment state for a scenario, by id (ignored when the id is not in the wardrobe).
interface GarmentState {
  wornDaysAgo?: number;
  location?: Location;
}

export interface Scenario {
  key: ScenarioKey;
  date: LocalDate;
  context: DayContext;
  lunchOutingEnabled: boolean;
  forecast: Omit<DaySpec, 'date'>;
  garmentStates: Record<string, GarmentState>;
  // `restDirty`: every piece not listed in garmentStates is at the laundry.
  restDirty: boolean;
  yesterday: OutfitSelection | null;
}

const WALKING: DayContext = { activity: 'office', commuteModes: ['walking'], occasion: 'everyday' };

function scenario(
  key: ScenarioKey,
  date: LocalDate,
  context: DayContext,
  forecast: Omit<DaySpec, 'date'>,
  extra: Partial<Omit<Scenario, 'key' | 'date' | 'context' | 'forecast'>> = {},
): Scenario {
  return {
    key,
    date,
    context,
    forecast,
    lunchOutingEnabled: false,
    garmentStates: {},
    restDirty: false,
    yesterday: null,
    ...extra,
  };
}

export const SCENARIOS: readonly Scenario[] = [
  // 1. Cold bike ride at 8:30, mild afternoon: the category comes from the morning.
  scenario(
    'officeBikeColdMorning',
    '2026-11-16',
    { activity: 'office', commuteModes: ['bike'], occasion: 'everyday' },
    { felt: (hour) => (hour < 12 ? 9 : 16), weatherCode: WMO.clear },
  ),
  // 2. Rain on the way back (18:30 ± 1 h).
  scenario('officeRainEvening', '2026-11-17', WALKING, {
    felt: 13,
    rain: { 17: 30, 18: 70, 19: 60 },
    weatherCode: (hour) => (hour >= 17 ? WMO.rain : WMO.overcast),
  }),
  // 3. Rain at 14:00 while at the office: reminder only.
  scenario('officeRainAfternoon', '2026-11-18', WALKING, {
    felt: 18,
    rain: { 14: 80 },
    weatherCode: (hour) => (hour === 14 ? WMO.rain : WMO.partlyCloudy),
  }),
  // 4. Remote day indoors, cool outside: layer 1 only, remote pieces first.
  scenario(
    'remoteCoolIndoor',
    '2026-11-19',
    { activity: 'remote', commuteModes: [], occasion: 'everyday' },
    { felt: 12, rain: { 15: 70 }, weatherCode: WMO.overcast },
  ),
  // 5. Remote day with the lunch outing, rain at 12:30.
  scenario(
    'remoteLunchRain',
    '2026-11-20',
    { activity: 'remote', commuteModes: [], occasion: 'everyday' },
    { felt: 15, rain: { 12: 60 }, weatherCode: (hour) => (hour === 12 ? WMO.rain : WMO.overcast) },
    { lunchOutingEnabled: true },
  ),
  // 6. Relax day in a heatwave.
  scenario(
    'relaxHeatwave',
    '2026-07-11',
    { activity: 'relax', commuteModes: [], occasion: 'everyday' },
    {
      felt: (hour) => (hour < 9 ? 22 : 24 + Math.max(0, 9 - Math.abs(15 - hour))),
      weatherCode: WMO.clear,
    },
  ),
  // 7. Sport day, mild.
  scenario(
    'sportMild',
    '2026-11-22',
    { activity: 'sport', commuteModes: [], occasion: 'everyday' },
    { felt: 18, weatherCode: WMO.mainlyClear },
  ),
  // 8. Office day ending with an evening out.
  scenario(
    'officeEvening',
    '2026-11-23',
    { activity: 'office', commuteModes: ['walking'], occasion: 'evening' },
    { felt: 14, weatherCode: WMO.partlyCloudy },
  ),
  // 9. Statement pieces at the head of two rows.
  scenario(
    'statementPieces',
    '2026-11-24',
    { activity: 'relax', commuteModes: [], occasion: 'festive' },
    { felt: 18, weatherCode: WMO.mainlyClear },
    { garmentStates: { jeansBlue: { wornDaysAgo: 2 }, chinos: { wornDaysAgo: 1 } } },
  ),
  // 10. Laundry day: only yesterday's outfit is clean.
  scenario(
    'onlyYesterday',
    '2026-11-25',
    WALKING,
    { felt: 18 },
    {
      garmentStates: {
        teeWhite: { wornDaysAgo: 1 },
        jeansBlue: { wornDaysAgo: 1 },
        whiteSneakers: { wornDaysAgo: 1 },
      },
      restDirty: true,
      yesterday: { top: 'teeWhite', bottom: 'jeansBlue', shoes: 'whiteSneakers' },
    },
  ),
];

export const SCENARIO_SETTINGS: Omit<WindowSettings, 'lunchOutingEnabled'> & EngineSettings = {
  officeDepartureTime: '08:30',
  officeReturnTime: '18:30',
  activeDayStart: '09:00',
  activeDayEnd: '20:00',
  dryingRackCountsAsStorage: true,
  rotationPace: 'long',
};

export interface ScenarioResult {
  weather: DayWeather | null;
  lines: WeatherLines | null;
  suggestion: Suggestion;
}

/** Applies a scenario's garment states (the dev screen leaves the real wardrobe as it is). */
export function withScenarioStates(
  scenarioDef: Scenario,
  garments: readonly EngineGarment[],
  timeZone: string,
): EngineGarment[] {
  return garments.map((garment) => {
    const state = scenarioDef.garmentStates[garment.id];
    if (!state) {
      return scenarioDef.restDirty ? { ...garment, location: 'dirty' } : garment;
    }
    return {
      ...garment,
      location: state.location ?? garment.location,
      lastWornAt:
        state.wornDaysAgo === undefined
          ? garment.lastWornAt
          : zonedInstant(addDays(scenarioDef.date, -state.wornDaysAgo), '08:00', timeZone),
    };
  });
}

/** Weather evaluation, reminder lines and suggestion for one scenario. */
export function runScenario(
  scenarioDef: Scenario,
  garments: readonly EngineGarment[],
  options: { timeZone: string; settings?: typeof SCENARIO_SETTINGS },
): ScenarioResult {
  const { timeZone } = options;
  const settings = options.settings ?? SCENARIO_SETTINGS;
  const windowSettings = { ...settings, lunchOutingEnabled: scenarioDef.lunchOutingEnabled };
  const day = { date: scenarioDef.date, timeZone };
  const forecast = buildForecast({ date: scenarioDef.date, timeZone, ...scenarioDef.forecast });
  const windows = constrainingWindows(day, scenarioDef.context, windowSettings);
  const activeDay = activeDayWindow(day, windowSettings);
  const weather = evaluateDay(forecast, windows, activeDay);
  return {
    weather,
    lines: weatherLines({ forecast, windows, activeDay, context: scenarioDef.context, timeZone }),
    suggestion: suggest({
      date: scenarioDef.date,
      timeZone,
      garments,
      context: scenarioDef.context,
      weather,
      indoorDay: isIndoorDay(windows),
      settings,
      yesterday: scenarioDef.yesterday,
    }),
  };
}
