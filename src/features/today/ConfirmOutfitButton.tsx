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
  // The outfit is validated: the button now undoes the validation.
  frozen: boolean;
  onPress: () => void;
}

/**
 * « Je porte cette tenue », Today's main action. Disabled, it stays in place
 * and findable by screen readers, with the reason in its name. Once the
 * outfit is validated, it turns to an outline and a tap undoes the validation
 * (provisional look: the validated state is not designed yet).
 */
export function ConfirmOutfitButton({ missing, frozen, onPress }: ConfirmOutfitButtonProps) {
  const { t } = useTranslation();
  const { colors, shadows } = useTheme();
  const enabled = frozen || missing === null;
  const label = frozen
    ? t('today.confirmed')
    : missing === null
      ? t('today.confirm')
      : t(`today.confirmMissing.${missing}`);
  const look = frozen
    ? { borderWidth: STROKE, borderColor: colors.action }
    : enabled
      ? { backgroundColor: colors.action, boxShadow: shadows.shadowCta }
      : { backgroundColor: colors.actionDisabled };
  const iconColor = frozen ? colors.action : enabled ? colors.onAction : colors.onActionDisabled;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !enabled, selected: frozen }}
      onPress={enabled ? onPress : undefined}
      style={[styles.button, look]}
    >
      <Icon name="check" size={ICON} color={iconColor} strokeWidth={STROKE} />
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
