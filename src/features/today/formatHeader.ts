import type { TFunction } from 'i18next';

import { isoWeekday, type LocalDate } from '../../domain/time';

// Typed keys: i18next checks them against the locale.
const WEEKDAYS = [
  'today.weekdays.1',
  'today.weekdays.2',
  'today.weekdays.3',
  'today.weekdays.4',
  'today.weekdays.5',
  'today.weekdays.6',
  'today.weekdays.7',
] as const;
const MONTHS = [
  'today.months.1',
  'today.months.2',
  'today.months.3',
  'today.months.4',
  'today.months.5',
  'today.months.6',
  'today.months.7',
  'today.months.8',
  'today.months.9',
  'today.months.10',
  'today.months.11',
  'today.months.12',
] as const;

function at<T>(keys: readonly T[], position: number): T {
  const key = keys[position - 1];
  if (key === undefined) {
    throw new Error(`No key at position ${position}`);
  }
  return key;
}

/** « Lun. 27 oct. » */
export function formatShortDate(date: LocalDate, t: TFunction): string {
  const [, month = 0, day] = date.split('-').map(Number);
  return t('today.date', {
    weekday: t(at(WEEKDAYS, isoWeekday(date))),
    day,
    month: t(at(MONTHS, month)),
  });
}

/** « 9° », « −2° »: a true minus sign, as in the mockups. */
export function formatDegrees(value: number): string {
  return `${value < 0 ? '−' : ''}${Math.abs(value)}°`;
}
