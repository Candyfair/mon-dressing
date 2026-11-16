// Pure index arithmetic of the looping carousels (SPEC §9.1: every carousel
// loops, a single piece bounces back). Worklet-safe: called from gestures.

/** `index` wrapped into 0…count − 1, in both directions. */
export function loopIndex(index: number, count: number): number {
  'worklet';
  if (count <= 0) return 0;
  return ((index % count) + count) % count;
}

export type SwipeStep = -1 | 0 | 1;

export interface SwipeRelease {
  // Horizontal translation and velocity at release, in pt and pt/s.
  translation: number;
  velocity: number;
  // Distance between two pieces of the carousel.
  step: number;
  count: number;
}

// Share of a step, or flick speed, past which a release changes the piece.
export const SWIPE_DISTANCE_RATIO = 0.3;
export const SWIPE_VELOCITY = 500;

/**
 * How many pieces a release moves by: +1 for the next one (finger moved to
 * the left), −1 for the previous one, 0 to settle back. A flick against the
 * drag direction settles back. With one piece or none, always 0 (bounce).
 */
export function swipeStep({ translation, velocity, step, count }: SwipeRelease): SwipeStep {
  'worklet';
  if (count <= 1) return 0;
  const far = Math.abs(translation) > step * SWIPE_DISTANCE_RATIO;
  const fast = Math.abs(velocity) > SWIPE_VELOCITY;
  if (!far && !fast) return 0;
  // A fast flick decides the direction; otherwise the distance does.
  const direction = fast ? velocity : translation;
  if (far && fast && Math.sign(velocity) !== Math.sign(translation)) return 0;
  return direction < 0 ? 1 : -1;
}

/**
 * Drag offset with rubber-band resistance, for the bounce of a carousel that
 * has a single piece: the piece follows the finger less and less.
 */
export function rubberBand(translation: number, step: number): number {
  'worklet';
  const limit = step * 0.35;
  return (limit * translation) / (limit + Math.abs(translation));
}
