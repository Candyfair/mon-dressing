import { size } from './tokens';

export interface RadialPoint {
  x: number;
  y: number;
}

export interface RadialBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface RadialFan {
  discs: readonly RadialPoint[];
  anchor: RadialPoint;
  bounds: RadialBounds;
}

export interface RadialLayout {
  discs: RadialPoint[];
  // Centre of the label's width, and its top.
  label: RadialPoint;
}

const FULL_SPAN = 180;
// Angle between two neighbours at the radius of the tokens: a short list
// keeps the spacing of the full one instead of spreading out.
const DISC_ANGLE = 30;
// Narrower fans for the corners: their radius grows to keep the same spacing.
const SPAN_SHARES = [1, 5 / 6, 2 / 3, 1 / 2, 5 / 12];
const ROTATION_STEP = 15;
const UP = 90;
// Distance between two neighbours of the mockups' fan of 7 (30° apart).
const MIN_DISC_DISTANCE = 63;
// Size of the mockups for the recommended disc.
export const RECOMMENDED_DISC = 56;
// The disc under the finger jumps out of the fan (Candice, S6): much larger,
// moved away from the fingertip, its neighbours making room.
export const HOVERED_DISC = 84;
const HOVER_LIFT = 10;
// By distance in the fan: the push fades so that no two resting discs touch.
const NEIGHBOUR_PUSH = [0, 14, 7];
// The hovered disc leans towards the finger, up to a few points.
const FINGER_PULL = 0.2;
const FINGER_PULL_MAX = 6;
const EDGE_MARGIN = 4;
// Room kept around a resting disc; near an edge, a hovered one moves inwards.
const DISC_REACH = 35;
// The finger may land a little off a disc, but not near the press point.
const HIT_RADIUS = 44;
const LABEL_HEIGHT = 28;
// Space between the label and a hovered disc (mockups).
const LABEL_GAP = 10 + HOVERED_DISC / 2 + HOVER_LIFT - size.sizeRadial / 2;
// From the top of the label to the top of the highest resting disc.
const LABEL_RISE = LABEL_HEIGHT + LABEL_GAP;
export const RADIAL_LABEL_WIDTH = 220;

function clamp(value: number, low: number, high: number): number {
  'worklet';
  return Math.min(Math.max(value, low), high);
}

function fanDiscs(
  anchor: RadialPoint,
  count: number,
  direction: number,
  span: number,
): RadialPoint[] {
  'worklet';
  const step = count > 1 ? span / (count - 1) : 0;
  const halfStep = (step / 2) * (Math.PI / 180);
  const radius =
    count > 1
      ? Math.max(size.radialRadius, MIN_DISC_DISTANCE / (2 * Math.sin(halfStep)))
      : size.radialRadius;
  const first = count > 1 ? direction + span / 2 : direction;
  const discs: RadialPoint[] = [];
  for (let index = 0; index < count; index += 1) {
    const angle = (first - index * step) * (Math.PI / 180);
    discs.push({
      x: anchor.x + radius * Math.cos(angle),
      y: anchor.y - radius * Math.sin(angle),
    });
  }
  return discs;
}

function fits(discs: readonly RadialPoint[], bounds: RadialBounds): boolean {
  'worklet';
  return discs.every(
    (disc) =>
      disc.x >= bounds.left + DISC_REACH &&
      disc.x <= bounds.right - DISC_REACH &&
      disc.y >= bounds.top + DISC_REACH &&
      disc.y <= bounds.bottom - DISC_REACH,
  );
}

