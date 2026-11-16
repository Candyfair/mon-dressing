import { type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type AccessibilityActionEvent,
  type LayoutChangeEvent,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { loopIndex, rubberBand, swipeStep } from './loopIndex';
import { motion } from './motion';

// Horizontal travel before the carousel takes the gesture, and vertical travel
// that hands it over (to a scroll view, a sheet): a row only catches its own
// horizontal swipe.
const ACTIVE_OFFSET_X = 12;
const FAIL_OFFSET_Y = 12;
// Lane edges faded like `md-swap-lane`: transparent at the edge, opaque from
// 22 % to 80 % of the width.
const EDGE_FADE = [0, 0.22, 0.8, 1];

interface LoopingCarouselProps<T> {
  items: readonly T[];
  // Index of the current piece in `items`; the carousel reports changes and
  // follows the value it is given.
  index: number;
  onIndexChange: (index: number) => void;
  renderItem: (item: T) => ReactNode;
  // Distance between the centres of two pieces: the next one arrives close.
  step: number;
  height: number;
  // Neighbours at rest: 0 hides them (Today's rows), and they show only while
  // dragging; above 0 they stay visible, faded (sheet, Wardrobe).
  neighbourOpacity?: number;
  // Neighbour size relative to the current piece.
  neighbourScale?: number;
  // Fades the pieces near the edges (two-column lane, without a hard cut).
  edgeFade?: boolean;
  // Drag started or ended, to fade out "Ajouter une couche" meanwhile.
  onSwipeActiveChange?: (active: boolean) => void;
  // Tap: see the piece large / open it.
  onPress?: () => void;
  // The carousel is one accessible element named after its current piece;
  // swiping is exposed as "Pièce suivante" / "Pièce précédente" actions.
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Shared looping carousel (SPEC §9.1, design-system SwapCarousel): every
 * carousel loops in both directions, a single piece bounces back, the other
 * proposals fade out on release. Reduced motion: no slide, a short
 * cross-fade. Only the current piece and two neighbours on each side are
 * rendered.
 */
export function LoopingCarousel<T>({
  items,
  index,
  onIndexChange,
  renderItem,
  step,
  height,
  neighbourOpacity = 0,
  neighbourScale = 1,
  edgeFade = false,
  onSwipeActiveChange,
  onPress,
  accessibilityLabel,
  style,
}: LoopingCarouselProps<T>) {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const count = items.length;

  // Absolute (unwrapped) index of the current piece: slots keep their key
  // while the carousel goes round, so nothing jumps when it settles.
  const [base, setBase] = useState(index);
  const position = useSharedValue(index);
  const dragStart = useSharedValue(index);
  // 1 while dragging: shows the hidden neighbours.
  const revealed = useSharedValue(0);
  // Reduced motion cross-fade of the current piece.
  const fade = useSharedValue(1);
  const width = useSharedValue(0);

  const commit = (target: number) => {
    setBase(target);
    onIndexChange(loopIndex(target, count));
  };

  // Follow an index set from outside (accessibility action, new suggestion).
  if (loopIndex(base, count) !== index) {
    setBase(index);
  }
  // ...and move the pieces there, unless a gesture already did.
  useEffect(() => {
    if (Math.round(position.get()) !== base) {
      position.set(base);
    }
  }, [base, position]);

  const swipeActive = (active: boolean) => onSwipeActiveChange?.(active);

  const pan = Gesture.Pan()
    .activeOffsetX([-ACTIVE_OFFSET_X, ACTIVE_OFFSET_X])
    .failOffsetY([-FAIL_OFFSET_Y, FAIL_OFFSET_Y])
    .onStart(() => {
      cancelAnimation(position);
      const start = Math.round(position.get());
      position.set(start);
      dragStart.set(start);
      if (!reducedMotion) {
        revealed.set(withTiming(1, motion.carousel.neighbourFadeIn));
      }
      scheduleOnRN(swipeActive, true);
    })
    .onUpdate((event) => {
      if (reducedMotion) return;
      const offset = count > 1 ? event.translationX : rubberBand(event.translationX, step);
      position.set(dragStart.get() - offset / step);
    })
    .onEnd((event) => {
      const moveBy = swipeStep({
        translation: event.translationX,
        velocity: event.velocityX,
        step,
        count,
      });
      const target = dragStart.get() + moveBy;
      revealed.set(withTiming(0, motion.carousel.neighbourFadeOut));
      scheduleOnRN(swipeActive, false);

      if (moveBy === 0) {
        position.set(withSpring(target, motion.carousel.bounce));
        return;
      }
      if (reducedMotion) {
        fade.set(
          withTiming(0, motion.carousel.crossFade, (finished) => {
            if (!finished) return;
            position.set(target);
            scheduleOnRN(commit, target);
            fade.set(withTiming(1, motion.carousel.crossFade));
          }),
        );
        return;
      }
      position.set(
        withTiming(target, motion.carousel.settle, (finished) => {
          if (finished) scheduleOnRN(commit, target);
        }),
      );
    });

  const tap = Gesture.Tap()
    .enabled(onPress !== undefined)
    .onEnd((_event, success) => {
      if (success && onPress) scheduleOnRN(onPress);
    });

  const gesture = Gesture.Exclusive(pan, tap);

  const moveTo = (moveBy: -1 | 1) => {
    if (count <= 1) return;
    const target = base + moveBy;
    position.set(target);
    commit(target);
  };

  const onAccessibilityAction = (event: AccessibilityActionEvent) => {
    switch (event.nativeEvent.actionName) {
      case 'next':
      case 'increment':
        moveTo(1);
        break;
      case 'previous':
      case 'decrement':
        moveTo(-1);
        break;
      case 'activate':
        onPress?.();
        break;
    }
  };

  const offsets = count > 1 ? [-2, -1, 0, 1, 2] : count === 1 ? [0] : [];

  return (
    <GestureDetector gesture={gesture}>
      <View
        accessible
        accessibilityRole={onPress ? 'button' : 'adjustable'}
        accessibilityLabel={accessibilityLabel}
        accessibilityActions={[
          { name: 'next', label: t('carousel.next') },
          { name: 'previous', label: t('carousel.previous') },
          ...(onPress ? [{ name: 'activate' }] : [{ name: 'increment' }, { name: 'decrement' }]),
        ]}
        onAccessibilityAction={onAccessibilityAction}
        onLayout={(event: LayoutChangeEvent) => {
          width.set(event.nativeEvent.layout.width);
        }}
        style={[styles.row, { height }, edgeFade && styles.lane, style]}
      >
        {offsets.map((offset) => {
          const absolute = base + offset;
          const item = items[loopIndex(absolute, count)];
          return item === undefined ? null : (
            <CarouselSlot
              key={absolute}
              absolute={absolute}
              position={position}
              revealed={revealed}
              fade={fade}
              width={width}
              step={step}
              neighbourOpacity={neighbourOpacity}
              neighbourScale={neighbourScale}
              edgeFade={edgeFade}
            >
              {renderItem(item)}
            </CarouselSlot>
          );
        })}
      </View>
    </GestureDetector>
  );
}

interface CarouselSlotProps {
  absolute: number;
  position: SharedValue<number>;
  revealed: SharedValue<number>;
  fade: SharedValue<number>;
  width: SharedValue<number>;
  step: number;
  neighbourOpacity: number;
  neighbourScale: number;
  edgeFade: boolean;
  children: ReactNode;
}

function CarouselSlot({
  absolute,
  position,
  revealed,
  fade,
  width,
  step,
  neighbourOpacity,
  neighbourScale,
  edgeFade,
  children,
}: CarouselSlotProps) {
  const animated = useAnimatedStyle(() => {
    const distance = absolute - position.get();
    // 1 for the current piece, 0 from one step away.
    const centred = Math.max(0, 1 - Math.abs(distance));
    const restNeighbour = neighbourOpacity > 0 ? neighbourOpacity : revealed.get();
    let opacity = centred * fade.get() + (1 - centred) * restNeighbour;
    if (edgeFade && width.get() > 0) {
      const w = width.get();
      const centreX = w / 2 + distance * step;
      opacity *= interpolate(
        centreX,
        EDGE_FADE.map((stop) => stop * w),
        [0, 1, 1, 0],
        Extrapolation.CLAMP,
      );
    }
    return {
      opacity,
      transform: [
        { translateX: distance * step },
        { scale: neighbourScale + (1 - neighbourScale) * centred },
      ],
    };
  });

  return (
    <Animated.View
      style={[styles.slot, animated]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { width: '100%' },
  lane: { overflow: 'hidden' },
  slot: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
