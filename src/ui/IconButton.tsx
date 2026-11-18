import { Pressable, StyleSheet } from 'react-native';

import { Glass } from './Glass';
import { Icon, type IconName } from './Icon';
import { useTheme } from './theme';
import { size } from './tokens';

const ICON = 20;

interface IconButtonProps {
  icon: IconName;
  accessibilityLabel: string;
  onPress: () => void;
}

/** Round glass button with an icon only (design-system IconButton). */
export function IconButton({ icon, accessibilityLabel, onPress }: IconButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress}>
      <Glass style={[styles.button, { borderColor: colors.glassEdge }]}>
        <Icon name={icon} size={ICON} color={colors.controlInk} />
      </Glass>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: size.sizeTap,
    height: size.sizeTap,
    borderRadius: size.sizeTap / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
