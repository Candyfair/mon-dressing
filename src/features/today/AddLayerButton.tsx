import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';

import { Icon } from '../../ui/Icon';
import { useTheme } from '../../ui/theme';
import { size } from '../../ui/tokens';

const ICON = 20;
const DASH = 1.5;

/** « Ajouter une couche »: a dashed empty slot, not a strong action. */
export function AddLayerButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('today.addLayer')}
      onPress={onPress}
      style={[styles.button, { backgroundColor: colors.addFill, borderColor: colors.addDash }]}
    >
      <Icon name="plus" size={ICON} color={colors.controlInk} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: size.sizeTap,
    height: size.sizeTap,
    borderRadius: size.sizeTap / 2,
    borderWidth: DASH,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
