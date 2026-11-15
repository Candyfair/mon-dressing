import type { EngineGarment } from '../types';

// Stored, never worn, created long ago, no usage: proposed in every case.
const BASE: Omit<EngineGarment, 'id' | 'slot'> = {
  usages: [],
  isFavorite: false,
  statementPiece: false,
  location: 'stored',
  locationSince: new Date('2026-09-01T08:00:00.000Z'),
  toIron: false,
  wearCount: 0,
  maxWears: 4,
  lastWornAt: null,
  createdAt: new Date('2026-09-01T08:00:00.000Z'),
};

export function makeGarment(
  garment: Pick<EngineGarment, 'id' | 'slot'> & Partial<EngineGarment>,
): EngineGarment {
  return { ...BASE, maxWears: garment.slot === 'shoes' ? null : BASE.maxWears, ...garment };
}

/** A Paris instant at local noon, `daysAgo` days before 2026-11-16. */
export function wornDaysAgo(daysAgo: number): Date {
  const date = new Date('2026-11-16T11:00:00.000Z');
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date;
}
