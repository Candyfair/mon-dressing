/**
 * @jest-environment node
 */
import { eq } from 'drizzle-orm';

import {
  garmentEvents,
  garments,
  garmentUsages,
  outfitItems,
  outfits,
  wardrobes,
  wearLimits,
} from './schema';
import { createTestDb, type TestDb } from './testing/createTestDb';

const NOW = new Date('2026-11-09T08:00:00.000Z');

function seedWardrobe(db: TestDb, id = 'wardrobe-1') {
  db.insert(wardrobes)
    .values({ id, name: 'Principale', kind: 'main', timeZone: 'Europe/Paris', createdAt: NOW })
    .run();
  return id;
}

// Direct inserts are allowed in tests (scripts/check-lifecycle-writes.js).
function seedGarment(db: TestDb, wardrobeId: string, id = 'garment-1', wearCount = 0) {
  db.insert(garments)
    .values({
      id,
      wardrobeId,
      slot: 'top',
      subtype: 'tshirt',
      wearCount,
      locationSince: NOW,
      photoOriginalPath: `photos/${id}/original.jpg`,
      createdAt: NOW,
      updatedAt: NOW,
    })
    .run();
  return id;
}

function seedOutfit(db: TestDb, wardrobeId: string, id = 'outfit-1') {
  db.insert(outfits)
    .values({
      id,
      wardrobeId,
      date: '2026-11-09',
      status: 'validated',
      activity: 'office',
      commuteModes: ['bike'],
      occasion: 'everyday',
      createdAt: NOW,
    })
    .run();
  return id;
}

function seedWornEvent(db: TestDb, garmentId: string, outfitId: string) {
  db.insert(garmentEvents)
    .values({
      id: 'event-1',
      garmentId,
      type: 'worn',
      source: 'eveningSort',
      outfitId,
      occurredAt: NOW,
    })
    .run();
}

describe('initial migration', () => {
  it('creates every table and index', () => {
    const { sqlite } = createTestDb();

    const names = (type: string) =>
      sqlite
        .prepare(
          `select name from sqlite_master where type = ? and name not like 'sqlite_%' and name not like '__drizzle%' order by name`,
        )
        .all(type)
        .map((row) => (row as { name: string }).name);

    expect(names('table')).toEqual([
      'dayOverrides',
      'garmentEvents',
      'garmentUsages',
      'garments',
      'outfitItems',
      'outfits',
      'settings',
      'wardrobes',
      'wearLimits',
      'weeklyProgram',
    ]);
    expect(names('index')).toEqual([
      'garment_events_garment_type_occurred_idx',
      'garment_events_type_occurred_idx',
      'garments_wardrobe_location_idx',
      'garments_wardrobe_slot_idx',
      'outfits_wardrobe_date_status_idx',
    ]);
  });

  it('applies the lifecycle safety defaults to a new garment', () => {
    const { db } = createTestDb();
    const garmentId = seedGarment(db, seedWardrobe(db));

    const garment = db.select().from(garments).where(eq(garments.id, garmentId)).get();

    expect(garment).toMatchObject({
      location: 'stored',
      wearCount: 0,
      toIron: false,
      cutoutStatus: 'pending',
      useCutout: true,
      isFavorite: false,
    });
  });
});

describe('foreign keys', () => {
  it('cascades a wardrobe deletion to its garments, usages, outfits, items and events', () => {
    const { db } = createTestDb();
    const wardrobeId = seedWardrobe(db);
    const garmentId = seedGarment(db, wardrobeId);
    const outfitId = seedOutfit(db, wardrobeId);
    db.insert(garmentUsages).values({ garmentId, usage: 'weather.cold' }).run();
    db.insert(outfitItems).values({ outfitId, slot: 'top', garmentId }).run();
    seedWornEvent(db, garmentId, outfitId);

    db.delete(wardrobes).where(eq(wardrobes.id, wardrobeId)).run();

    expect(db.select().from(garments).all()).toHaveLength(0);
    expect(db.select().from(garmentUsages).all()).toHaveLength(0);
    expect(db.select().from(outfits).all()).toHaveLength(0);
    expect(db.select().from(outfitItems).all()).toHaveLength(0);
    expect(db.select().from(garmentEvents).all()).toHaveLength(0);
  });

  it('keeps the outfit item with a null garment when the garment is deleted', () => {
    const { db } = createTestDb();
    const wardrobeId = seedWardrobe(db);
    const garmentId = seedGarment(db, wardrobeId);
    const outfitId = seedOutfit(db, wardrobeId);
    db.insert(outfitItems).values({ outfitId, slot: 'top', garmentId }).run();

    db.delete(garments).where(eq(garments.id, garmentId)).run();

    expect(db.select().from(outfitItems).all()).toEqual([
      { outfitId, slot: 'top', garmentId: null },
    ]);
  });

  it('keeps the garment history with a null outfit when the outfit is deleted', () => {
    const { db } = createTestDb();
    const wardrobeId = seedWardrobe(db);
    const garmentId = seedGarment(db, wardrobeId);
    const outfitId = seedOutfit(db, wardrobeId);
    seedWornEvent(db, garmentId, outfitId);

    db.delete(outfits).where(eq(outfits.id, outfitId)).run();

    const events = db.select().from(garmentEvents).all();
    expect(events).toHaveLength(1);
    expect(events[0].outfitId).toBeNull();
  });

  it('rejects a garment pointing to an unknown wardrobe', () => {
    const { db } = createTestDb();

    expect(() => seedGarment(db, 'missing-wardrobe')).toThrow(/FOREIGN KEY/);
  });
});

describe('constraints', () => {
  it('allows at most one outfit per wardrobe, date and status', () => {
    const { db } = createTestDb();
    const wardrobeId = seedWardrobe(db);
    seedOutfit(db, wardrobeId, 'outfit-1');

    expect(() => seedOutfit(db, wardrobeId, 'outfit-2')).toThrow(/UNIQUE/);
  });

  it('rejects a negative wear count', () => {
    const { db } = createTestDb();
    const wardrobeId = seedWardrobe(db);

    expect(() => seedGarment(db, wardrobeId, 'garment-1', -1)).toThrow(/CHECK/);
  });

  it('rejects a wear limit below 1', () => {
    const { db } = createTestDb();

    expect(() => db.insert(wearLimits).values({ subtype: 'tshirt', maxWears: 0 }).run()).toThrow(
      /CHECK/,
    );
  });
});
