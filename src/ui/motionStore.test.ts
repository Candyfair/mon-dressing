import { motionFields, nudgedValue, withMotionValue } from './motionStore';

jest.mock('react-native-reanimated', () => jest.requireActual('../test/animationMocks').reanimated);

const easing = (progress: number) => progress;
const tree = {
  radial: {
    longPress: 100,
    hover: { stiffness: 170, damping: 13, mass: 0.9 },
    float: { duration: 3200, easing },
  },
};

describe('motionFields', () => {
  it('lists the numbers and leaves the curves out', () => {
    expect(motionFields(tree).map((field) => field.id)).toEqual([
      'radial.longPress',
      'radial.hover.stiffness',
      'radial.hover.damping',
      'radial.hover.mass',
      'radial.float.duration',
    ]);
  });
});

describe('nudgedValue', () => {
  const field = (id: string) => {
    const found = motionFields(tree).find((candidate) => candidate.id === id);
    if (!found) throw new Error(id);
    return found;
  };

  it('steps according to the kind of value', () => {
    expect(nudgedValue(field('radial.longPress'), 1)).toBe(110);
    expect(nudgedValue(field('radial.hover.damping'), -1)).toBe(12);
    expect(nudgedValue(field('radial.hover.mass'), 1)).toBe(1);
    expect(nudgedValue(field('radial.float.duration'), 1)).toBe(3300);
  });

  it('stops at the minimum', () => {
    const mass = { ...field('radial.hover.mass'), value: 0.1 };
    expect(nudgedValue(mass, -1)).toBe(0.1);
  });
});

describe('withMotionValue', () => {
  it('replaces one number in a new object and keeps the rest', () => {
    const next = withMotionValue(tree, ['radial', 'hover', 'mass'], 1.2);
    expect(next.radial.hover).toEqual({ stiffness: 170, damping: 13, mass: 1.2 });
    expect(next.radial.float).toBe(tree.radial.float);
    expect(next).not.toBe(tree);
    expect(tree.radial.hover.mass).toBe(0.9);
  });
});
