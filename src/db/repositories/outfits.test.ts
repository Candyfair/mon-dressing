/**
 * @jest-environment node
 */
import { eq, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

import type { SubtypeKey } from '../../domain/catalogue/subtypes';
import type { DayContext } from '../../domain/types';
import { ensureDefaults } from '../bootstrap';
import { garmentEvents, garments, outfitItems, outfits } from '../schema';
import { createTestDb, type TestDb } from '../testing/createTestDb';
import { loadEngineGarments } from './engineInputs';
import { applyLifecycle, insertGarment } from './garmentLifecycle';
import { saveProbableOutfit, todayOutfit, undoValidation, validateOutfit } from './outfits';
import { getActiveWardrobe } from './wardrobes';

const T0 = new Date('2026-11-19T07:00:00.000Z');
const LATER = new Date('2026-11-19T07:05:00.000Z');
const DATE = '2026-11-19';
const CONTEXT: DayContext = { activity: 'office', commuteModes: ['bike'], occasion: 'everyday' };
const deps = (now: Date) => ({ now, newId: randomUUID });

function setup() {
  const { db } = createTestDb();
  ensureDefaults(db, { now: T0, newId: randomUUID, timeZone: 'Europe/Paris' });
  const wardrobeId = getActiveWardrobe(db).id;
  const pieces: [string, SubtypeKey][] = [
    ['tee', 'tshirt'],
    ['shirt', 'shirt'],
    ['jeans', 'jeans'],
    ['sneakers', 'sneakers'],
  ];
  for (const [id, subtype] of pieces) {
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
        cutout: { status: 'pending' },
      },
      { now: T0 },
    );
  }
  return { db, wardrobeId };
}

function wearCount(db: TestDb, id: string) {
  return db.select().from(garments).where(eq(garments.id, id)).get()?.wearCount;
}

function events(db: TestDb, garmentId: string) {
  return db
    .select()
    .from(garmentEvents)
    .where(eq(garmentEvents.garmentId, garmentId))
    .orderBy(garmentEvents.occurredAt, sql`rowid`)
    .all()
    .map((event) => [event.type, event.source]);
}

function outfitRows(db: TestDb) {
  return db.select().from(outfits).all();
}

describe('validateOutfit', () => {
  it('writes the outfit with its context and wears every piece', () => {
    const { db, wardrobeId } = setup();
    const selection = { top: 'tee', bottom: 'jeans', shoes: 'sneakers' };

    expect(
      validateOutfit(db, { wardrobeId, date: DATE, context: CONTEXT, selection }, deps(T0)),
    ).toEqual({ ok: true });

    const today = todayOutfit(db, wardrobeId, DATE);
    expect(today).toEqual({ status: 'validated', id: expect.any(String), selection });
    expect(outfitRows(db)).toEqual([
      expect.objectContaining({
        status: 'validated',
        activity: 'office',
        commuteModes: ['bike'],
        occasion: 'everyday',
        validatedAt: T0,
      }),
    ]);
    expect([wearCount(db, 'tee'), wearCount(db, 'jeans'), wearCount(db, 'sneakers')]).toEqual([
      1, 1, 1,
    ]);
    expect(events(db, 'tee')).toEqual([['worn', 'today']]);
  });

  it('writes nothing when a piece cannot be worn', () => {
    const { db, wardrobeId } = setup();
    applyLifecycle(
      db,
      [{ garmentId: 'jeans', command: { type: 'setStatus', status: 'dirty' } }],
      deps(T0),
    );

    const result = validateOutfit(
      db,
      { wardrobeId, date: DATE, context: CONTEXT, selection: { top: 'tee', bottom: 'jeans' } },
      deps(LATER),
    );

    expect(result).toMatchObject({ ok: false, reason: 'notAllowed' });
    expect(outfitRows(db)).toEqual([]);
    expect(db.select().from(outfitItems).all()).toEqual([]);
    expect(wearCount(db, 'tee')).toBe(0);
    expect(todayOutfit(db, wardrobeId, DATE)).toEqual({ status: 'none' });
  });
  it('is refused while the day is already validated', () => {
    const { db, wardrobeId } = setup();
    const day = { wardrobeId, date: DATE, context: CONTEXT };
    validateOutfit(db, { ...day, selection: { top: 'tee', bottom: 'jeans' } }, deps(T0));

    expect(
      validateOutfit(db, { ...day, selection: { top: 'shirt', bottom: 'jeans' } }, deps(LATER)),
    ).toEqual({ ok: false, reason: 'alreadyValidated' });
    expect([wearCount(db, 'tee'), wearCount(db, 'shirt'), wearCount(db, 'jeans')]).toEqual([
      1, 0, 1,
    ]);
    expect(todayOutfit(db, wardrobeId, DATE)).toMatchObject({
      selection: { top: 'tee', bottom: 'jeans' },
    });
  });
});

