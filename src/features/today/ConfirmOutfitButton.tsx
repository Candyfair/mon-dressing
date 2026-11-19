import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Glass } from '../../ui/Glass';
import { Icon } from '../../ui/Icon';
import { motion } from '../../ui/motion';
import { type Theme, useTheme } from '../../ui/theme';
import { size } from '../../ui/tokens';

const CHECK = 26;
const CHECK_STROKE = 2.2;
const CHECK_PATH = 'M5 12.5l4.5 4.5L19 7.5';
// Length of CHECK_PATH in its 24 pt viewBox, for drawing it like a pen.
const CHECK_LENGTH = Math.hypot(4.5, 4.5) + Math.hypot(9.5, 9.5);
const LOCK = 22;
const RING_SCALE = 1.9;
const RING_OPACITY = 0.55;

const AnimatedPath = Animated.createAnimatedComponent(Path);

const { validation } = motion;
const instant = { duration: 0 };

interface ConfirmOutfitButtonProps {
  // What the outfit still lacks; null when it can be worn.
  missing: 'top' | 'bottom' | null;
  // The outfit is validated: the button is a glass lock and undoes it.
  frozen: boolean;
  onPress: () => void;
}

/**
 * « Je porte cette tenue », Today's main action (design spec 01, « Validation
 * de la tenue »). Disabled, it stays in place and findable by screen readers,
 * with the reason in its name. Validating squashes it, throws a ring and dots
 * around it, then turns it into a glass lock; a tap on the lock undoes the
 * validation and draws the check again. Opened on a validated outfit, the
 * lock is shown at once.
 */
export function ConfirmOutfitButton({ missing, frozen, onPress }: ConfirmOutfitButtonProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors, shadows } = theme;
  const reducedMotion = useReducedMotion();
  const enabled = frozen || missing === null;

  const scale = useSharedValue(1);
  // 0 → 1: one ring leaving the button; 1 at rest (invisible).
  const ring = useSharedValue(1);
  // 0 → 1: the dots thrown on validation; 1 at rest (gone).
  const burst = useSharedValue(1);
  // 0: action and check; 1: glass and lock.
  const lock = useSharedValue(frozen ? 1 : 0);
  // How much of the check is drawn.
  const check = useSharedValue(1);
  // The solid fill of an active button, grown from the centre on activation.
  const fill = useSharedValue(missing === null ? 1 : 0);

  const previous = useRef({ frozen, enabled });
  useEffect(() => {
    const before = previous.current;
    previous.current = { frozen, enabled };
    const throwRing = () => {
      if (!reducedMotion)
        ring.set(withSequence(withTiming(0, instant), withTiming(1, validation.ring)));
    };
    if (frozen && !before.frozen) {
      // Validated: release bounce, ring and dots, then the lock.
      if (!reducedMotion) {
        const peak = validation.release.duration * validation.release.peak;
        scale.set(
          withSequence(
            withTiming(1.18, { duration: peak }),
            withTiming(1, { duration: validation.release.duration - peak }),
          ),
        );
        throwRing();
        burst.set(
          withSequence(
            withTiming(0, instant),
            withTiming(1, { duration: validation.burst.duration }),
          ),
        );
      }
      lock.set(
        withDelay(
          validation.lockDelay,
          withTiming(1, reducedMotion ? validation.stampFade : validation.lockIn),
        ),
      );
    } else if (!frozen && before.frozen) {
      // Undone: back to the active button, the check drawn again.
      cancelAnimation(lock);
      lock.set(withTiming(0, validation.checkOut));
      if (!reducedMotion) {
        check.set(
          withSequence(
            withTiming(0, instant),
            withDelay(validation.checkDraw.delay, withTiming(1, validation.checkDraw)),
          ),
        );
        throwRing();
      }
    }
    if (enabled && !before.enabled) {
      // The outfit became complete: the fill grows, the check draws, a ring
      // leaves and the button bounces.
      if (reducedMotion) {
        fill.set(withTiming(1, validation.stampFade));
      } else {
        fill.set(withSequence(withTiming(0, instant), withTiming(1, validation.activation)));
        check.set(
          withSequence(
            withTiming(0, instant),
            withDelay(validation.checkDraw.delay, withTiming(1, validation.checkDraw)),
          ),
        );
        ring.set(
          withDelay(
            validation.activationRingDelay,
            withSequence(withTiming(0, instant), withTiming(1, validation.ring)),
          ),
        );
        scale.set(
          withDelay(
            validation.activationRingDelay,
            withSequence(
              withTiming(1.12, { duration: validation.activationBounce / 2 }),
              withTiming(1, { duration: validation.activationBounce / 2 }),
            ),
          ),
        );
      }
    } else if (!enabled && before.enabled) {
      cancelAnimation(fill);
      fill.set(0);
    }
  }, [frozen, enabled, reducedMotion, scale, ring, burst, lock, check, fill]);

  const pressIn = () => {
    if (!enabled || frozen || reducedMotion) return;
    scale.set(withTiming(0.9, validation.pressIn));
  };
  const pressOut = () => {
    if (!frozen) scale.set(withTiming(1, validation.pressIn));
  };

  const label = frozen
    ? t('today.confirmed')
    : missing === null
      ? t('today.confirm')
      : t(`today.confirmMissing.${missing}`);

  const bounce = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const solid = useAnimatedStyle(() => ({ opacity: 1 - lock.get() }));
  const grown = useAnimatedStyle(() => ({ transform: [{ scale: fill.get() }] }));
  const glass = useAnimatedStyle(() => ({ opacity: Math.min(1, lock.get() * 1.5) }));
  const checkLook = useAnimatedStyle(() => {
    const hidden = Math.min(1, lock.get() * 2);
    return { opacity: 1 - hidden, transform: [{ scale: 1 - 0.6 * hidden }] };
  });
  const lockLook = useAnimatedStyle(() => ({
    opacity: Math.min(1, lock.get() * 1.45),
    transform: [{ scale: 0.4 + 0.6 * lock.get() }],
  }));
  const ringLook = useAnimatedStyle(() => ({
    opacity: ring.get() < 1 ? RING_OPACITY * (1 - ring.get()) : 0,
    transform: [{ scale: 1 + (RING_SCALE - 1) * ring.get() }],
  }));
  const checkProps = useAnimatedProps(() => ({
    strokeDashoffset: CHECK_LENGTH * (1 - check.get()),
  }));

  const checkColor = enabled ? colors.onAction : colors.onActionDisabled;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !enabled, selected: frozen }}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={!enabled}
      onPress={onPress}
      style={styles.button}
    >
      <Burst progress={burst} theme={theme} />
      <Animated.View style={[styles.button, bounce]}>
        <Animated.View style={[StyleSheet.absoluteFill, solid]}>
          <View style={[styles.round, { backgroundColor: colors.actionDisabled }]} />
          <Animated.View
            style={[
              styles.round,
              { backgroundColor: colors.action, boxShadow: shadows.shadowCta },
              grown,
            ]}
          />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, glass]}>
          <Glass
            style={[
              styles.round,
              { borderColor: colors.glassEdge, borderWidth: 1, boxShadow: shadows.shadowAdd },
            ]}
          />
        </Animated.View>
        <Animated.View
          style={[styles.round, styles.ring, { borderColor: colors.action }, ringLook]}
        />
        <Animated.View style={[styles.centre, checkLook]}>
          <Svg
            width={CHECK}
            height={CHECK}
            viewBox="0 0 24 24"
            fill="none"
            accessible={false}
            importantForAccessibility="no-hide-descendants"
          >
            <AnimatedPath
              d={CHECK_PATH}
              stroke={checkColor}
              strokeWidth={CHECK_STROKE}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={[CHECK_LENGTH, CHECK_LENGTH]}
              animatedProps={checkProps}
            />
          </Svg>
        </Animated.View>
        <Animated.View style={[styles.centre, lockLook]}>
          <Icon name="lock" size={LOCK} color={colors.ink} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

