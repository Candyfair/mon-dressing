import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from './theme';
import { fontFamilies, radius, size } from './tokens';

interface TypeTileProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/**
 * Garment type choice (Option README, .md-type-tile). Text only, as in
 * DATA_MODEL.md §5: the mockups draw icons for a few types only.
 */
export function TypeTile({ label, selected, onPress }: TypeTileProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.tile,
        selected
          ? { borderWidth: 1.5, borderColor: colors.select, backgroundColor: colors.select }
          : { borderColor: colors.tileEdge, backgroundColor: colors.tileFill },
      ]}
    >
      <Text style={[styles.label, { color: selected ? colors.onSelect : colors.ink }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Four per row: the parent grid sets the width.
  tile: {
    flex: 1,
    minHeight: size.typeTileHeight,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderRadius: radius.radiusTypeTile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fontFamilies.text,
    fontWeight: '600',
    fontSize: 12.5,
    textAlign: 'center',
  },
});
