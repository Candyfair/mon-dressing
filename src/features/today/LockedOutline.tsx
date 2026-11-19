import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { motion } from '../../ui/motion';
import { useTheme } from '../../ui/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export interface OutlineBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Room around the pieces, and the corner radius (design spec 01).
export const OUTLINE_MARGIN = 12;
const RADIUS = 40;
// Room for the jitter and the overshoot outside the rectangle.
const PAD = 8;
// The two lines: the second is thinner, offset and rounder (prototype).
const LINES = [
  { stroke: 2.6, opacity: 1, jitter: 1.6, seed: 7, offset: { x: 0, y: 0, width: 0, height: 0 } },
  {
    stroke: 1.2,
    opacity: 0.55,
    jitter: 2.2,
    seed: 31,
    offset: { x: 2, y: -3, width: -3, height: 4 },
  },
] as const;
const SECOND_RADIUS = RADIUS + 2;

type Point = [number, number];

/**
 * A rounded rectangle drawn by hand: points along its sides and corners,
 * each moved by a deterministic jitter (same seed, same line), and a pen
 * that overshoots its start a little. Returns the path and its length.
 */
export function roughRect(
  { x, y, width, height }: OutlineBounds,
  radius: number,
  jitter: number,
  seed: number,
): { d: string; length: number } {
  let state = seed;
  const random = () => {
    state = (state * 9301 + 49297) % 233280;
    return (state / 233280 - 0.5) * 2 * jitter;
  };
  const points: Point[] = [];
  const side = (x1: number, y1: number, x2: number, y2: number, steps: number) => {
    for (let index = 0; index < steps; index++) {
      points.push([
        x1 + ((x2 - x1) * index) / steps + random(),
        y1 + ((y2 - y1) * index) / steps + random(),
      ]);
    }
  };
  const corner = (cx: number, cy: number, start: number) => {
    for (let index = 0; index < 6; index++) {
      const angle = start + ((Math.PI / 2) * index) / 6;
      points.push([
        cx + Math.cos(angle) * radius + random(),
        cy + Math.sin(angle) * radius + random(),
      ]);
    }
  };
  const right = x + width;
  const bottom = y + height;
  side(x + radius, y, right - radius, y, 8);
  corner(right - radius, y + radius, -Math.PI / 2);
  side(right, y + radius, right, bottom - radius, 12);
  corner(right - radius, bottom - radius, 0);
  side(right - radius, bottom, x + radius, bottom, 8);
  corner(x + radius, bottom - radius, Math.PI / 2);
  side(x, bottom - radius, x, y + radius, 12);
  corner(x + radius, y + radius, Math.PI);
  const [first] = points;
  if (first) points.push([first[0] + 14, first[1] - 3]);

  let length = 0;
  for (let index = 1; index < points.length; index++) {
    const [ax, ay] = points[index - 1] as Point;
    const [bx, by] = points[index] as Point;
    length += Math.hypot(bx - ax, by - ay);
  }
  const d = `M${points.map(([px, py]) => `${px.toFixed(1)} ${py.toFixed(1)}`).join(' L')}`;
  return { d, length };
}

interface LockedOutlineProps {
  // The pieces' box, outfit coordinates; the outline goes around it.
  bounds: OutlineBounds;
  visible: boolean;
}

/**
 * The felt-pen line around a validated outfit (design spec 01,
 * LockedOutline). Shown at once when the outfit opens validated; drawn
 * while the stamp is still there after a validation; erased back along its
 * path on undo. Decorative. Reduced motion: it fades in and out.
 */
export function LockedOutline({ bounds, visible }: LockedOutlineProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const { validation } = motion;

  const box = useMemo(
    () => ({
      x: bounds.x - OUTLINE_MARGIN,
      y: bounds.y - OUTLINE_MARGIN,
      width: bounds.width + 2 * OUTLINE_MARGIN,
      height: bounds.height + 2 * OUTLINE_MARGIN,
    }),
    [bounds.x, bounds.y, bounds.width, bounds.height],
  );
  const lines = useMemo(
    () =>
      LINES.map((line, index) =>
        roughRect(
          {
            x: PAD + line.offset.x,
            y: PAD + line.offset.y,
            width: box.width + line.offset.width,
            height: box.height + line.offset.height,
          },
          index === 0 ? RADIUS : SECOND_RADIUS,
          line.jitter,
          line.seed,
        ),
      ),
    [box.width, box.height],
  );

  const first = useSharedValue(visible ? 1 : 0);
  const second = useSharedValue(visible ? 1 : 0);
  // Reduced motion: the whole outline fades.
  const fade = useSharedValue(1);

  const wasVisible = useRef(visible);
  useEffect(() => {
    if (wasVisible.current === visible) return;
    wasVisible.current = visible;
    cancelAnimation(first);
    cancelAnimation(second);
    cancelAnimation(fade);
    if (reducedMotion) {
      first.set(1);
      second.set(1);
      fade.set(visible ? 0 : 1);
      fade.set(
        visible
          ? withDelay(validation.lockDelay, withTiming(1, validation.outlineFade))
          : withTiming(0, validation.outlineFade),
      );
      return;
    }
    fade.set(1);
    if (visible) {
      first.set(0);
      second.set(0);
      first.set(withDelay(validation.lockDelay, withTiming(1, validation.outlineDraw)));
      second.set(
        withDelay(
          validation.lockDelay + validation.outlineSecondDelay,
          withTiming(1, validation.outlineDraw),
        ),
      );
    } else {
      first.set(withTiming(0, validation.outlineErase));
      second.set(withTiming(0, validation.outlineErase));
    }
  }, [visible, reducedMotion, first, second, fade, validation]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.get() }));

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.absolute,
        {
          left: box.x - PAD,
          top: box.y - PAD,
          width: box.width + 2 * PAD,
          height: box.height + 2 * PAD,
        },
        fadeStyle,
      ]}
    >
      <Svg width={box.width + 2 * PAD} height={box.height + 2 * PAD}>
        {lines.map((line, index) => (
          <OutlineLine
            key={index}
            d={line.d}
            length={line.length}
            stroke={LINES[index]?.stroke ?? 1}
            opacity={LINES[index]?.opacity ?? 1}
            colour={colors.action}
            drawn={index === 0 ? first : second}
          />
        ))}
      </Svg>
    </Animated.View>
  );
}

function OutlineLine({
  d,
  length,
  stroke,
  opacity,
  colour,
  drawn,
}: {
  d: string;
  length: number;
  stroke: number;
  opacity: number;
  colour: string;
  drawn: SharedValue<number>;
}) {
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: length * (1 - drawn.get()),
    // Nothing at all once erased, not even the round cap of the dash.
    strokeOpacity: drawn.get() > 0 ? opacity : 0,
  }));
  return (
    <AnimatedPath
      d={d}
      fill="none"
      stroke={colour}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={[length, length]}
      animatedProps={animatedProps}
    />
  );
}

const styles = StyleSheet.create({
  absolute: { position: 'absolute' },
});
