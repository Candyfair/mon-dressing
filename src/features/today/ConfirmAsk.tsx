import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, StyleSheet, Text, type TextStyle, View } from 'react-native';
import Animated, {
  cancelAnimation,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { motion } from '../../ui/motion';
import { useTheme } from '../../ui/theme';
import { size } from '../../ui/tokens';
import { joinList } from './joinList';
import type { RequiredPiece } from './outfitChoice';

// The labels of the pills (« Portée aujourd’hui », the confirmation) start
// this far from their left edge; the confirmation's stops a few points
// before the check's round button.
export const PILL_LABEL_LEFT = 18;
const GAP = 4;
const ENDS = GAP + size.sizeCta;
// Wide enough for the label at any text size: it is measured, not drawn, there.
const MEASURE_ROOM = 480;

const { validation } = motion;
const instant = { duration: 0 };

type Widths = { line: number; missing: number; action: number };

export interface ConfirmAsk {
  // The pill is open, for the button's name.
  asking: boolean;
  // Up to date within a tap, before the next render.
  isOpen: () => boolean;
  open: () => void;
  close: () => void;
  // 0: the round button; 1: the pill. Its label's opacity, apart; and the
  // whole button's, for the reduced-motion cross-fade.
  progress: SharedValue<number>;
  labelProgress: SharedValue<number>;
  opacity: SharedValue<number>;
  // « il manque un bas », what the button says on an incomplete outfit.
  pieces: string;
  // « Il manque un bas · Valider quand même ? », also announced.
  name: string;
  missingText: string;
  actionText: string;
  // The pill's width, and its label's, on one line when the room allows it.
  width: number;
  textWidth: number;
  oneLine: boolean;
  measure: (key: keyof Widths, width: number) => void;
}

/**
 * The confirmation of an incomplete outfit (design spec 01, « Validation de
 * la tenue »): a first tap stretches the button into « Il manque un bas ·
 * Valider quand même ? », announced; it folds back after a while, or when
 * what is missing changes.
 */
export function useConfirmAsk({
  missing,
  empty,
  reducedMotion,
  room,
}: {
  missing: readonly RequiredPiece[];
  empty: boolean;
  reducedMotion: boolean;
  // How wide the pill may grow from the button's right edge (pt).
  room: number;
}): ConfirmAsk {
  const { t } = useTranslation();
  const progress = useSharedValue(0);
  const labelProgress = useSharedValue(0);
  const opacity = useSharedValue(1);
  const [asking, setAsking] = useState(false);
  const askingNow = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pieces = joinList(
    missing.map((piece) => t(`today.aPiece.${piece}`)),
    t('today.and'),
  );
  const missingText = t('today.confirmAnyway.missing', { pieces });
  const actionText = t('today.confirmAnyway.ask');
  const name = t('today.confirmAnyway.name', { missing: missingText, ask: actionText });

  const [widths, setWidths] = useState<Widths>({ line: 0, missing: 0, action: 0 });
  const measure = (key: keyof Widths, width: number) =>
    setWidths((current) =>
      current[key] === Math.ceil(width) ? current : { ...current, [key]: Math.ceil(width) },
    );
  const oneLine = PILL_LABEL_LEFT + widths.line + ENDS <= room;
  const textWidth = oneLine ? widths.line : Math.max(widths.missing, widths.action);
  const width = Math.min(room, PILL_LABEL_LEFT + textWidth + ENDS);

  const move = (toOpen: boolean) => {
    cancelAnimation(progress);
    cancelAnimation(labelProgress);
    const target = toOpen ? 1 : 0;
    if (reducedMotion) {
      // The button fades out, changes, and fades back in.
      const fade = validation.stampFade;
      opacity.set(withSequence(withTiming(0, fade), withTiming(1, fade)));
      for (const value of [progress, labelProgress])
        value.set(withDelay(fade.duration, withTiming(target, instant)));
      return;
    }
    if (toOpen) {
      progress.set(withTiming(1, validation.askOpen));
      labelProgress.set(
        withDelay(validation.askLabelIn.delay, withTiming(1, validation.askLabelIn)),
      );
    } else {
      labelProgress.set(withTiming(0, validation.labelOut));
      progress.set(withTiming(0, validation.askClose));
    }
  };
  const close = () => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    if (!askingNow.current) return;
    askingNow.current = false;
    setAsking(false);
    move(false);
  };
  const open = () => {
    askingNow.current = true;
    setAsking(true);
    move(true);
    AccessibilityInfo.announceForAccessibility(name);
    timer.current = setTimeout(close, validation.askHold);
  };

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );
  // What the outfit lacks changed: the question no longer holds.
  const missingKey = missing.join();
  useEffect(() => {
    close();
    // Runs when what is missing changes only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missingKey, empty]);

  return {
    asking,
    isOpen: () => askingNow.current,
    open,
    close,
    progress,
    labelProgress,
    opacity,
    pieces,
    name,
    missingText,
    actionText,
    width,
    textWidth,
    oneLine,
    measure,
  };
}

/** The confirmation's label, inside the pill, on one line or two. */
export function AskLabel({ ask, textStyle }: { ask: ConfirmAsk; textStyle: TextStyle }) {
  const { colors } = useTheme();
  const { labelProgress } = ask;
  const look = useAnimatedStyle(() => ({ opacity: labelProgress.get() }));
  const text = [textStyle, { color: colors.onAction }];
  return (
    <Animated.View
      style={[styles.label, { width: ask.textWidth }, look]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {ask.oneLine ? (
        <Text numberOfLines={1} style={text}>
          {ask.name}
        </Text>
      ) : (
        <>
          <Text numberOfLines={1} style={text}>
            {ask.missingText}
          </Text>
          <Text numberOfLines={1} style={text}>
            {ask.actionText}
          </Text>
        </>
      )}
    </Animated.View>
  );
}

/**
 * Measures the confirmation's label, which is drawn at the measured width.
 * Kept out of the button, so that nothing it is drawn in limits it.
 */
export function AskMeasure({ ask, textStyle }: { ask: ConfirmAsk; textStyle: TextStyle }) {
  const lines = [
    ['line', ask.name],
    ['missing', ask.missingText],
    ['action', ask.actionText],
  ] as const;
  return (
    <View
      style={styles.measure}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {lines.map(([key, text]) => (
        <Text
          key={key}
          numberOfLines={1}
          style={textStyle}
          onLayout={(event) => ask.measure(key, event.nativeEvent.layout.width)}
        >
          {text}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    position: 'absolute',
    top: 0,
    left: PILL_LABEL_LEFT,
    height: size.sizeCta,
    justifyContent: 'center',
  },
  measure: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: MEASURE_ROOM,
    alignItems: 'flex-start',
    opacity: 0,
  },
});
