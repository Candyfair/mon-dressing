import { loopIndex, rubberBand, swipeStep } from './loopIndex';

describe('loopIndex', () => {
  it('wraps past the last piece back to the first, and before the first to the last', () => {
    expect(loopIndex(3, 3)).toBe(0);
    expect(loopIndex(-1, 3)).toBe(2);
    expect(loopIndex(-4, 3)).toBe(2);
    expect(loopIndex(7, 3)).toBe(1);
  });

  it('stays at 0 with one piece or none', () => {
    expect(loopIndex(5, 1)).toBe(0);
    expect(loopIndex(-2, 0)).toBe(0);
  });
});

describe('swipeStep', () => {
  const base = { step: 150, count: 4 };

  it('goes to the next piece when the finger moves left far enough', () => {
    expect(swipeStep({ ...base, translation: -60, velocity: 0 })).toBe(1);
  });

  it('goes to the previous piece when the finger moves right far enough', () => {
    expect(swipeStep({ ...base, translation: 60, velocity: 0 })).toBe(-1);
  });

  it('settles back on a short, slow drag', () => {
    expect(swipeStep({ ...base, translation: -30, velocity: -100 })).toBe(0);
  });

  it('follows a quick flick even when short', () => {
    expect(swipeStep({ ...base, translation: -10, velocity: -900 })).toBe(1);
    expect(swipeStep({ ...base, translation: 10, velocity: 900 })).toBe(-1);
  });

  it('settles back when the flick goes against a long drag', () => {
    expect(swipeStep({ ...base, translation: -80, velocity: 900 })).toBe(0);
  });

  it('never moves with a single piece: it bounces back', () => {
    expect(swipeStep({ ...base, count: 1, translation: -140, velocity: -2000 })).toBe(0);
  });
});

describe('rubberBand', () => {
  it('follows the finger less and less, in both directions', () => {
    expect(Math.abs(rubberBand(100, 150))).toBeLessThan(100);
    expect(rubberBand(300, 150)).toBeLessThan(150 * 0.35);
    expect(rubberBand(-100, 150)).toBe(-rubberBand(100, 150));
  });
});
