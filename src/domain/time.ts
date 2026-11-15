// Calendar dates and wall-clock times in a wardrobe's time zone (DATA_MODEL §1).
// Pure: the time zone is always passed in, and conversions go through Intl so
// daylight saving switches are handled by the platform's time zone database.

/** A local calendar date, `YYYY-MM-DD`. */
export type LocalDate = string;
/** A local time of day, `HH:mm`. */
export type LocalTime = string;

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

interface WallClock {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

function wallClock(instant: Date, timeZone: string): WallClock {
  const parts: Partial<Record<Intl.DateTimeFormatPartTypes, number>> = {};
  for (const part of formatterFor(timeZone).formatToParts(instant)) {
    if (part.type !== 'literal') {
      parts[part.type] = Number(part.value);
    }
  }
  return {
    year: parts.year ?? 0,
    month: parts.month ?? 0,
    day: parts.day ?? 0,
    hour: parts.hour ?? 0,
    minute: parts.minute ?? 0,
  };
}

// Offset of the zone from UTC at this instant, in ms (Paris in winter: +1 h).
function offsetMs(instant: Date, timeZone: string): number {
  const { year, month, day, hour, minute } = wallClock(instant, timeZone);
  const asUtc = Date.UTC(year, month - 1, day, hour, minute);
  return asUtc - Math.floor(instant.getTime() / MINUTE_MS) * MINUTE_MS;
}

function parseDate(date: LocalDate): [number, number, number] {
  const [year, month, day] = date.split('-').map(Number);
  return [year, month, day];
}

function parseTime(time: LocalTime): [number, number] {
  const [hour, minute] = time.split(':').map(Number);
  return [hour, minute];
}

const pad = (value: number) => String(value).padStart(2, '0');

/**
 * The instant a wall clock shows `time` on `date`. A time skipped by the
 * spring switch (02:30 in Paris) lands one hour later, as a clock would.
 */
export function zonedInstant(date: LocalDate, time: LocalTime, timeZone: string): Date {
  const [year, month, day] = parseDate(date);
  const [hour, minute] = parseTime(time);
  const asUtc = Date.UTC(year, month - 1, day, hour, minute);
  const firstGuess = asUtc - offsetMs(new Date(asUtc), timeZone);
  const offset = offsetMs(new Date(firstGuess), timeZone);
  return new Date(asUtc - offset);
}

/** The local calendar date of an instant. */
export function localDate(instant: Date, timeZone: string): LocalDate {
  const { year, month, day } = wallClock(instant, timeZone);
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** The local time of day of an instant. */
export function localTime(instant: Date, timeZone: string): LocalTime {
  const { hour, minute } = wallClock(instant, timeZone);
  return `${pad(hour)}:${pad(minute)}`;
}

/** Calendar arithmetic on a local date, independent of any time zone. */
export function addDays(date: LocalDate, days: number): LocalDate {
  const [year, month, day] = parseDate(date);
  const shifted = new Date(Date.UTC(year, month - 1, day) + days * DAY_MS);
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

/** Number of calendar days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  const [y1, m1, d1] = parseDate(from);
  const [y2, m2, d2] = parseDate(to);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / DAY_MS);
}

/** ISO weekday of a local date: 1 = Monday … 7 = Sunday. */
export function isoWeekday(date: LocalDate): number {
  const [year, month, day] = parseDate(date);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return weekday === 0 ? 7 : weekday;
}

/** Shifts an instant by whole minutes. */
export function addMinutes(instant: Date, minutes: number): Date {
  return new Date(instant.getTime() + minutes * MINUTE_MS);
}
