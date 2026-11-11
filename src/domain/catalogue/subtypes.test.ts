import { SLOTS } from '../types';
import { SUBTYPES, defaultWearLimits, getSubtype } from './subtypes';

describe('subtype catalogue', () => {
  it('has unique keys', () => {
    const keys = SUBTYPES.map((subtype) => subtype.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('offers at least one type for every slot', () => {
    const slots = new Set(SUBTYPES.map((subtype) => subtype.slot));
    expect([...slots].sort()).toEqual([...SLOTS].sort());
  });

  it('gives a starting wear limit of at least 1 to every type but shoes', () => {
    for (const subtype of SUBTYPES) {
      if (subtype.slot === 'shoes') {
        expect(subtype).not.toHaveProperty('defaultMaxWears');
      } else {
        expect(subtype.defaultMaxWears).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('keeps the approved starting values (SPEC §14.2, 2026-11-11)', () => {
    expect(Object.fromEntries(defaultWearLimits().map((l) => [l.subtype, l.maxWears]))).toEqual({
      tshirt: 4,
      tankTop: 4,
      shirt: 4,
      blouse: 4,
      cottonTop: 4,
      woolTop: 7,
      sweatshirt: 5,
      sweater: 10,
      cardigan: 10,
      blazer: 10,
      jeans: 15,
      trousers: 7,
      skirt: 4,
      shorts: 4,
      dress: 4,
      jumpsuit: 4,
      dungarees: 15,
      jacket: 30,
      coat: 30,
      raincoat: 30,
    });
  });

  it('finds a type by key', () => {
    expect(getSubtype('sweatshirt')).toEqual({
      key: 'sweatshirt',
      slot: 'midLayer',
      defaultMaxWears: 5,
    });
  });
});
