import { eq } from 'drizzle-orm';

import type { DayOverrideInput } from '../../domain/engine';
import { isoWeekday, type LocalDate } from '../../domain/time';
import type { Activity } from '../../domain/types';
import { dayOverrides, weeklyProgram } from '../schema';
import type { SyncDatabase } from '../types';

export interface DayProgram {
  // The weekly program's activity for the date's weekday; null before onboarding.
  weekdayActivity: Activity | null;
  // The one-off change made for that date, if any (SPEC §5.3).
  override: DayOverrideInput | null;
}

/** What resolveDayContext needs for a date. */
export function dayProgram(db: SyncDatabase, date: LocalDate): DayProgram {
  const weekday = db
    .select({ activity: weeklyProgram.activity })
    .from(weeklyProgram)
    .where(eq(weeklyProgram.weekday, isoWeekday(date)))
    .get();
  const override = db.select().from(dayOverrides).where(eq(dayOverrides.date, date)).get();
  return {
    weekdayActivity: weekday?.activity ?? null,
    override: override
      ? {
          activity: override.activity,
          commuteModes: override.commuteModes,
          occasion: override.occasion,
        }
      : null,
  };
}
