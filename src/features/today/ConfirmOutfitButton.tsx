import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
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
import { useTheme } from '../../ui/theme';
import { fontFamilies, size } from '../../ui/tokens';
import { joinList } from './joinList';
import type { RequiredPiece } from './outfitChoice';
import { ValidationBurst } from './ValidationBurst';

const CHECK = 26;
const CHECK_STROKE = 2.2;
const CHECK_PATH = 'M5 12.5l4.5 4.5L19 7.5';
// Length of CHECK_PATH in its 24 pt viewBox, for drawing it like a pen.
const CHECK_LENGTH = Math.hypot(4.5, 4.5) + Math.hypot(9.5, 9.5);
const LOCK = 22;
// The « Portée aujourd’hui » pill: its label 18 pt from the left edge, 10 pt
// before the lock, which keeps the round button's centre (28 pt from the
// right edge). Its width follows the label (about 196 pt).
const PILL = { left: 18, gap: 10, right: (size.sizeCta - LOCK) / 2 };
const PILL_ESTIMATE = 196;
// Wide enough for the label at any text size: it is measured, not drawn, there.
const LABEL_ROOM = 480;
const RING_SCALE = 1.9;
const RING_OPACITY = 0.55;

const AnimatedPath = Animated.createAnimatedComponent(Path);

const { validation } = motion;
// How long the pill takes to stretch, show its label and grow its lock.
const PILL_SETTLED = Math.max(
  validation.stretch.duration,
  validation.lockIn.duration,
  validation.labelIn.delay + validation.labelIn.duration,
);
const instant = { duration: 0 };

interface ConfirmOutfitButtonProps {
  // What the outfit still lacks; empty when it can be worn.
  missing: readonly RequiredPiece[];
  // The outfit is validated: the button is the « Portée aujourd’hui » pill
  // and undoes it.
  frozen: boolean;
  // Validates or undoes; true when it did.
  onPress: () => boolean;
  // How far up the pill goes to sit astride the bottom of the outline (pt).
  lift: number;
  // How far left of the button's right edge the pill centres itself (pt).
  centre: number;
}

/**
 * « Je porte cette tenue », Today's main action (design spec 01, « Validation
 * de la tenue »). Disabled, it stays in place and findable by screen readers,
 * with the reason in its name. Validating squashes it, throws a ring and dots
 * around it, then stretches it to the left into a glass pill « Portée
 * aujourd’hui » with a lock; a tap on the pill undoes the validation, shrinks
 * it back and draws the check again. Opened on a validated outfit, the pill
 * is shown at once. Its parent anchors it by its right edge; the pill moves
 * up and sideways from there, so the round button stays in place.
 */
