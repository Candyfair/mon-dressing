import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { motion } from '../../ui/motion';
import { seededRandom } from '../../ui/seededRandom';
import { useTheme } from '../../ui/theme';

// The dots of the burst: directions, speeds and sizes drawn once from a fixed
// seed, so the burst looks the same every time.
const DOTS = (() => {
  const random = seededRandom(11);
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

interface ValidationBurstProps {
  // 0 → 1: the dots fly out and fade; 1 at rest (gone).
  progress: SharedValue<number>;
  // Places the point the dots leave from.
  style: StyleProp<ViewStyle>;
}

/**
 * The dots thrown around « Je porte cette tenue » on validation (design spec
 * 01), in the celebration colours. Decorative.
 */
export function ValidationBurst({ progress, style }: ValidationBurstProps) {
  const { colors } = useTheme();
  const palette = [
    colors.celebration1,
    colors.celebration2,
    colors.celebration3,
    colors.celebration4,
  ];
  return (
    <View style={style} pointerEvents="none">
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
  dot: { position: 'absolute' },
});
