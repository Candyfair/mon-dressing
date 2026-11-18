import { StyleSheet, View } from 'react-native';

import { useTheme } from './theme';
import { radius } from './tokens';

const DOT = 6;
const ACTIVE_DOT = 16;
const GAP = 5;

interface DotsProps {
  count: number;
  // Position in the cycle: back to the first dot after the last one.
  index: number;
  accessibilityLabel: string;
}

/** Position dots of a looping carousel (design-system Dots, `md-dots`). */
export function Dots({ count, index, accessibilityLabel }: DotsProps) {
  const { colors } = useTheme();
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={styles.dots}
    >
      {Array.from({ length: count }, (_, dot) => (
        <View
          key={dot}
          style={[
            styles.dot,
            dot === index
              ? { width: ACTIVE_DOT, backgroundColor: colors.indicator }
              : { backgroundColor: colors.indicatorOff },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', alignItems: 'center', gap: GAP },
  dot: { width: DOT, height: DOT, borderRadius: radius.radiusFull },
});