export function ConfirmOutfitButton({
  missing,
  frozen,
  onPress,
  lift,
  centre,
}: ConfirmOutfitButtonProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors, shadows } = theme;
  const reducedMotion = useReducedMotion();
  const enabled = frozen || missing.length === 0;

  const scale = useSharedValue(1);
  // 0 → 1: one ring leaving the button; 1 at rest (invisible).
  const ring = useSharedValue(1);
  // 0 → 1: the dots thrown on validation; 1 at rest (gone).
  const burst = useSharedValue(1);
  // 0: action and check; 1: glass and lock.
  const lock = useSharedValue(frozen ? 1 : 0);
  // 0: the round button; 1: the pill, and its label shown.
  const stretch = useSharedValue(frozen ? 1 : 0);
  const labelShown = useSharedValue(frozen ? 1 : 0);
  // Reduced motion: the whole button fades out and back between its states.
  const shown = useSharedValue(1);
  const [labelWidth, setLabelWidth] = useState<number | null>(null);
  const pillWidth =
    labelWidth === null ? PILL_ESTIMATE : PILL.left + labelWidth + PILL.gap + LOCK + PILL.right;
  // How much of the check is drawn.
  const check = useSharedValue(1);
  // The solid fill of an active button, grown from the centre on activation.
  const fill = useSharedValue(missing.length === 0 ? 1 : 0);

  const drawCheck = (delay: number) => {
    if (reducedMotion) return;
    check.set(
      withSequence(withTiming(0, instant), withDelay(delay, withTiming(1, validation.checkDraw))),
    );
    ring.set(
      withDelay(delay, withSequence(withTiming(0, instant), withTiming(1, validation.ring))),
    );
  };
  // Reduced motion: the button fades out, changes, and fades back in.
  const crossFade = (delay: number, target: number) => {
    const fade = validation.stampFade;
    shown.set(withDelay(delay, withSequence(withTiming(0, fade), withTiming(1, fade))));
    for (const value of [lock, stretch, labelShown])
      value.set(withDelay(delay + fade.duration, withTiming(target, instant)));
    return fade.duration;
  };
  // The label fades and the pill shrinks back down to the active button;
  // returns how long it takes.
  const shrinkPill = () => {
    for (const value of [lock, stretch, labelShown, shown]) cancelAnimation(value);
    if (reducedMotion) return crossFade(0, 0);
    const { shrink } = validation;
    // The check is drawn again once the pill is round.
    check.set(0);
    labelShown.set(withTiming(0, validation.labelOut));
    stretch.set(withTiming(0, shrink));
    lock.set(withTiming(0, shrink));
    return shrink.duration;
  };
  // The check fades, the button stretches into the pill as it goes up onto
  // the outline, its label fades in and the lock grows.
  const stretchPill = (delay: number) => {
    if (reducedMotion) {
      crossFade(delay, 1);
      return;
    }
    lock.set(withDelay(delay, withTiming(1, validation.lockIn)));
    stretch.set(withDelay(delay, withTiming(1, validation.stretch)));
    labelShown.set(withDelay(delay + validation.labelIn.delay, withTiming(1, validation.labelIn)));
  };

  // What the button is in the middle of; taps do nothing until it is idle.
  // - settling: from the validation until the pill is in place, so that the
  //   animation always ends on the pill;
  // - undoing: a tap on the pill shrinks it first, then undoes (undoing
  //   redraws the whole outfit, which would swallow the shrink), until the
  //   button is round again.
  const phase = useRef<'idle' | 'settling' | 'undoing'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const after = (delay: number, then: () => void) => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      then();
    }, delay);
  };
  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );
  const press = () => {
    if (phase.current !== 'idle') return;
    if (!frozen) {
      onPress();
      return;
    }
    phase.current = 'undoing';
    after(shrinkPill(), () => {
      if (onPress()) return;
      // Not undone: back to the pill.
      phase.current = 'idle';
      stretchPill(0);
    });
  };

  const previous = useRef({ frozen, enabled });
  useEffect(() => {
    const before = previous.current;
    previous.current = { frozen, enabled };
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
        ring.set(withSequence(withTiming(0, instant), withTiming(1, validation.ring)));
        burst.set(
          withSequence(
            withTiming(0, instant),
            withTiming(1, { duration: validation.burst.duration }),
          ),
        );
      }
      stretchPill(validation.lockDelay);
      phase.current = 'settling';
      after(
        validation.lockDelay + (reducedMotion ? 2 * validation.stampFade.duration : PILL_SETTLED),
        () => {
          phase.current = 'idle';
        },
      );
    } else if (!frozen && before.frozen) {
      // Undone: once the pill is back to the round button, the check draws
      // again and a ring leaves.
      drawCheck(phase.current === 'undoing' ? 0 : shrinkPill());
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = null;
      phase.current = 'idle';
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
    // Runs on a change of state only; the helpers read the same shared values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frozen, enabled]);

  const pressIn = () => {
    if (!enabled || frozen || reducedMotion) return;
    scale.set(withTiming(0.9, validation.pressIn));
  };
  const pressOut = () => {
    if (!frozen) scale.set(withTiming(1, validation.pressIn));
  };

  const label = frozen
    ? t('today.confirmed')
    : missing.length === 0
      ? t('today.confirm')
      : t('today.confirmUnavailable', {
          reason: t('today.missingPieces', {
            pieces: joinList(
              missing.map((piece) => t(`today.aPiece.${piece}`)),
              t('today.and'),
            ),
          }),
        });

  const bounce = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  // The pill rises and slides to its centre with its stretch.
  const rise = useAnimatedStyle(() => ({
    opacity: shown.get(),
    transform: [
      { translateX: (pillWidth / 2 - centre) * stretch.get() },
      { translateY: -lift * stretch.get() },
    ],
  }));
  const width = useAnimatedStyle(() => ({
    width: size.sizeCta + (pillWidth - size.sizeCta) * stretch.get(),
  }));
  const labelLook = useAnimatedStyle(() => ({ opacity: labelShown.get() }));
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
    <Animated.View style={rise}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !enabled, selected: frozen }}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={!enabled}
        onPress={press}
      >
        <Animated.View style={[styles.button, width]}>
          <ValidationBurst progress={burst} style={styles.burst} />
          <Animated.View style={[StyleSheet.absoluteFill, bounce]}>
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
                  styles.pill,
                  { borderColor: colors.glassEdge, borderWidth: 1, boxShadow: shadows.shadowGlass },
                ]}
              />
            </Animated.View>
            <Animated.View
              style={[styles.label, labelLook]}
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <Text
                numberOfLines={1}
                style={[styles.labelText, { color: colors.ink }]}
                onLayout={(event) => setLabelWidth(Math.ceil(event.nativeEvent.layout.width))}
              >
                {t('today.worn')}
              </Text>
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
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // The round button and the pill grow from the right edge, where the
  // check, the lock, the ring and the burst stay.
  button: { width: size.sizeCta, height: size.sizeCta },
  round: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: size.sizeCta,
    height: size.sizeCta,
    borderRadius: size.sizeCta / 2,
  },
  pill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: size.sizeCta / 2,
  },
  label: {
    position: 'absolute',
    top: 0,
    left: PILL.left,
    width: LABEL_ROOM,
    height: size.sizeCta,
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelText: { fontFamily: fontFamilies.text, fontSize: 14.5, fontWeight: '600' },
  ring: { borderWidth: 2 },
  centre: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: size.sizeCta,
    height: size.sizeCta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  burst: { position: 'absolute', right: size.sizeCta / 2, top: size.sizeCta / 2 },
});
