import { isDryDue, recommendSort } from './recommendations';

describe('recommendSort', () => {
  it('recommends airing under the wear limit', () => {
    expect(recommendSort({ slot: 'top', wearCount: 1 }, 2, true)).toBe('airing');
  });

  it('recommends the laundry basket once the limit is reached', () => {
    expect(recommendSort({ slot: 'top', wearCount: 2 }, 2, true)).toBe('dirty');
    expect(recommendSort({ slot: 'bottom', wearCount: 11 }, 10, true)).toBe('dirty');
  });

  it('recommends putting away under the limit when airing is off', () => {
    expect(recommendSort({ slot: 'top', wearCount: 1 }, 2, false)).toBe('stored');
  });

  it('always puts shoes away', () => {
    expect(recommendSort({ slot: 'shoes', wearCount: 50 }, 1, true)).toBe('stored');
  });
});

describe('isDryDue', () => {
  const since = new Date('2026-11-08T09:00:00.000Z');

  it('is not due just before the delay', () => {
    const now = new Date('2026-11-09T08:59:59.999Z');
    expect(isDryDue({ location: 'drying', locationSince: since }, now, 24)).toBe(false);
  });

  it('is due when the delay has elapsed', () => {
    const now = new Date('2026-11-09T09:00:00.000Z');
    expect(isDryDue({ location: 'drying', locationSince: since }, now, 24)).toBe(true);
  });

  it('only applies to drying pieces', () => {
    const now = new Date('2026-11-12T09:00:00.000Z');
    expect(isDryDue({ location: 'dirty', locationSince: since }, now, 24)).toBe(false);
  });
});
