import {
  HOVERED_DISC,
  type RadialBounds,
  radialHoverOffset,
  radialItemAt,
  radialLayout,
  type RadialPoint,
} from './radialLayout';
import { size } from './tokens';

const SCREEN: RadialBounds = { left: 0, top: 24, right: 375, bottom: 812 };
const average = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length;
const distance = (a: RadialPoint, b: RadialPoint) => Math.hypot(a.x - b.x, a.y - b.y);

function expectOnScreen(discs: RadialPoint[]) {
  for (const disc of discs) {
    expect(disc.x - size.sizeRadial / 2).toBeGreaterThanOrEqual(SCREEN.left);
    expect(disc.x + size.sizeRadial / 2).toBeLessThanOrEqual(SCREEN.right);
    expect(disc.y - size.sizeRadial / 2).toBeGreaterThanOrEqual(SCREEN.top);
    expect(disc.y + size.sizeRadial / 2).toBeLessThanOrEqual(SCREEN.bottom);
  }
}

describe('radialLayout', () => {
  it('draws the mockup fan above a finger in the middle of the screen', () => {
    const { discs, label } = radialLayout({ x: 187.5, y: 370 }, 7, SCREEN);
    expect(discs[0]?.x).toBeCloseTo(65.5);
    expect(discs[0]?.y).toBeCloseTo(370);
    expect(discs[1]?.x).toBeCloseTo(81.84, 1);
    expect(discs[1]?.y).toBeCloseTo(309);
    expect(discs[3]?.x).toBeCloseTo(187.5);
    expect(discs[3]?.y).toBeCloseTo(248);
    expect(discs[6]?.x).toBeCloseTo(309.5);
    expect(label.x).toBeCloseTo(187.5);
    expect(label.y).toBeCloseTo(158);
  });

  it.each([
    ['left', { x: 30, y: 400 }, (c: RadialPoint, a: RadialPoint) => c.x > a.x],
    ['right', { x: 345, y: 400 }, (c: RadialPoint, a: RadialPoint) => c.x < a.x],
    ['top', { x: 187.5, y: 50 }, (c: RadialPoint, a: RadialPoint) => c.y > a.y],
    ['bottom', { x: 187.5, y: 790 }, (c: RadialPoint, a: RadialPoint) => c.y < a.y],
  ])('opens away from the %s edge', (_edge, anchor, isAway) => {
    const { discs } = radialLayout(anchor, 7, SCREEN);
    const centre = {
      x: average(discs.map((disc) => disc.x)),
      y: average(discs.map((disc) => disc.y)),
    };
    expect(isAway(centre, anchor)).toBe(true);
    expectOnScreen(discs);
  });

  it.each([[{ x: 20, y: 40 }], [{ x: 355, y: 40 }], [{ x: 20, y: 800 }], [{ x: 355, y: 800 }]])(
    'keeps the discs on screen, apart and off the finger in a corner %#',
    (anchor) => {
      const { discs } = radialLayout(anchor, 7, SCREEN);
      expectOnScreen(discs);
      discs.forEach((disc, index) => {
        expect(distance(disc, anchor)).toBeGreaterThanOrEqual(size.radialRadius - 0.01);
        const next = discs[index + 1];
        if (next) expect(distance(disc, next)).toBeGreaterThanOrEqual(size.sizeRadial);
      });
    },
  );

  it.each([
    ['in the middle', { x: 187.5, y: 370 }],
    ['near an edge', { x: 340, y: 175 }],
    ['in a corner', { x: 20, y: 40 }],
  ])('keeps the spacing of the full fan for a shorter list %s', (_place, anchor) => {
    const { discs } = radialLayout(anchor, 4, SCREEN);
    expect(discs).toHaveLength(4);
    expectOnScreen(discs);
    discs.slice(1).forEach((disc, index) => {
      expect(distance(disc, discs[index] as RadialPoint)).toBeCloseTo(63.1, 0);
    });
  });

  it('centres a shorter list above the finger', () => {
    const { discs } = radialLayout({ x: 187.5, y: 370 }, 4, SCREEN);
    expect(discs[0]?.x).toBeCloseTo(187.5 - 122 * Math.SQRT1_2);
    expect(discs[3]?.x).toBeCloseTo(187.5 + 122 * Math.SQRT1_2);
  });

  it('puts the label under a fan that fills the top of the screen', () => {
    const { discs, label } = radialLayout({ x: 187.5, y: 60 }, 7, SCREEN);
    const lowest = Math.max(...discs.map((disc) => disc.y));
    expect(label.y).toBeGreaterThan(lowest);
  });
});

