import { Pressable, StyleSheet, Text } from 'react-native';

import { Icon } from './Icon';
import { useTheme } from './theme';
import { fontFamilies, radius, size, spacing } from './tokens';

interface UsageOptionProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
}

/**
 * Usage choice in "Plus de détails" (Option README, .md-option-small): a
 * toggle button, with a check mark in front of the label when chosen.
 */
export function UsageOption({ label, selected, onToggle }: UsageOptionProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onToggle}
      style={[
        styles.option,
        selected
          ? { borderColor: colors.select, backgroundColor: colors.optionOn }
          : { borderColor: colors.optionEdge },
      ]}
    >
      {selected ? <Icon name="check" size={14} color={colors.ink} /> : null}
      <Text style={[styles.label, { color: colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    minHeight: size.sizeOptionSmall,
    paddingHorizontal: spacing.space10,
    borderWidth: 1,
    borderRadius: radius.radiusFull,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: { fontFamily: fontFamilies.text, fontWeight: '600', fontSize: 13 },
});
