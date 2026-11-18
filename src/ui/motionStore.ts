import { createDevStore } from './devStore';
import { motion as initialMotion } from './motion';

// Live tuning of the animations from the Gestures screen (S6). Removed once
// the values are frozen in `motion.ts`.

// `motion` is `as const`: its numbers are literal types, widened here so that
// a tuned value fits.
type Tunable<T> = T extends number
  ? number
  : T extends (...args: never[]) => unknown
    ? T
    : { readonly [K in keyof T]: Tunable<T[K]> };

export type Motion = Tunable<typeof initialMotion>;

export interface MotionField {
  path: readonly string[];
  id: string;
  value: number;
  step: number;
  min: number;
}

function fieldLimits(key: string, value: number): Pick<MotionField, 'step' | 'min'> {
  switch (key) {
    case 'mass':
      return { step: 0.1, min: 0.1 };
    case 'damping':
      return { step: 1, min: 1 };
    default:
      return { step: value >= 1000 ? 100 : 10, min: 10 };
  }
}

/** Every number of the tree, as a list of settings. */
export function motionFields(tree: object, parent: readonly string[] = []): MotionField[] {
  return Object.entries(tree).flatMap(([key, value]: [string, unknown]) => {
    const path = [...parent, key];
    if (typeof value === 'number') {
      return [{ path, id: path.join('.'), value, ...fieldLimits(key, value) }];
    }
    return typeof value === 'object' && value !== null ? motionFields(value, path) : [];
  });
}

/** The tree with one number replaced; the rest is shared. */
export function withMotionValue<T extends object>(
  tree: T,
  path: readonly string[],
  value: number,
): T {
  const [key, ...rest] = path;
  if (key === undefined) return tree;
  const branches = { ...tree } as Record<string, unknown>;
  const branch = branches[key];
  branches[key] =
    rest.length > 0 && typeof branch === 'object' && branch !== null
      ? withMotionValue(branch, rest, value)
      : value;
  return branches as T;
}

/** The next value of a setting, one step up or down. */
export function nudgedValue(field: MotionField, direction: 1 | -1): number {
  const next = Math.round((field.value + direction * field.step) * 100) / 100;
  return Math.max(next, field.min);
}

const store = createDevStore<Motion>(initialMotion);

// Worklets keep a frozen copy of what they capture: a new object, read through
// this hook, is what reaches them on the next render.
export const useMotion = store.use;

function setMotionValue(path: readonly string[], value: number) {
  store.set(withMotionValue(store.get(), path, value));
  console.info(`[motion] ${path.join('.')} = ${value}`);
}

/** One step from the latest value: taps can outrun the screen's renders. */
export function nudgeMotionValue(id: string, direction: 1 | -1) {
  const field = motionFields(store.get()).find((candidate) => candidate.id === id);
  if (field) setMotionValue(field.path, nudgedValue(field, direction));
}

export function resetMotion() {
  store.set(initialMotion);
  console.info('[motion] reset');
}
