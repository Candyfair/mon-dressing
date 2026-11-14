import { Pressable, StyleSheet, Text } from 'react-native';

import { Icon, type IconName } from './Icon';
import { useTheme } from './theme';
import { fontFamilies, radius, size, spacing } from './tokens';

interface ToggleOptionProps {
  label: string;
  icon: IconName;
  checked: boolean;
  onToggle: () => void;
}

/**
 * On/off option (Option README, .md-option): Favori, Pièce forte, Se repasse.
 * Same icon in both states; the edge and the fill show the state.
 */
export function ToggleOption({ label, icon, checked, onToggle }: ToggleOptionProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked }}
      onPress={onToggle}
      style={[
        styles.option,
        checked
          ? { borderColor: colors.select, backgroundColor: colors.optionOn }
          : { borderColor: colors.optionEdge },
      ]}
    >
      <Icon name={icon} size={17} color={colors.ink} />
      <Text style={[styles.label, { color: colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    minHeight: size.sizeOption,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: radius.radiusFull,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.space6,
  },
  label: { fontFamily: fontFamilies.text, fontWeight: '600', fontSize: 13.5 },
});
