import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Icon } from '../../ui/Icon';
import { useTheme } from '../../ui/theme';
import type { OutfitRow } from './outfitChoice';

const PLUS = 40;
const PLUS_ICON = 20;
const PLUS_STROKE = 2.2;

// Silhouettes and "+" heights of the 03-aujourdhui-guide mockups (100 × 100).
const SILHOUETTES: Record<OutfitRow, { path: string; plusAt: number }> = {
  top: {
    path: 'M36 12 Q50 20 64 12 L82 18 L94 38 L80 45 L74 36 L74 84 L26 84 L26 36 L20 45 L6 38 L18 18 Z',
    plusAt: 0.5,
  },
  bottom: { path: 'M27 5 L73 5 L77 96 L56 96 L50 34 L44 96 L23 96 Z', plusAt: 0.505 },
  shoes: {
    path: 'M8 62 Q9 50 22 50 L34 55 Q55 60 80 63 Q92 65 92 74 L92 82 L8 82 Z',
    plusAt: 0.64,
  },
};

interface EmptySlotProps {
  row: OutfitRow;
  frame: number;
  onPress: () => void;
}

/** Dashed silhouette of a missing piece, with a "+" to add one (design-system EmptySlot). */
export function EmptySlot({ row, frame, onPress }: EmptySlotProps) {
  const { t } = useTranslation();
  const { colors, shadows } = useTheme();
  const { path, plusAt } = SILHOUETTES[row];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t(`today.addPiece.${row}`)}
      onPress={onPress}
      style={{ width: frame, height: frame }}
    >
      <Svg width={frame} height={frame} viewBox="0 0 100 100">
        <Path
          d={path}
          fill={colors.slotFill}
          stroke={colors.slotEdge}
          strokeWidth={1.2}
          strokeDasharray="3.5 3"
          strokeLinejoin="round"
        />
      </Svg>
      <View
        style={[
          styles.plus,
          {
            left: (frame - PLUS) / 2,
            top: frame * plusAt - PLUS / 2,
            backgroundColor: colors.addAction,
            boxShadow: shadows.shadowAdd,
          },
        ]}
      >
        <Icon name="plus" size={PLUS_ICON} color={colors.cream} strokeWidth={PLUS_STROKE} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  plus: {
    position: 'absolute',
    width: PLUS,
    height: PLUS,
    borderRadius: PLUS / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
