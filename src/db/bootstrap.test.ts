/**
 * @jest-environment node
 */
import { randomUUID } from 'node:crypto';

import { ensureDefaults } from './bootstrap';
import { settings, wardrobes } from './schema';
import { createTestDb, type TestDb } from './testing/createTestDb';

const NOW = new Date('2026-11-09T08:00:00.000Z');

function bootstrap(db: TestDb) {
  ensureDefaults(db, { now: NOW, newId: randomUUID, timeZone: 'Europe/Paris' });
}

describe('ensureDefaults', () => {
  it('creates the main wardrobe without a city and the settings row with defaults', () => {
    const { db } = createTestDb();

    bootstrap(db);

    const allWardrobes = db.select().from(wardrobes).all();
    expect(allWardrobes).toHaveLength(1);
    const [wardrobe] = allWardrobes;
    expect(wardrobe).toMatchObject({
      kind: 'main',
      cityName: null,
      latitude: null,
      longitude: null,
      timeZone: 'Europe/Paris',
      createdAt: NOW,
    });

    const allSettings = db.select().from(settings).all();
    expect(allSettings).toEqual([
      {
        id: 'singleton',
        activeWardrobeId: wardrobe.id,
        commuteModes: [],
        officeDepartureTime: '08:30',
        officeReturnTime: '18:30',
        lunchOutingEnabled: false,
        activeDayStart: '09:00',
        activeDayEnd: '20:00',
        outfitReadyTime: '07:00',
        eveningSortTime: '20:00',
        airingEnabled: null,
        dryingRackCountsAsStorage: true,
        dryingDelayHours: 24,
        morningNotification: false,
        eveningSortNotification: false,
        laundryDryNotification: false,
        useGeolocation: false,
        language: 'fr',
        onboardingCompletedAt: null,
        demoCleanupOfferedAt: null,
        hintsSeen: [],
      },
    ]);
  });

  it('is idempotent', () => {
    const { db } = createTestDb();

    bootstrap(db);
    const before = db.select().from(wardrobes).all();
    bootstrap(db);

    expect(db.select().from(wardrobes).all()).toEqual(before);
    expect(db.select().from(settings).all()).toHaveLength(1);
  });
});
