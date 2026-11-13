// The four usage groups of the add flow, in display order (SPEC §4.3).
// Labels are i18n keys `usages.<group>.<value>` and `usages.groups.<group>`.
import { ACTIVITIES, COMMUTE_MODES, OCCASIONS, type Usage, WEATHER_USAGES } from '../types';

export const USAGE_GROUPS = [
  { group: 'weather', usages: WEATHER_USAGES.map((value) => `weather.${value}` as const) },
  { group: 'activity', usages: ACTIVITIES.map((value) => `activity.${value}` as const) },
  { group: 'commute', usages: COMMUTE_MODES.map((value) => `commute.${value}` as const) },
  { group: 'occasion', usages: OCCASIONS.map((value) => `occasion.${value}` as const) },
] as const satisfies readonly { group: string; usages: readonly Usage[] }[];

export type UsageGroup = (typeof USAGE_GROUPS)[number]['group'];
