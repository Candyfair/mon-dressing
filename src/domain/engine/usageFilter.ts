import { parseUsage } from '../catalogue/usageGroups';
import type { Activity, CommuteMode, DayContext, Occasion, Usage, WeatherUsage } from '../types';

export interface UsageMatch {
  passes: boolean;
  // Activity, commute and occasion groups where the garment has a usage that
  // explicitly matches the day: such garments come first in their row.
  contextMatches: number;
  // A Weather usage matching today's conditions: next in line, after the
  // context ("Télétravail first, then the weather", Candice, 2026-11-15).
  weatherMatch: boolean;
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
    const parsed = parseUsage(usage);
    switch (parsed.group) {
      case 'weather':
        grouped.weather.push(parsed.value);
        break;
      case 'activity':
        grouped.activity.push(parsed.value);
        break;
      case 'commute':
        grouped.commute.push(parsed.value);
        break;
      case 'occasion':
        grouped.occasion.push(parsed.value);
        break;
      default: {
        const exhaustive: never = parsed;
        throw new Error(`Unknown usage group: ${String(exhaustive)}`);
      }
    }
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
  const weather: GroupVerdict =
    conditions === null
      ? 'allCases'
      : verdict(grouped.weather, () => grouped.weather.some((value) => conditions.includes(value)));
  const contextVerdicts: GroupVerdict[] = [
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
    passes: weather !== 'noMatch' && !contextVerdicts.includes('noMatch'),
    contextMatches: contextVerdicts.filter((value) => value === 'match').length,
    weatherMatch: weather === 'match',
  };
}
