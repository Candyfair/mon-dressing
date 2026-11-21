import { seededRandom } from './seededRandom';

describe('seededRandom', () => {
  it('repeats the same numbers for the same seed, within [0, 1)', () => {
    const first = seededRandom(3);
    const second = seededRandom(3);
    const values = Array.from({ length: 50 }, () => first());
    expect(Array.from({ length: 50 }, () => second())).toEqual(values);
    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
    expect(seededRandom(4)()).not.toBe(values[0]);
  });
});