function findDiscs(anchor: RadialPoint, count: number, bounds: RadialBounds): RadialPoint[] {
  'worklet';
  // Turning from "up" towards the middle of the screen leaves the nearest
  // side edge behind; a half turn leaves the top edge behind.
  const side = anchor.x <= (bounds.left + bounds.right) / 2 ? -1 : 1;
  const widest = Math.min((count - 1) * DISC_ANGLE, FULL_SPAN);
  for (const share of SPAN_SHARES) {
    const span = widest * share;
    for (let rotation = 0; rotation <= FULL_SPAN; rotation += ROTATION_STEP) {
      const discs = fanDiscs(anchor, count, UP + side * rotation, span);
      if (fits(discs, bounds)) return discs;
    }
  }
  // A screen too small for any fan: stay visible, even if discs get closer.
  return fanDiscs(anchor, count, UP, widest).map((disc) => ({
    x: clamp(disc.x, bounds.left + DISC_REACH, bounds.right - DISC_REACH),
    y: clamp(disc.y, bounds.top + DISC_REACH, bounds.bottom - DISC_REACH),
  }));
}

/**
 * The fan around the press point: a half circle above the finger when it
 * fits, otherwise turned away from the nearest edge, then narrower. The label
 * goes above the fan, or under it when there is no room.
 */
export function radialLayout(
  anchor: RadialPoint,
  count: number,
  bounds: RadialBounds,
): RadialLayout {
  'worklet';
  const discs = findDiscs(anchor, count, bounds);
  const xs = discs.map((disc) => disc.x);
  const ys = discs.map((disc) => disc.y);
  const discRadius = size.sizeRadial / 2;
  const above = Math.min(...ys) - discRadius - LABEL_RISE;
  const below = Math.max(...ys) + discRadius + LABEL_GAP;
  return {
    discs,
    label: {
      x: clamp(
        (Math.min(...xs) + Math.max(...xs)) / 2,
        bounds.left + RADIAL_LABEL_WIDTH / 2,
        bounds.right - RADIAL_LABEL_WIDTH / 2,
      ),
      y: above >= bounds.top ? above : below,
    },
  };
}

function away(from: RadialPoint, to: RadialPoint, distance: number): RadialPoint {
  'worklet';
  const length = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  return {
    x: ((to.x - from.x) / length) * distance,
    y: ((to.y - from.y) / length) * distance,
  };
}

/**
 * How far a disc leaves its place while `hovered` is under the finger: the
 * hovered one moves away from the press point and leans towards the finger,
 * its neighbours move away from it. Each stays on screen at its size.
 */
export function radialHoverOffset(
  { discs, anchor, bounds }: RadialFan,
  index: number,
  hovered: number,
  finger: RadialPoint,
): RadialPoint {
  'worklet';
  const disc = discs[index];
  const target = discs[hovered];
  if (!disc || !target) return { x: 0, y: 0 };
  const isHovered = index === hovered;
  const push = NEIGHBOUR_PUSH[Math.abs(index - hovered)] ?? 0;
  if (!isHovered && push === 0) return { x: 0, y: 0 };
  let shift = away(target, disc, push);
  if (isHovered) {
    const lift = away(anchor, disc, HOVER_LIFT);
    const reachToFinger = Math.hypot(finger.x - disc.x, finger.y - disc.y);
    const pull = away(disc, finger, Math.min(reachToFinger * FINGER_PULL, FINGER_PULL_MAX));
    shift = { x: lift.x + pull.x, y: lift.y + pull.y };
  }
  const reach = (isHovered ? HOVERED_DISC : size.sizeRadial) / 2 + EDGE_MARGIN;
  return {
    x: clamp(disc.x + shift.x, bounds.left + reach, bounds.right - reach) - disc.x,
    y: clamp(disc.y + shift.y, bounds.top + reach, bounds.bottom - reach) - disc.y,
  };
}

/** Index of the disc under the finger, or -1. */
export function radialItemAt(discs: readonly RadialPoint[], finger: RadialPoint): number {
  'worklet';
  let closest = -1;
  let closestDistance = HIT_RADIUS;
  discs.forEach((disc, index) => {
    const distance = Math.hypot(disc.x - finger.x, disc.y - finger.y);
    if (distance <= closestDistance) {
      closest = index;
      closestDistance = distance;
    }
  });
  return closest;
}
