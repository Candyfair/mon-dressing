import { useEffect } from 'react';
import { type StyleProp, StyleSheet, Text, type TextStyle, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { motion } from '../../ui/motion';
import { useTheme } from '../../ui/theme';

const UNDERLINE = 2;
const { refusedUnderline } = motion.validation;
const DRAW = refusedUnderline.duration * refusedUnderline.drawShare;
const FADE = refusedUnderline.duration - DRAW;
const draw = { duration: DRAW, easing: refusedUnderline.easing };
const fade = { duration: FADE, easing: refusedUnderline.easing };

interface StillNeededProps {
  text: string;
  maxWidth: number;
  textStyle: StyleProp<TextStyle>;
  // Changes each time the disabled confirm button is touched: the sentence is
  // underlined once more.
  underline: number;
}

/**
 * « Encore 1 haut, 1 bas… » (design spec 03), announced when it changes. A
 * tap on the disabled confirm button underlines it with an `action` line
 * drawn from left to right, which then fades (design spec 01).
 */
export function StillNeeded({ text, maxWidth, textStyle, underline }: StillNeededProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  // 0 → 1: how much of the line is drawn; its opacity, apart.
  const drawn = useSharedValue(0);
  const shown = useSharedValue(0);

  useEffect(() => {
    if (underline === 0) return;
    const half = { duration: FADE / 2, easing: refusedUnderline.easing };
    if (reducedMotion) {
      // Shown whole, in and out in fades.
      drawn.set(1);
      shown.set(withSequence(withTiming(1, half), withDelay(DRAW, withTiming(0, half))));
      return;
    }
    shown.set(withSequence(withTiming(1, { duration: 0 }), withDelay(DRAW, withTiming(0, fade))));
    drawn.set(withSequence(withTiming(0, { duration: 0 }), withTiming(1, draw)));
    // Plays on a new tap only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [underline]);

  const line = useAnimatedStyle(() => ({
    opacity: shown.get(),
    transform: [{ scaleX: drawn.get() }],
  }));

  return (
    <View style={{ maxWidth }}>
      <Text accessibilityLiveRegion="polite" style={textStyle}>
        {text}
      </Text>
      <Animated.View
        pointerEvents="none"
        style={[styles.line, { backgroundColor: colors.action }, line]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    // Under the last line, without moving the sentence.
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -2 * UNDERLINE,
    height: UNDERLINE,
    borderRadius: UNDERLINE / 2,
    // Drawn from the left edge.
    transformOrigin: 'left',
  },
});
