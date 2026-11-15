import {
  addDays,
  addMinutes,
  daysBetween,
  isoWeekday,
  localDate,
  localTime,
  zonedInstant,
} from './time';

const PARIS = 'Europe/Paris';

describe('zonedInstant', () => {
  it('converts a winter and a summer wall clock in Paris', () => {
    expect(zonedInstant('2026-11-16', '08:30', PARIS).toISOString()).toBe(
      '2026-11-16T07:30:00.000Z',
    );
    expect(zonedInstant('2026-07-01', '08:30', PARIS).toISOString()).toBe(
      '2026-07-01T06:30:00.000Z',
    );
  });

  it('handles the spring switch (29 March 2026)', () => {
    expect(zonedInstant('2026-03-29', '01:30', PARIS).toISOString()).toBe(
      '2026-03-29T00:30:00.000Z',
    );
    expect(zonedInstant('2026-03-29', '08:30', PARIS).toISOString()).toBe(
      '2026-03-29T06:30:00.000Z',
    );
    // 02:30 does not exist that night: the clock reads 03:30.
    expect(localTime(zonedInstant('2026-03-29', '02:30', PARIS), PARIS)).toBe('03:30');
  });

  it('handles the autumn switch (25 October 2026)', () => {
    expect(zonedInstant('2026-10-25', '08:30', PARIS).toISOString()).toBe(
      '2026-10-25T07:30:00.000Z',
    );
    expect(zonedInstant('2026-10-24', '08:30', PARIS).toISOString()).toBe(
      '2026-10-24T06:30:00.000Z',
    );
  });

  it('handles midnight and other zones', () => {
    expect(zonedInstant('2026-11-16', '00:00', PARIS).toISOString()).toBe(
      '2026-11-15T23:00:00.000Z',
    );
    expect(zonedInstant('2026-11-16', '08:30', 'America/New_York').toISOString()).toBe(
      '2026-11-16T13:30:00.000Z',
    );
  });
});

describe('localDate and localTime', () => {
  it('reads the wall clock of an instant in the wardrobe zone', () => {
    const lateEvening = new Date('2026-11-15T23:30:00.000Z');
    expect(localDate(lateEvening, PARIS)).toBe('2026-11-16');
    expect(localTime(lateEvening, PARIS)).toBe('00:30');
    expect(localDate(lateEvening, 'UTC')).toBe('2026-11-15');
  });
});

describe('calendar arithmetic', () => {
  it('adds days across months and years', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('counts calendar days, whatever the time switches', () => {
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
    expect(daysBetween('2026-11-16', '2026-11-15')).toBe(-1);
  });

  it('gives the ISO weekday', () => {
    expect(isoWeekday('2026-11-16')).toBe(1);
    expect(isoWeekday('2026-11-15')).toBe(7);
  });

  it('shifts instants by minutes', () => {
    expect(addMinutes(new Date('2026-11-16T07:30:00.000Z'), -60).toISOString()).toBe(
      '2026-11-16T06:30:00.000Z',
    );
  });
});
