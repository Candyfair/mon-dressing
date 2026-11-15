import type { Activity, CommuteMode, DayContext, Occasion } from '../types';

export interface DayOverrideInput {
  activity: Activity | null;
  commuteModes: readonly CommuteMode[] | null;
  occasion: Occasion | null;
}

/**
 * Today's context (SPEC §5): the weekly program, then the one-off override.
 * Office days use the "Trajet du bureau" modes; other days have no commute
 * unless the override adds one. The occasion defaults to everyday.
 * Null when the weekday has no program yet (onboarding not done).
 */
export function resolveDayContext(
  weekdayActivity: Activity | null,
  override: DayOverrideInput | null,
  officeCommuteModes: readonly CommuteMode[],
): DayContext | null {
  const activity = override?.activity ?? weekdayActivity;
  if (activity === null) {
    return null;
  }
  return {
    activity,
    commuteModes: override?.commuteModes ?? (activity === 'office' ? officeCommuteModes : []),
    occasion: override?.occasion ?? 'everyday',
  };
}
