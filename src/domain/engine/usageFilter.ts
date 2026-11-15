import type { Activity, CommuteMode, DayContext, Occasion, Usage, WeatherUsage } from '../types';

export interface UsageMatch {
  passes: boolean;
  // Groups where the garment has a usage that explicitly matches the day:
  // such garments come first in their row (decided 2026-11-15).
  explicitMatches: number;
}

interface GroupedUsages {
  weather: WeatherUsage[];
  activity: Activity[];
  commute: CommuteMode[];
  occasion: Occasion[];
}

function groupUsages(usages: readonly Usage[]): GroupedUsages {
  const grouped: GroupedUsages = { weather: [], activity: [], commute: [], occasion: [] };
  for (const usage of usages) {
    const [group, value] = usage.split('.') as [keyof GroupedUsages, string];
    // Each group only receives its own values (the Usage template type).
    (grouped[group] as string[]).push(value);
  }
  return grouped;
}

// One group's verdict: no usage in the group = every case of the group.
type GroupVerdict = 'allCases' | 'match' | 'noMatch';

function verdict(values: readonly string[], matches: () => boolean): GroupVerdict {
  if (values.length === 0) return 'allCases';
  return matches() ? 'match' : 'noMatch';
}

/**
 * SPEC §7 step 2, group by group: weather (one of today's conditions),
 * activity, commute (must cover every commute mode of the day), occasion.
 * `conditions` is null when the weather is unknown: the Weather group passes.
 */
export function matchUsages(
  usages: readonly Usage[],
  context: DayContext,
  conditions: readonly WeatherUsage[] | null,
): UsageMatch {
  const grouped = groupUsages(usages);
  const verdicts: GroupVerdict[] = [
    conditions === null
      ? 'allCases'
      : verdict(grouped.weather, () => grouped.weather.some((value) => conditions.includes(value))),
    verdict(grouped.activity, () => grouped.activity.includes(context.activity)),
    // No commute today: the Commute group does not apply.
    context.commuteModes.length === 0
      ? 'allCases'
      : verdict(grouped.commute, () =>
          context.commuteModes.every((mode) => grouped.commute.includes(mode)),
        ),
    verdict(grouped.occasion, () => grouped.occasion.includes(context.occasion)),
  ];
  return {
    passes: !verdicts.includes('noMatch'),
    explicitMatches: verdicts.filter((value) => value === 'match').length,
  };
}
