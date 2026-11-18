import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { withMinAlpha } from './color';
import { Icon } from './Icon';
import { motion } from './motion';
import {
  HOVERED_DISC,
  RADIAL_LABEL_WIDTH,
  type RadialFan,
  radialHoverOffset,
  type RadialBounds,
  type RadialPoint,
  RECOMMENDED_DISC,
} from './radialLayout';
import type { RadialAction, RadialMenuRequest } from './radialMenuContext';
import { useTheme } from './theme';
import { fontFamilies, size, spacing, themes } from './tokens';

// The discs stay light on the dark theme too (05-dressing, V2).
const DISC_COLORS = themes.matin.colors;
const DISC_SHADOW = themes.matin.shadows.shadowCta;
// The scrim of the mockups is darker than the sheets' one.
const SCRIM_ALPHA = 0.55;
const LIFTED_SCALE = 1.04;
// `shadow-piece-drop`; a piece is a cutout, so its shadow follows its outline.
const LIFT_SHADOW = { offsetX: 0, offsetY: 10, standardDeviation: 5 };
const DISC_START_SCALE = 0.6;
const ICON_RATIO = 0.5;
const ICON_STROKE = 1.8;
// The hovered disc turns to its action's colour, with a cream ring and a halo
// that stand out on the dark scrim (Candice, S6).
const HOVER_RING = 3;
const HOVER_GLOW_ALPHA = '99';
// The slow drift of the discs while one is hovered, in points; the discs next
// to the hovered one follow it at a smaller scale.
const FLOAT_X = 2;
const FLOAT_Y = 3;
const FLOAT_SCALE = 0.015;
const FLOAT_NEIGHBOUR = 0.4;
const FLOAT_NEIGHBOURS = 2;
const FULL_TURN = 2 * Math.PI;
const RECOMMEND_RING = 3;
// `recommend` at 55 %, in hexadecimal alpha.
const RECOMMEND_GLOW_ALPHA = '8C';
const PRESS_RING_BORDER = 2;
const PRESS_RING_FILL = 0.25;
const LABEL_HEIGHT = 28;
const LABEL_PADDING = 12;
const LABEL_DOT = 8;

interface RadialMenuProps {
  request: RadialMenuRequest;
  bounds: RadialBounds;
  open: boolean;
  hovered: SharedValue<number>;
  finger: SharedValue<RadialPoint>;
  onClosed: () => void;
}

/**
 * The fan of a long press (design-system/components/RadialMenu). Only draws:
 * the finger stays with the touched piece's gesture, so nothing here takes
 * touches. Hidden from screen readers, which get accessibility actions.
 */
