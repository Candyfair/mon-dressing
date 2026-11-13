/**
 * @jest-environment node
 */
import { eq } from 'drizzle-orm';

import { garments, wardrobes } from '../schema';
import { createTestDb, type TestDb } from '../testing/createTestDb';
import { insertGarment, type NewGarmentCutout } from './garmentLifecycle';
import { pendingCutouts, setCutoutResult } from './garments';

const T0 = new Date('2026-11-13T08:00:00.000Z');
const minutes = (n: number) => new Date(T0.getTime() + n * 60_000);

function seedWardrobe(db: TestDb) {
  db.insert(wardrobes)
    .values({ id: 'w', name: 'Principale', kind: 'main', timeZone: 'Europe/Paris', createdAt: T0 })
    .run();
}

function add(db: TestDb, id: string, cutout: NewGarmentCutout, at: Date) {
  insertGarment(
    db,
    {
      id,
      wardrobeId: 'w',
      subtype: 'tshirt',
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
