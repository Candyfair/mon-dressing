/**
 * @jest-environment node
 */
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import type { Occasion, Usage } from '../domain/types';
import { ensureDefaults } from './bootstrap';
import { insertGarment } from './repositories/garmentLifecycle';
import { getActiveWardrobe } from './repositories/wardrobes';
import { dayOverrides, garmentUsages, outfits } from './schema';
import { createTestDb, type TestDb } from './testing/createTestDb';

const NOW = new Date('2026-11-18T08:00:00.000Z');
// Values written before migration 0002, which the types no longer allow.
const EVENING_USAGE = 'occasion.evening' as Usage;
const EVENING = 'evening' as Occasion;

function addGarment(db: TestDb, wardrobeId: string, id: string, usages: Usage[]) {
  insertGarment(
    db,
    {
      id,
      wardrobeId,
      subtype: 'tshirt',
      isFavorite: false,
      statementPiece: false,
      needsIroning: false,
      usages,
      photoOriginalPath: `photos/${id}/original.jpg`,
      cutout: { status: 'pending' },
    },
    { now: NOW },
  );
}

describe('migration 0002: "Soirée" merged into "Festif"', () => {
  it('moves garments, day overrides and outfits, without duplicates', () => {
    const { db, sqlite } = createTestDb();
    ensureDefaults(db, { now: NOW, newId: randomUUID, timeZone: 'Europe/Paris' });
    const wardrobeId = getActiveWardrobe(db).id;
    addGarment(db, wardrobeId, 'evening', [EVENING_USAGE, 'weather.mild']);
    addGarment(db, wardrobeId, 'both', [EVENING_USAGE, 'occasion.festive']);
    addGarment(db, wardrobeId, 'other', ['occasion.ceremony']);
    db.insert(dayOverrides)
      .values({ date: '2026-11-18', activity: null, commuteModes: null, occasion: EVENING })
      .run();
    db.insert(outfits)
      .values({
        id: 'outfit',
        wardrobeId,
        date: '2026-11-17',
        status: 'validated',
        activity: 'office',
        commuteModes: [],
        occasion: EVENING,
        createdAt: NOW,
      })
      .run();

    sqlite.exec(
      readFileSync(path.join(__dirname, 'migrations', '0002_merge_evening_occasion.sql'), 'utf8'),
    );

    const usages = db
      .select()
      .from(garmentUsages)
      .all()
      .map((row) => `${row.garmentId}:${row.usage}`)
      .sort();
    expect(usages).toEqual([
      'both:occasion.festive',
      'evening:occasion.festive',
      'evening:weather.mild',
      'other:occasion.ceremony',
    ]);
    expect(db.select().from(dayOverrides).get()?.occasion).toBe('festive');
    expect(db.select().from(outfits).get()?.occasion).toBe('festive');
  });
});