describe('radialItemAt', () => {
  const { discs } = radialLayout({ x: 187.5, y: 370 }, 7, SCREEN);

  it('finds the closest disc under the finger', () => {
    expect(radialItemAt(discs, { x: 187.5, y: 250 })).toBe(3);
    expect(radialItemAt(discs, { x: 70, y: 365 })).toBe(0);
  });

  it('finds nothing at the press point or far from the fan', () => {
    expect(radialItemAt(discs, { x: 187.5, y: 370 })).toBe(-1);
    expect(radialItemAt(discs, { x: 187.5, y: 100 })).toBe(-1);
  });
});

describe('radialHoverOffset', () => {
  const anchor = { x: 187.5, y: 370 };
  const { discs } = radialLayout(anchor, 7, SCREEN);
  const fan = { discs, anchor, bounds: SCREEN };
  const centre = discs[3] as RadialPoint;

  it('moves the hovered disc away from the press point', () => {
    const offset = radialHoverOffset(fan, 3, 3, centre);
    expect(offset.x).toBeCloseTo(0);
    expect(offset.y).toBeCloseTo(-10);
  });

  it('leans the hovered disc towards the finger, within a limit', () => {
    const near = radialHoverOffset(fan, 3, 3, { x: centre.x + 10, y: centre.y });
    expect(near.x).toBeCloseTo(2);
    const far = radialHoverOffset(fan, 3, 3, { x: centre.x + 40, y: centre.y });
    expect(far.x).toBeCloseTo(6);
  });

  it('moves the nearest discs away from the hovered one, without touching', () => {
    const hovered = discs[3] as RadialPoint;
    const moved = discs.map((disc, index) => {
      const offset = radialHoverOffset(fan, index, 3, centre);
      return { x: disc.x + offset.x, y: disc.y + offset.y };
    });
    for (const index of [1, 2, 4, 5]) {
      const disc = discs[index] as RadialPoint;
      expect(distance(moved[index] as RadialPoint, hovered)).toBeGreaterThan(
        distance(disc, hovered),
      );
    }
    for (const index of [0, 1, 4, 5]) {
      expect(
        distance(moved[index] as RadialPoint, moved[index + 1] as RadialPoint),
      ).toBeGreaterThanOrEqual(size.sizeRadial);
    }
  });

  it('keeps a hovered disc on screen near an edge', () => {
    const corner = { x: 30, y: 60 };
    const cornerDiscs = radialLayout(corner, 7, SCREEN).discs;
    const cornerFan = { discs: cornerDiscs, anchor: corner, bounds: SCREEN };
    cornerDiscs.forEach((disc, index) => {
      const offset = radialHoverOffset(cornerFan, index, index, disc);
      expect(disc.x + offset.x - HOVERED_DISC / 2).toBeGreaterThanOrEqual(SCREEN.left);
      expect(disc.y + offset.y - HOVERED_DISC / 2).toBeGreaterThanOrEqual(SCREEN.top);
    });
  });

  it('leaves the other discs in place, and all of them when nothing is hovered', () => {
    expect(radialHoverOffset(fan, 0, 3, centre)).toEqual({ x: 0, y: 0 });
    expect(radialHoverOffset(fan, 3, -1, centre)).toEqual({ x: 0, y: 0 });
  });
});
