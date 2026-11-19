/**
 * @jest-environment node
 */
import { randomUUID } from 'node:crypto';

import type { SubtypeKey } from '../../domain/catalogue/subtypes';
import type { Usage } from '../../domain/types';
import { ensureDefaults } from '../bootstrap';
import { garmentEvents, outfitItems, outfits, wardrobes, wearLimits } from '../schema';
import { createTestDb, type TestDb } from '../testing/createTestDb';
import { loadEngineGarments, yesterdayOutfit } from './engineInputs';
import { insertGarment } from './garmentLifecycle';
import { getSettings } from './settings';
import { getActiveWardrobe, setWardrobeLocation } from './wardrobes';

const T0 = new Date('2026-11-10T08:00:00.000Z');

function setup() {
  const { db } = createTestDb();
  ensureDefaults(db, { now: T0, newId: randomUUID, timeZone: 'Europe/Paris' });
  return { db, wardrobeId: getActiveWardrobe(db).id };
}

function add(
  db: TestDb,
  wardrobeId: string,
  id: string,
  subtype: SubtypeKey,
  usages: Usage[] = [],
) {
  insertGarment(
    db,
    {
      id,
      wardrobeId,
      subtype,
      isFavorite: false,
      statementPiece: false,
      needsIroning: false,
      usages,
      photoOriginalPath: `photos/${id}/original.jpg`,
      cutout: { status: 'pending' },
    },
    { now: T0 },
  );
}

function worn(db: TestDb, garmentId: string, at: string) {
  db.insert(garmentEvents)
    .values({
      id: randomUUID(),
      garmentId,
      type: 'worn',
      source: 'today',
      occurredAt: new Date(at),
    })
    .run();
}

describe('loadEngineGarments', () => {
  it('returns each garment with its usages, wear limit and last worn instant', () => {
    const { db, wardrobeId } = setup();
    add(db, wardrobeId, 'tee', 'tshirt', ['weather.hot', 'activity.remote']);
    add(db, wardrobeId, 'boots', 'ankleBoots');
    db.update(wearLimits).set({ maxWears: 6 }).run();
    worn(db, 'tee', '2026-11-12T07:00:00.000Z');
    worn(db, 'tee', '2026-11-14T07:00:00.000Z');

    const byId = new Map(
      loadEngineGarments(db, wardrobeId).map((garment) => [garment.id, garment]),
    );

    expect(byId.get('tee')).toMatchObject({
      slot: 'top',
      usages: expect.arrayContaining(['weather.hot', 'activity.remote']),
      maxWears: 6,
      lastWornAt: new Date('2026-11-14T07:00:00.000Z'),
      location: 'stored',
      wearCount: 0,
    });
    expect(byId.get('boots')).toMatchObject({ slot: 'shoes', maxWears: null, lastWornAt: null });
  });

  it('only reads the given wardrobe', () => {
    const { db, wardrobeId } = setup();
    db.insert(wardrobes)
      .values({
        id: 'other',
        name: 'Valise',
        kind: 'secondary',
        timeZone: 'Europe/Paris',
        createdAt: T0,
      })
      .run();
    add(db, 'other', 'elsewhere', 'tshirt');
    expect(loadEngineGarments(db, wardrobeId)).toEqual([]);
  });
});

describe('yesterdayOutfit', () => {
  function seedOutfit(
    db: TestDb,
    wardrobeId: string,
    date: string,
    status: 'validated' | 'probable',
    garmentId: string,
    validatedAt: Date | null = status === 'validated' ? T0 : null,
  ) {
    const id = randomUUID();
    db.insert(outfits)
      .values({
        id,
        wardrobeId,
        date,
        status,
        activity: 'office',
        commuteModes: [],
        occasion: 'everyday',
        validatedAt,
        createdAt: T0,
      })
      .run();
    db.insert(outfitItems).values({ outfitId: id, slot: 'top', garmentId }).run();
  }

  it('ignores an undone validation', () => {
    const { db, wardrobeId } = setup();
    add(db, wardrobeId, 'tee', 'tshirt');
    add(db, wardrobeId, 'shirt', 'shirt');
    seedOutfit(db, wardrobeId, '2026-11-15', 'probable', 'tee');
    seedOutfit(db, wardrobeId, '2026-11-15', 'validated', 'shirt', null);
    expect(yesterdayOutfit(db, wardrobeId, '2026-11-16')).toEqual({ top: 'tee' });
  });

  it('prefers the validated outfit, falls back to the probable one', () => {
    const { db, wardrobeId } = setup();
    add(db, wardrobeId, 'tee', 'tshirt');
    add(db, wardrobeId, 'shirt', 'shirt');
    seedOutfit(db, wardrobeId, '2026-11-15', 'probable', 'tee');
    expect(yesterdayOutfit(db, wardrobeId, '2026-11-16')).toEqual({ top: 'tee' });
    seedOutfit(db, wardrobeId, '2026-11-15', 'validated', 'shirt');
    expect(yesterdayOutfit(db, wardrobeId, '2026-11-16')).toEqual({ top: 'shirt' });
  });

  it('returns null without an outfit yesterday', () => {
    const { db, wardrobeId } = setup();
    expect(yesterdayOutfit(db, wardrobeId, '2026-11-16')).toBeNull();
  });
});

describe('wardrobes', () => {
  it('stores the city of the wardrobe and reads the settings', () => {
    const { db, wardrobeId } = setup();
    setWardrobeLocation(db, wardrobeId, { cityName: 'Rennes', latitude: 48.11, longitude: -1.68 });
    expect(getActiveWardrobe(db)).toMatchObject({ cityName: 'Rennes', latitude: 48.11 });
    expect(getSettings(db).rotationPace).toBe('long');
  });
});
