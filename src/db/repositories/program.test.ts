/**
 * @jest-environment node
 */
import { dayOverrides, weeklyProgram } from '../schema';
import { createTestDb } from '../testing/createTestDb';
import { dayProgram } from './program';

// 2026-11-17 is a Tuesday (ISO weekday 2).
const TUESDAY = '2026-11-17';

describe('dayProgram', () => {
  it('has nothing before the weekly program is set', () => {
    const { db } = createTestDb();
    expect(dayProgram(db, TUESDAY)).toEqual({ weekdayActivity: null, override: null });
  });

  it("reads the weekday's activity and the date's override", () => {
    const { db } = createTestDb();
    db.insert(weeklyProgram)
      .values([
        { weekday: 1, activity: 'remote' },
        { weekday: 2, activity: 'office' },
      ])
      .run();
    db.insert(dayOverrides)
      .values({ date: TUESDAY, activity: null, commuteModes: ['bike'], occasion: 'festive' })
      .run();
    expect(dayProgram(db, TUESDAY)).toEqual({
      weekdayActivity: 'office',
      override: { activity: null, commuteModes: ['bike'], occasion: 'festive' },
    });
    expect(dayProgram(db, '2026-11-18').override).toBeNull();
  });
});
