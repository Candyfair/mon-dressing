// The four usage groups of the add flow, in display order (SPEC §4.3).
// Labels are i18n keys `usages.<group>.<value>` and `usages.groups.<group>`.
import {
  ACTIVITIES,
  type Activity,
  COMMUTE_MODES,
  type CommuteMode,
  OCCASIONS,
  type Occasion,
  type Usage,
  WEATHER_USAGES,
  type WeatherUsage,
} from '../types';

export const USAGE_GROUPS = [
  { group: 'weather', usages: WEATHER_USAGES.map((value) => `weather.${value}` as const) },
  { group: 'activity', usages: ACTIVITIES.map((value) => `activity.${value}` as const) },
  { group: 'commute', usages: COMMUTE_MODES.map((value) => `commute.${value}` as const) },
  { group: 'occasion', usages: OCCASIONS.map((value) => `occasion.${value}` as const) },
] as const satisfies readonly { group: string; usages: readonly Usage[] }[];

export type UsageGroup = (typeof USAGE_GROUPS)[number]['group'];

/** A stored usage, split into its group and its value. */
export type ParsedUsage =
  | { group: 'weather'; value: WeatherUsage }
  | { group: 'activity'; value: Activity }
  | { group: 'commute'; value: CommuteMode }
  | { group: 'occasion'; value: Occasion };

function isOneOf<T extends string>(values: readonly T[], value: string): value is T {
  return (values as readonly string[]).includes(value);
}

/**
 * Reads "<group>.<value>" (DATA_MODEL §2). The column has no CHECK, so an
 * unknown value read from the database fails here, loudly.
 */
export function parseUsage(usage: Usage): ParsedUsage {
  const [group, value] = usage.split('.');
  if (group === 'weather' && isOneOf(WEATHER_USAGES, value)) return { group, value };
  if (group === 'activity' && isOneOf(ACTIVITIES, value)) return { group, value };
  if (group === 'commute' && isOneOf(COMMUTE_MODES, value)) return { group, value };
  if (group === 'occasion' && isOneOf(OCCASIONS, value)) return { group, value };
  throw new Error(`Unknown usage: ${usage}`);
}
