/**
 * @jest-environment node
 */
import { eq, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

import { isDryDue, recommendSort } from '../../domain/lifecycle';
import { garmentEvents, garments, outfits, wardrobes } from '../schema';
import { createTestDb, type TestDb } from '../testing/createTestDb';
import { applyLifecycle, type LifecycleOperation } from './garmentLifecycle';

const DAY_1 = new Date('2026-11-09T07:00:00.000Z');
const HOUR_MS = 60 * 60 * 1000;
const at = (hoursAfterDay1: number) => new Date(DAY_1.getTime() + hoursAfterDay1 * HOUR_MS);

function seed(db: TestDb) {
  db.insert(wardrobes)
    .values({
      id: 'w',
      name: 'Principale',
      kind: 'main',
      timeZone: 'Europe/Paris',
      createdAt: DAY_1,
    })
    .run();
  // Direct inserts are allowed in tests (scripts/check-lifecycle-writes.js).
  const pieces = [
    { id: 'tshirt', slot: 'top', subtype: 'tshirt', needsIroning: false },
    { id: 'jeans', slot: 'bottom', subtype: 'jeans', needsIroning: false },
    { id: 'shirt', slot: 'top', subtype: 'shirt', needsIroning: true },
  ] as const;
  for (const piece of pieces) {
    db.insert(garments)
      .values({
        ...piece,
        wardrobeId: 'w',
        locationSince: DAY_1,
        photoOriginalPath: `photos/${piece.id}/original.jpg`,
        createdAt: DAY_1,
        updatedAt: DAY_1,
      })
      .run();
  }
}

function seedOutfit(db: TestDb, id: string, date: string) {
  db.insert(outfits)
    .values({
      id,
      wardrobeId: 'w',
      date,
      status: 'validated',
      activity: 'office',
      commuteModes: [],
      occasion: 'everyday',
      createdAt: DAY_1,
    })
    .run();
}

function apply(db: TestDb, operations: LifecycleOperation[], now: Date) {
  return applyLifecycle(db, operations, { now, newId: randomUUID });
}

function state(db: TestDb, id: string) {
  const row = db.select().from(garments).where(eq(garments.id, id)).get();
  if (!row) {
    throw new Error(`missing garment ${id}`);
  }
  return { location: row.location, toIron: row.toIron, wearCount: row.wearCount };
}

function eventTypes(db: TestDb, id: string) {
  return (
    db
      .select()
      .from(garmentEvents)
      .where(eq(garmentEvents.garmentId, id))
      // Insertion order breaks ties between events of the same transaction.
      .orderBy(garmentEvents.occurredAt, sql`rowid`)
      .all()
      .map((event) => event.type)
  );
}

describe('applyLifecycle', () => {
  it('writes the garments and their events together', () => {
    const { db } = createTestDb();
    seed(db);
    seedOutfit(db, 'o1', '2026-11-09');

    const result = apply(
      db,
      [{ garmentId: 'tshirt', command: { type: 'sort', to: 'airing', outfitId: 'o1' } }],
      at(13),
    );

    expect(result).toEqual({ ok: true });
    const tshirt = db.select().from(garments).where(eq(garments.id, 'tshirt')).get();
    expect(tshirt).toMatchObject({ location: 'airing', locationSince: at(13), updatedAt: at(13) });
    expect(db.select().from(garmentEvents).all()).toEqual([
      expect.objectContaining({
        garmentId: 'tshirt',
        type: 'locationChanged',
        source: 'eveningSort',
        fromLocation: 'stored',
        toLocation: 'airing',
        toIron: null,
        outfitId: 'o1',
        occurredAt: at(13),
      }),
    ]);
  });

  it('writes nothing when one operation of the batch is not allowed', () => {
    const { db } = createTestDb();
    seed(db);
    db.insert(garments)
      .values({
        id: 'sneakers',
        wardrobeId: 'w',
        slot: 'shoes',
        subtype: 'sneakers',
        locationSince: DAY_1,
        photoOriginalPath: 'photos/sneakers/original.jpg',
        createdAt: DAY_1,
        updatedAt: DAY_1,
      })
      .run();

    const result = apply(
      db,
      [
        { garmentId: 'tshirt', command: { type: 'setStatus', status: 'dirty' } },
        { garmentId: 'sneakers', command: { type: 'setStatus', status: 'dirty' } },
      ],
      at(1),
    );

    expect(result).toEqual({
      ok: false,
      reason: 'notAllowed',
      operation: { garmentId: 'sneakers', command: { type: 'setStatus', status: 'dirty' } },
    });
    expect(state(db, 'tshirt').location).toBe('stored');
    expect(db.select().from(garmentEvents).all()).toHaveLength(0);
  });

  it('reports an unknown garment without writing', () => {
    const { db } = createTestDb();
    seed(db);

    const result = apply(
      db,
      [
        { garmentId: 'tshirt', command: { type: 'setStatus', status: 'dirty' } },
        { garmentId: 'missing', command: { type: 'setStatus', status: 'dirty' } },
      ],
      at(1),
    );

    expect(result).toMatchObject({ ok: false, reason: 'notFound' });
    expect(state(db, 'tshirt').location).toBe('stored');
  });

  it('skips operations that change nothing', () => {
    const { db } = createTestDb();
    seed(db);
    seedOutfit(db, 'o1', '2026-11-09');

    const result = apply(
      db,
      [{ garmentId: 'jeans', command: { type: 'sort', to: 'stored', outfitId: 'o1' } }],
      at(13),
    );

    expect(result).toEqual({ ok: true });
    expect(db.select().from(garmentEvents).all()).toHaveLength(0);
  });

  it('chains a wear and a sort on the same piece (probable outfit)', () => {
    const { db } = createTestDb();
    seed(db);
    seedOutfit(db, 'o1', '2026-11-09');

    apply(
      db,
      [
        { garmentId: 'tshirt', command: { type: 'wear', outfitId: 'o1', source: 'eveningSort' } },
        { garmentId: 'tshirt', command: { type: 'sort', to: 'airing', outfitId: 'o1' } },
      ],
      at(13),
    );

    expect(state(db, 'tshirt')).toEqual({ location: 'airing', toIron: false, wearCount: 1 });
    const events = db
      .select()
      .from(garmentEvents)
      .orderBy(sql`rowid`)
      .all();
    expect(events.map((event) => [event.type, event.source, event.outfitId])).toEqual([
      ['worn', 'eveningSort', 'o1'],
      ['locationChanged', 'eveningSort', 'o1'],
    ]);
  });
});

// SPEC §8 end-to-end verification: t-shirt (limit 2), jeans (limit 10),
// shirt (needsIroning) through two days of use and the laundry cycle.
describe('SPEC §8 walkthrough', () => {
  const LIMITS: Record<string, number> = { tshirt: 2, jeans: 10, shirt: 4 };
  const DRYING_DELAY_HOURS = 24;

  // Every step of the walkthrough must be allowed.
  function applyOk(db: TestDb, operations: LifecycleOperation[], now: Date) {
    expect(apply(db, operations, now)).toEqual({ ok: true });
  }

  function sortAsRecommended(db: TestDb, ids: string[], outfitId: string, now: Date) {
    const operations = ids.map((id): LifecycleOperation => {
      const piece = db.select().from(garments).where(eq(garments.id, id)).get();
      if (!piece) {
        throw new Error(`missing garment ${id}`);
      }
      return {
        garmentId: id,
        command: { type: 'sort', to: recommendSort(piece, LIMITS[id], true), outfitId },
      };
    });
    applyOk(db, operations, now);
  }

  it('walks every piece through use, sort, laundry, drying and ironing', () => {
    const { db } = createTestDb();
    seed(db);
    seedOutfit(db, 'o1', '2026-11-09');
    seedOutfit(db, 'o2', '2026-11-10');
    const wear = (id: string, outfitId: string): LifecycleOperation => ({
      garmentId: id,
      command: { type: 'wear', outfitId, source: 'today' },
    });

    // Day 1: validation, then evening sort as recommended.
    applyOk(db, [wear('tshirt', 'o1'), wear('jeans', 'o1'), wear('shirt', 'o1')], at(0));
    sortAsRecommended(db, ['tshirt', 'jeans'], 'o1', at(13));
    applyOk(
      db,
      [{ garmentId: 'shirt', command: { type: 'sort', to: 'dirty', outfitId: 'o1' } }],
      at(13),
    );
    expect(state(db, 'tshirt')).toEqual({ location: 'airing', toIron: false, wearCount: 1 });
    expect(state(db, 'jeans')).toEqual({ location: 'airing', toIron: false, wearCount: 1 });
    expect(state(db, 'shirt')).toEqual({ location: 'dirty', toIron: false, wearCount: 1 });

    // Day 2: the aired t-shirt reaches its limit and goes to the basket.
    applyOk(db, [wear('tshirt', 'o2'), wear('jeans', 'o2')], at(24));
    sortAsRecommended(db, ['tshirt', 'jeans'], 'o2', at(37));
    expect(state(db, 'tshirt')).toEqual({ location: 'dirty', toIron: false, wearCount: 2 });
    expect(state(db, 'jeans')).toEqual({ location: 'airing', toIron: false, wearCount: 2 });

    // Laundry: wash the basket.
    applyOk(
      db,
      ['tshirt', 'shirt'].map((id) => ({ garmentId: id, command: { type: 'washDone' } })),
      at(38),
    );
    expect(state(db, 'tshirt')).toEqual({ location: 'drying', toIron: false, wearCount: 0 });
    expect(state(db, 'shirt')).toEqual({ location: 'drying', toIron: true, wearCount: 0 });

    // Drying rack once the delay has elapsed.
    const drying = db.select().from(garments).where(eq(garments.location, 'drying')).all();
    expect(drying.filter((piece) => isDryDue(piece, at(61), DRYING_DELAY_HOURS))).toHaveLength(0);
    const due = drying.filter((piece) => isDryDue(piece, at(62), DRYING_DELAY_HOURS));
    applyOk(
      db,
      due.map((piece) => ({
        garmentId: piece.id,
        command: { type: 'markDry', source: 'automatic' },
      })),
      at(62),
    );
    expect(state(db, 'shirt')).toEqual({ location: 'onDryingRack', toIron: true, wearCount: 0 });

    // Put away: the shirt stays to iron ("clean basket"), then is ironed.
    applyOk(
      db,
      ['tshirt', 'shirt'].map((id) => ({ garmentId: id, command: { type: 'putAway' } })),
      at(70),
    );
    expect(state(db, 'tshirt')).toEqual({ location: 'stored', toIron: false, wearCount: 0 });
    expect(state(db, 'shirt')).toEqual({ location: 'stored', toIron: true, wearCount: 0 });
    applyOk(db, [{ garmentId: 'shirt', command: { type: 'ironed' } }], at(71));
    expect(state(db, 'shirt')).toEqual({ location: 'stored', toIron: false, wearCount: 0 });

    // History.
    expect(eventTypes(db, 'tshirt')).toEqual([
      'worn',
      'locationChanged', // → airing
      'worn',
      'locationChanged', // → dirty
      'locationChanged', // → drying
      'locationChanged', // → onDryingRack
      'locationChanged', // → stored
    ]);
    expect(eventTypes(db, 'jeans')).toEqual([
      'worn',
      'locationChanged', // → airing
      'worn',
      'locationChanged', // airing again (a second wash avoided)
    ]);
    expect(eventTypes(db, 'shirt')).toEqual([
      'worn',
      'locationChanged', // → dirty
      'locationChanged', // → drying
      'ironingChanged', // to iron
      'locationChanged', // → onDryingRack
      'locationChanged', // → stored
      'ironingChanged', // ironed
    ]);
  });
});
