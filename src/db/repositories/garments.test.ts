/**
 * @jest-environment node
 */
import { eq } from 'drizzle-orm';

import type { SubtypeKey } from '../../domain/catalogue/subtypes';
import type { NewGarmentCutout } from '../../domain/types';
import { garments, wardrobes } from '../schema';
import { createTestDb, type TestDb } from '../testing/createTestDb';
import { insertGarment } from './garmentLifecycle';
import {
  garmentThumbnails,
  getGarmentDetails,
  pendingCutouts,
  recentSubtypes,
  setCutoutResult,
  setGarmentDetails,
} from './garments';

const T0 = new Date('2026-11-13T08:00:00.000Z');
const minutes = (n: number) => new Date(T0.getTime() + n * 60_000);

function seedWardrobe(db: TestDb) {
  db.insert(wardrobes)
    .values({ id: 'w', name: 'Principale', kind: 'main', timeZone: 'Europe/Paris', createdAt: T0 })
    .run();
}

function add(
  db: TestDb,
  id: string,
  cutout: NewGarmentCutout,
  at: Date,
  subtype: SubtypeKey = 'tshirt',
  wardrobeId = 'w',
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
      usages: [],
      photoOriginalPath: `photos/${id}/original.jpg`,
      cutout,
    },
    { now: at },
  );
}

describe('setCutoutResult', () => {
  it('stores a finished cutout', () => {
    const { db } = createTestDb();
    seedWardrobe(db);
    add(db, 'a', { status: 'pending' }, T0);
    setCutoutResult(db, 'a', { status: 'done', path: 'photos/a/cutout.png' }, { now: minutes(1) });
    expect(db.select().from(garments).where(eq(garments.id, 'a')).get()).toMatchObject({
      cutoutStatus: 'done',
      photoCutoutPath: 'photos/a/cutout.png',
      updatedAt: minutes(1),
    });
  });

  it('stores a failure without a cutout path', () => {
    const { db } = createTestDb();
    seedWardrobe(db);
    add(db, 'a', { status: 'pending' }, T0);
    setCutoutResult(db, 'a', { status: 'failed' }, { now: minutes(1) });
    expect(db.select().from(garments).where(eq(garments.id, 'a')).get()).toMatchObject({
      cutoutStatus: 'failed',
      photoCutoutPath: null,
    });
  });
});

describe('pendingCutouts', () => {
  it('lists only pending garments, oldest first', () => {
    const { db } = createTestDb();
    seedWardrobe(db);
    add(db, 'late', { status: 'pending' }, minutes(2));
    add(db, 'done', { status: 'done', path: 'photos/done/cutout.png' }, minutes(1));
    add(db, 'failed', { status: 'failed' }, minutes(1));
    add(db, 'early', { status: 'pending' }, minutes(0));
    expect(pendingCutouts(db)).toEqual([
      { id: 'early', photoOriginalPath: 'photos/early/original.jpg' },
      { id: 'late', photoOriginalPath: 'photos/late/original.jpg' },
    ]);
  });
});

describe('recentSubtypes', () => {
  it('lists the last distinct types of the wardrobe, most recent first', () => {
    const { db } = createTestDb();
    seedWardrobe(db);
    db.insert(wardrobes)
      .values({
        id: 'other',
        name: 'Vacances',
        kind: 'secondary',
        timeZone: 'Europe/Paris',
        createdAt: T0,
      })
      .run();
    const pending = { status: 'pending' } as const;
    add(db, 'a', pending, minutes(0), 'tshirt');
    add(db, 'b', pending, minutes(1), 'jeans');
    add(db, 'c', pending, minutes(2), 'shirt');
    add(db, 'd', pending, minutes(3), 'tshirt');
    add(db, 'e', pending, minutes(4), 'dress', 'other');
    add(db, 'f', pending, minutes(5), 'sweater');

    expect(recentSubtypes(db, 'w', 3)).toEqual(['sweater', 'tshirt', 'shirt']);
    expect(recentSubtypes(db, 'other', 3)).toEqual(['dress']);
  });
});

describe('garment details', () => {
  it('replaces the flags and the usages together', () => {
    const { db } = createTestDb();
    seedWardrobe(db);
    add(db, 'a', { status: 'pending' }, T0);
    setGarmentDetails(
      db,
      'a',
      { isFavorite: true, statementPiece: false, usages: ['weather.cold', 'activity.remote'] },
      { now: minutes(1) },
    );
    setGarmentDetails(
      db,
      'a',
      { isFavorite: true, statementPiece: true, usages: ['weather.hot'] },
      { now: minutes(2) },
    );
    expect(getGarmentDetails(db, 'a')).toEqual({
      isFavorite: true,
      statementPiece: true,
      usages: ['weather.hot'],
    });
    expect(db.select().from(garments).where(eq(garments.id, 'a')).get()?.updatedAt).toEqual(
      minutes(2),
    );
  });
});

describe('garmentThumbnails', () => {
  it('prefers the cutout and stays in the wardrobe', () => {
    const { db } = createTestDb();
    seedWardrobe(db);
    add(db, 'a', { status: 'done', path: 'photos/a/cutout.png' }, T0);
    add(db, 'b', { status: 'pending' }, T0);
    db.insert(wardrobes)
      .values({
        id: 'x',
        name: 'Valise',
        kind: 'secondary',
        timeZone: 'Europe/Paris',
        createdAt: T0,
      })
      .run();
    add(db, 'c', { status: 'pending' }, T0, 'tshirt', 'x');
    expect(garmentThumbnails(db, 'w')).toEqual(
      expect.arrayContaining([
        { id: 'a', name: null, subtype: 'tshirt', photoPath: 'photos/a/cutout.png' },
        { id: 'b', name: null, subtype: 'tshirt', photoPath: 'photos/b/original.jpg' },
      ]),
    );
    expect(garmentThumbnails(db, 'w')).toHaveLength(2);
  });
});