export function RadialMenu({ request, bounds, open, hovered, finger, onClosed }: RadialMenuProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const floatPhase = useSharedValue(0);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const { actions, anchor, layout, piece, pieceFrame, recommendation } = request;

  useEffect(() => {
    if (open) {
      progress.set(
        reducedMotion ? withTiming(1, motion.radial.fade) : withSpring(1, motion.radial.open),
      );
    } else {
      progress.set(
        withTiming(0, motion.radial.close, (finished) => {
          if (finished) scheduleOnRN(onClosed);
        }),
      );
    }
  }, [open, reducedMotion, progress, onClosed]);

  useEffect(() => {
    if (reducedMotion) return undefined;
    floatPhase.set(withRepeat(withTiming(FULL_TURN, motion.radial.float), -1));
    return () => cancelAnimation(floatPhase);
  }, [reducedMotion, floatPhase]);

  useAnimatedReaction(
    () => hovered.get(),
    (index, previous) => {
      if (index !== previous) scheduleOnRN(setHoveredIndex, index);
    },
  );

  const fade = useAnimatedStyle(() => ({ opacity: Math.min(progress.get(), 1) }));
  const lifted = useAnimatedStyle(() => ({
    opacity: Math.min(progress.get(), 1),
    transform: [{ scale: 1 + (LIFTED_SCALE - 1) * Math.min(progress.get(), 1) }],
  }));

  const hoveredAction = actions[hoveredIndex];
  const recommended = actions.find((action) => action.id === recommendation?.actionId);
  const label = hoveredAction?.label ?? (recommended ? recommendation?.label : undefined);
  const fan: RadialFan = { discs: layout.discs, anchor, bounds };
  const pressRingLeft = anchor.x - size.sizeRadial / 2;
  const pressRingTop = anchor.y - size.sizeRadial / 2;

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFill}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: withMinAlpha(colors.scrim, SCRIM_ALPHA) },
          fade,
        ]}
      />
      <Animated.View
        style={[
          styles.absolute,
          styles.lifted,
          pieceFrame,
          Platform.OS === 'android'
            ? { filter: [{ dropShadow: { ...LIFT_SHADOW, color: colors.contactShadow } }] }
            : { ...styles.liftShadow, shadowColor: colors.contactShadow },
          lifted,
        ]}
      >
        {piece}
      </Animated.View>
      <Animated.View
        style={[
          styles.absolute,
          styles.pressRing,
          { left: pressRingLeft, top: pressRingTop },
          fade,
        ]}
      >
        <View style={styles.pressRingFill} />
      </Animated.View>

      {actions.map((action, index) => {
        const place = layout.discs[index];
        if (!place) return null;
        return (
          <RadialDisc
            key={action.id}
            action={action}
            index={index}
            place={place}
            fan={fan}
            anchor={anchor}
            recommended={action.id === recommended?.id}
            progress={progress}
            hovered={hovered}
            finger={finger}
            floatPhase={floatPhase}
            reducedMotion={reducedMotion}
          />
        );
      })}

      {label ? (
        <Animated.View
          style={[
            styles.absolute,
            styles.labelPlace,
            { left: layout.label.x - RADIAL_LABEL_WIDTH / 2, top: layout.label.y },
            fade,
          ]}
        >
          <View style={[styles.label, { backgroundColor: colors.ink }]}>
            {hoveredAction ? null : (
              <View style={[styles.labelDot, { backgroundColor: colors.recommend }]} />
            )}
            <Text numberOfLines={1} style={[styles.labelText, { color: colors.onAction }]}>
              {label}
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

interface RadialDiscProps {
  action: RadialAction;
  index: number;
  place: RadialPoint;
  fan: RadialFan;
  anchor: RadialPoint;
  recommended: boolean;
  progress: SharedValue<number>;
  hovered: SharedValue<number>;
  finger: SharedValue<RadialPoint>;
  floatPhase: SharedValue<number>;
  reducedMotion: boolean;
}

function RadialDisc({
  action,
  index,
  place,
  fan,
  anchor,
  recommended,
  progress,
  hovered,
  finger,
  floatPhase,
  reducedMotion,
}: RadialDiscProps) {
  const dimension = recommended ? RECOMMENDED_DISC : size.sizeRadial;
  const hoverScale = HOVERED_DISC / dimension;
  const hover = useDerivedValue(() => {
    const isHovered = hovered.get() === index;
    if (reducedMotion) return Number(isHovered);
    return withSpring(isHovered ? 1 : 0, isHovered ? motion.radial.hover : motion.radial.hoverOut);
  });
  const tone = useDerivedValue(() => {
    const isHovered = hovered.get() === index;
    return reducedMotion
      ? Number(isHovered)
      : withTiming(Number(isHovered), motion.radial.hoverTone);
  });
  const shift = useDerivedValue(() =>
    radialHoverOffset(fan, index, hovered.get(), reducedMotion ? place : finger.get()),
  );
  const drift = useDerivedValue(() => {
    const current = hovered.get();
    if (current === index) return motion.radial.driftHovered;
    return current >= 0 && Math.abs(current - index) === 1
      ? motion.radial.driftNear
      : motion.radial.driftFar;
  });
  const shiftX = useDerivedValue(() =>
    reducedMotion ? shift.get().x : withSpring(shift.get().x, drift.get()),
  );
  const shiftY = useDerivedValue(() =>
    reducedMotion ? shift.get().y : withSpring(shift.get().y, drift.get()),
  );
  const floating = useDerivedValue(() => {
    const current = hovered.get();
    const distance = Math.abs(current - index);
    const amount =
      current < 0 || reducedMotion
        ? 0
        : distance === 0
          ? 1
          : distance <= FLOAT_NEIGHBOURS
            ? FLOAT_NEIGHBOUR
            : 0;
    return withTiming(amount, motion.radial.floatFade);
  });

  const placed = useAnimatedStyle(() => {
    const shown = progress.get();
    const travel = reducedMotion ? 0 : 1 - shown;
    const startScale = reducedMotion ? 1 : DISC_START_SCALE + (1 - DISC_START_SCALE) * shown;
    // Each disc has its own moment in the drift, so they never move as one.
    const phase = floatPhase.get() + index;
    const float = floating.get();
    return {
      opacity: Math.min(shown, 1),
      zIndex: hover.get() > 0.01 ? 1 : 0,
      transform: [
        {
          translateX:
            (anchor.x - place.x) * travel + shiftX.get() + Math.cos(phase) * FLOAT_X * float,
        },
        {
          translateY:
            (anchor.y - place.y) * travel + shiftY.get() + Math.sin(2 * phase) * FLOAT_Y * float,
        },
        {
          scale:
            startScale *
            (1 + (hoverScale - 1) * hover.get()) *
            (1 + Math.sin(phase) * FLOAT_SCALE * float),
        },
      ],
    };
  });
  const hoverFill = useAnimatedStyle(() => ({ opacity: tone.get() }));

  const active = action.active === true;
  const tint = active && action.status ? DISC_COLORS[`status${action.status}Bg`] : undefined;
  const ink =
    active && action.status ? DISC_COLORS[`status${action.status}`] : DISC_COLORS.inkSecondary;
  const hoverColor = action.status ? DISC_COLORS[`status${action.status}`] : DISC_COLORS.action;
  const hoverRing = (HOVER_RING * dimension) / HOVERED_DISC;
  const ringShadow = `0 0 0 ${RECOMMEND_RING}px ${DISC_COLORS.recommend}, 0 0 20px 4px ${DISC_COLORS.recommend}${RECOMMEND_GLOW_ALPHA}, `;

  const iconProps = {
    name: action.icon,
    size: dimension * ICON_RATIO,
    strokeWidth: ICON_STROKE,
    filled: active && action.fillWhenActive === true,
  };

  return (
    <Animated.View
      style={[
        styles.absolute,
        styles.disc,
        {
          left: place.x - dimension / 2,
          top: place.y - dimension / 2,
          width: dimension,
          height: dimension,
          boxShadow: `${recommended ? ringShadow : ''}${DISC_SHADOW}`,
        },
        placed,
      ]}
    >
      {tint ? <View style={[styles.discFill, { backgroundColor: tint }]} /> : null}
      <Icon {...iconProps} color={ink} />
      <Animated.View
        style={[
          styles.discFill,
          styles.hoverFill,
          {
            backgroundColor: hoverColor,
            boxShadow: `0 0 0 ${hoverRing}px ${DISC_COLORS.linen}, 0 0 18px 6px ${hoverColor}${HOVER_GLOW_ALPHA}`,
          },
          hoverFill,
        ]}
      >
        <Icon {...iconProps} color={DISC_COLORS.linen} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  absolute: { position: 'absolute' },
  lifted: { alignItems: 'center', justifyContent: 'center' },
  liftShadow: {
    shadowOffset: { width: 0, height: LIFT_SHADOW.offsetY },
    shadowRadius: 10,
    shadowOpacity: 1,
  },
  pressRing: {
    width: size.sizeRadial,
    height: size.sizeRadial,
    borderRadius: size.sizeRadial / 2,
    borderWidth: PRESS_RING_BORDER,
    borderColor: DISC_COLORS.linen,
    overflow: 'hidden',
  },
  pressRingFill: {
    ...StyleSheet.absoluteFill,
    backgroundColor: DISC_COLORS.linen,
    opacity: PRESS_RING_FILL,
  },
  disc: {
    borderRadius: RECOMMENDED_DISC,
    backgroundColor: DISC_COLORS.linen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discFill: { ...StyleSheet.absoluteFill, borderRadius: RECOMMENDED_DISC },
  hoverFill: { alignItems: 'center', justifyContent: 'center' },
  labelPlace: { width: RADIAL_LABEL_WIDTH, alignItems: 'center' },
  label: {
    height: LABEL_HEIGHT,
    borderRadius: LABEL_HEIGHT / 2,
    paddingHorizontal: LABEL_PADDING,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.space6,
  },
  labelDot: { width: LABEL_DOT, height: LABEL_DOT, borderRadius: LABEL_DOT / 2 },
  labelText: { fontFamily: fontFamilies.text, fontSize: 13, fontWeight: '600' },
});
