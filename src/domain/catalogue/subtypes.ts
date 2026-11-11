// Subtype catalogue (DATA_MODEL.md §5). Versioned code, not a table: a type
// only decides the garment's slot and its starting wear limit. It carries no
// usage, warmth or formality, the app never infers anything else (SPEC §4.2).
// Labels are i18n keys `subtypes.<key>`.
import type { Slot } from '../types';

// Pieces that go to the laundry have a starting wear limit ("Ports avant lavage").
interface WashableSubtype {
  key: string;
  slot: Exclude<Slot, 'shoes'>;
  defaultMaxWears: number;
}

// Shoes are never sorted nor washed (SPEC §8.1): no wear limit.
interface ShoeSubtype {
  key: string;
  slot: 'shoes';
}

export type Subtype = WashableSubtype | ShoeSubtype;

/**
 * Starting wear limits, approved by Candice on 2026-11-11 (SPEC §14.2):
 * ADEME guidance as relayed by the press ("at least 4" for cotton or silk
 * tops and dresses, 10 to 15 for wool sweaters, 15 to 30 for jeans; lower
 * bound kept), Candice's values for the types it does not cover.
 *
 * Keys are persisted in garments.subtype: add types freely, never rename or
 * remove a key without a migration of the garments that use it.
 */
export const SUBTYPES = [
  // Tops
  { key: 'tshirt', slot: 'top', defaultMaxWears: 4 },
  { key: 'tankTop', slot: 'top', defaultMaxWears: 4 },
  { key: 'shirt', slot: 'top', defaultMaxWears: 4 },
  { key: 'blouse', slot: 'top', defaultMaxWears: 4 },
  { key: 'woolTop', slot: 'top', defaultMaxWears: 7 },
  // Layer 1
  { key: 'sweatshirt', slot: 'midLayer', defaultMaxWears: 5 },
  { key: 'sweater', slot: 'midLayer', defaultMaxWears: 10 },
  { key: 'cardigan', slot: 'midLayer', defaultMaxWears: 10 },
  { key: 'blazer', slot: 'midLayer', defaultMaxWears: 10 },
  // Bottoms
  { key: 'jeans', slot: 'bottom', defaultMaxWears: 15 },
  { key: 'trousers', slot: 'bottom', defaultMaxWears: 7 },
  { key: 'skirt', slot: 'bottom', defaultMaxWears: 4 },
  { key: 'shorts', slot: 'bottom', defaultMaxWears: 4 },
  // One-pieces
  { key: 'dress', slot: 'onePiece', defaultMaxWears: 4 },
  { key: 'jumpsuit', slot: 'onePiece', defaultMaxWears: 4 },
  { key: 'dungarees', slot: 'onePiece', defaultMaxWears: 15 },
  // Layer 2
  { key: 'jacket', slot: 'outerLayer', defaultMaxWears: 30 },
  { key: 'coat', slot: 'outerLayer', defaultMaxWears: 30 },
  { key: 'raincoat', slot: 'outerLayer', defaultMaxWears: 30 },
  // Shoes
  { key: 'sneakers', slot: 'shoes' },
  { key: 'ankleBoots', slot: 'shoes' },
  { key: 'shoes', slot: 'shoes' },
] as const satisfies readonly Subtype[];

export type SubtypeKey = (typeof SUBTYPES)[number]['key'];

const BY_KEY = new Map<string, Subtype>(SUBTYPES.map((subtype) => [subtype.key, subtype]));

export function getSubtype(key: SubtypeKey): Subtype {
  const subtype = BY_KEY.get(key);
  if (!subtype) {
    throw new Error(`Unknown subtype: ${key}`);
  }
  return subtype;
}

/** Starting wear limit of every type that goes to the laundry. */
export function defaultWearLimits(): { subtype: SubtypeKey; maxWears: number }[] {
  return SUBTYPES.flatMap((subtype) =>
    'defaultMaxWears' in subtype
      ? [{ subtype: subtype.key, maxWears: subtype.defaultMaxWears }]
      : [],
  );
}
