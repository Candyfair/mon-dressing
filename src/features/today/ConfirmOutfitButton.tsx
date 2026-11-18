import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';

import { Icon } from '../../ui/Icon';
import { useTheme } from '../../ui/theme';
import { size } from '../../ui/tokens';

const ICON = 26;
const STROKE = 2.2;

interface ConfirmOutfitButtonProps {
  // What the outfit still lacks; null when it can be worn.
  missing: 'top' | 'bottom' | null;
  onPress: () => void;
}

/**
 * « Je porte cette tenue », Today's main action. Disabled, it stays in place
 * and findable by screen readers, with the reason in its name.
 */
export function ConfirmOutfitButton({ missing, onPress }: ConfirmOutfitButtonProps) {
  const { t } = useTranslation();
  const { colors, shadows } = useTheme();
  const enabled = missing === null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={enabled ? t('today.confirm') : t(`today.confirmMissing.${missing}`)}
      accessibilityState={{ disabled: !enabled }}
      onPress={enabled ? onPress : undefined}
      style={[
        styles.button,
        enabled
          ? { backgroundColor: colors.action, boxShadow: shadows.shadowCta }
          : { backgroundColor: colors.actionDisabled },
      ]}
    >
      <Icon
        name="check"
        size={ICON}
        color={enabled ? colors.onAction : colors.onActionDisabled}
        strokeWidth={STROKE}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: size.sizeCta,
    height: size.sizeCta,
    borderRadius: size.sizeCta / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