describe('undoValidation', () => {
  it('takes back the wears, then a new validation reuses the day’s row', () => {
    const { db, wardrobeId } = setup();
    const day = { wardrobeId, date: DATE, context: CONTEXT };
    validateOutfit(db, { ...day, selection: { top: 'tee', bottom: 'jeans' } }, deps(T0));

    expect(undoValidation(db, wardrobeId, DATE, deps(LATER))).toEqual({ ok: true });
    expect(todayOutfit(db, wardrobeId, DATE)).toEqual({ status: 'none' });
    expect([wearCount(db, 'tee'), wearCount(db, 'jeans')]).toEqual([0, 0]);
    expect(events(db, 'tee')).toEqual([
      ['worn', 'today'],
      ['unworn', 'today'],
    ]);

    validateOutfit(db, { ...day, selection: { top: 'shirt', bottom: 'jeans' } }, deps(LATER));
    expect(outfitRows(db)).toHaveLength(1);
    expect(todayOutfit(db, wardrobeId, DATE)).toMatchObject({
      status: 'validated',
      selection: { top: 'shirt', bottom: 'jeans' },
    });
    expect([wearCount(db, 'tee'), wearCount(db, 'shirt'), wearCount(db, 'jeans')]).toEqual([
      0, 1, 1,
    ]);
  });

  it('forgets an undone wear in the last-worn date', () => {
    const { db, wardrobeId } = setup();
    const day = { wardrobeId, date: DATE, context: CONTEXT };
    validateOutfit(db, { ...day, selection: { top: 'tee', bottom: 'jeans' } }, deps(T0));
    undoValidation(db, wardrobeId, DATE, deps(LATER));
    validateOutfit(db, { ...day, selection: { top: 'shirt', bottom: 'jeans' } }, deps(LATER));

    const lastWorn = new Map(
      loadEngineGarments(db, wardrobeId).map((garment) => [garment.id, garment.lastWornAt]),
    );
    expect(lastWorn.get('tee')).toBeNull();
    expect(lastWorn.get('shirt')).toEqual(LATER);
    expect(lastWorn.get('jeans')).toEqual(LATER);
  });

  it('is refused without a validation or once the outfit is sorted', () => {
    const { db, wardrobeId } = setup();
    expect(undoValidation(db, wardrobeId, DATE, deps(T0))).toEqual({
      ok: false,
      reason: 'notValidated',
    });

    validateOutfit(
      db,
      { wardrobeId, date: DATE, context: CONTEXT, selection: { top: 'tee', bottom: 'jeans' } },
      deps(T0),
    );
    db.update(outfits).set({ sortedAt: LATER }).run();

    expect(undoValidation(db, wardrobeId, DATE, deps(LATER))).toEqual({
      ok: false,
      reason: 'alreadySorted',
    });
    expect(wearCount(db, 'tee')).toBe(1);
  });
});

describe('saveProbableOutfit', () => {
  it('keeps the last outfit shown, and removes it when incomplete', () => {
    const { db, wardrobeId } = setup();
    const day = { wardrobeId, date: DATE, context: CONTEXT };

    saveProbableOutfit(db, { ...day, selection: { top: 'tee', bottom: 'jeans' } }, deps(T0));
    saveProbableOutfit(db, { ...day, selection: { top: 'shirt', bottom: 'jeans' } }, deps(LATER));
    expect(outfitRows(db)).toEqual([
      expect.objectContaining({ status: 'probable', validatedAt: null }),
    ]);
    expect(
      db
        .select()
        .from(outfitItems)
        .all()
        .map((item) => item.garmentId)
        .sort(),
    ).toEqual(['jeans', 'shirt']);
    // A probable outfit wears nothing.
    expect(wearCount(db, 'shirt')).toBe(0);

    saveProbableOutfit(db, { ...day, selection: null }, deps(LATER));
    expect(outfitRows(db)).toEqual([]);
  });

  it('changes nothing once the outfit is validated', () => {
    const { db, wardrobeId } = setup();
    const day = { wardrobeId, date: DATE, context: CONTEXT };
    validateOutfit(db, { ...day, selection: { top: 'tee', bottom: 'jeans' } }, deps(T0));

    saveProbableOutfit(db, { ...day, selection: { top: 'shirt', bottom: 'jeans' } }, deps(LATER));

    expect(outfitRows(db).map((row) => row.status)).toEqual(['validated']);
  });
});