// The dots of the burst: directions, speeds and sizes drawn once from a fixed
// seed, so the burst looks the same every time.
const DOTS = (() => {
  let seed = 11;
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  return Array.from({ length: motion.validation.burst.count }, (_, index) => {
    const angle = random() * Math.PI * 2;
    const speed = 4.2 * (0.45 + random() * 0.75);
    return {
      angle,
      speed,
      diameter: (2 * (4 + random() * 3)) / 2.6,
      colour: index % 4,
    };
  });
})();

// The prototype slows each dot by 8 % per frame, for 34 frames.
const FRICTION = 0.92;
const FRAMES = 34;

function Burst({ progress, theme }: { progress: SharedValue<number>; theme: Theme }) {
  const { colors } = theme;
  const palette = [
    colors.celebration1,
    colors.celebration2,
    colors.celebration3,
    colors.celebration4,
  ];
  return (
    <View style={styles.burst} pointerEvents="none">
      {DOTS.map((dot, index) => (
        <BurstDot key={index} dot={dot} colour={palette[dot.colour]} progress={progress} />
      ))}
    </View>
  );
}

function BurstDot({
  dot,
  colour,
  progress,
}: {
  dot: (typeof DOTS)[number];
  colour: string | undefined;
  progress: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    const time = progress.get();
    const frames = FRAMES * time;
    const travel = (dot.speed * FRICTION * (1 - FRICTION ** frames)) / (1 - FRICTION);
    return {
      opacity: time < 1 ? Math.min(1, (1 - time) * 1.6) : 0,
      transform: [
        { translateX: Math.cos(dot.angle) * travel },
        { translateY: Math.sin(dot.angle) * travel },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width: dot.diameter,
          height: dot.diameter,
          borderRadius: dot.diameter / 2,
          marginLeft: -dot.diameter / 2,
          marginTop: -dot.diameter / 2,
          backgroundColor: colour,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    width: size.sizeCta,
    height: size.sizeCta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  round: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: size.sizeCta,
    height: size.sizeCta,
    borderRadius: size.sizeCta / 2,
  },
  ring: { borderWidth: 2 },
  centre: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  burst: { position: 'absolute', left: size.sizeCta / 2, top: size.sizeCta / 2 },
  dot: { position: 'absolute' },
});
