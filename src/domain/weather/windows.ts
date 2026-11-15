import { addMinutes, type LocalDate, type LocalTime, zonedInstant } from '../time';
import type { DayContext } from '../types';
import { COMMUTE_DURATION_MINUTES, COMMUTE_RAIN_MARGIN_MINUTES, LUNCH_WINDOW } from './thresholds';
import type { DayWindow, Interval } from './types';

/** The settings the windows depend on (DATA_MODEL §3, `settings`). */
export interface WindowSettings {
  officeDepartureTime: LocalTime;
  officeReturnTime: LocalTime;
  lunchOutingEnabled: boolean;
  activeDayStart: LocalTime;
  activeDayEnd: LocalTime;
}

interface DayRef {
  date: LocalDate;
  timeZone: string;
}

function interval({ date, timeZone }: DayRef, start: LocalTime, end: LocalTime): Interval {
  return { start: zonedInstant(date, start, timeZone), end: zonedInstant(date, end, timeZone) };
}

function commuteWindow(
  day: DayRef,
  kind: 'outbound' | 'return',
  time: LocalTime,
  bike: boolean,
): DayWindow {
  const at = zonedInstant(day.date, time, day.timeZone);
  return {
    kind,
    temperature: { start: at, end: addMinutes(at, COMMUTE_DURATION_MINUTES) },
    rain: {
      start: addMinutes(at, -COMMUTE_RAIN_MARGIN_MINUTES),
      end: addMinutes(at, COMMUTE_RAIN_MARGIN_MINUTES),
    },
    bikeCorrected: bike,
  };
}

function plainWindow(kind: 'lunch' | 'activeDay', span: Interval): DayWindow {
  return { kind, temperature: span, rain: span, bikeCorrected: false };
}

/**
 * The windows that constrain the outfit (SPEC §6.2):
 * - office: outbound and return commutes;
 * - remote: commutes only if a commute was added for the day;
 * - relax, sport: the whole active day;
 * - office and remote: 11:00–15:00 when "Je sors le midi" is on.
 * An empty list means an indoor day.
 */
export function constrainingWindows(
  day: DayRef,
  context: DayContext,
  settings: WindowSettings,
): DayWindow[] {
  const bike = context.commuteModes.includes('bike');
  const commutes = (): DayWindow[] => [
    commuteWindow(day, 'outbound', settings.officeDepartureTime, bike),
    commuteWindow(day, 'return', settings.officeReturnTime, bike),
  ];
  const lunch = (): DayWindow[] =>
    settings.lunchOutingEnabled
      ? [plainWindow('lunch', interval(day, LUNCH_WINDOW.start, LUNCH_WINDOW.end))]
      : [];

  switch (context.activity) {
    case 'office':
      return [...commutes(), ...lunch()];
    case 'remote':
      return [...(context.commuteModes.length > 0 ? commutes() : []), ...lunch()];
    case 'relax':
    case 'sport':
      return [activeDayWindow(day, settings)];
    default: {
      const exhaustive: never = context.activity;
      throw new Error(`Unknown activity: ${String(exhaustive)}`);
    }
  }
}

/** The active day, also used for the category of indoor days and for reminders. */
export function activeDayWindow(day: DayRef, settings: WindowSettings): DayWindow {
  return plainWindow('activeDay', interval(day, settings.activeDayStart, settings.activeDayEnd));
}
