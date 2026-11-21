import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '../../ui/Icon';
import { useTheme } from '../../ui/theme';
import { fontFamilies, size, spacing } from '../../ui/tokens';
import type { OutfitRow } from './outfitChoice';

const ICON = 22;
const ICON_STROKE = 1.9;
const LINK_HEIGHT = 36;
// The link keeps the 44 pt target around its 36 pt line.
const LINK_SLOP = (size.sizeTap - LINK_HEIGHT) / 2;

interface LaundrySlotProps {
  row: OutfitRow;
  width: number;
  onSortLaundry: () => void;
}

/**
 * A row whose garments are all at the laundry (design spec 03, AR4): the
 * « au sale » icon, what it means and the way to the Buanderie, in place of
 * the silhouette.
 */
export function LaundrySlot({ row, width, onSortLaundry }: LaundrySlotProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={[styles.slot, { width }]}>
      <View style={[styles.icon, { backgroundColor: colors.sortLingeBg }]}>
        <Icon
          name="washingMachine"
          size={ICON}
          color={colors.sortLinge}
          strokeWidth={ICON_STROKE}
        />
      </View>
      <Text style={[styles.text, { color: colors.ink }]}>{t(`today.inLaundry.${row}`)}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onSortLaundry}
        hitSlop={{ top: LINK_SLOP, bottom: LINK_SLOP }}
        style={styles.link}
      >
        <Text style={[styles.linkText, { color: colors.inkAccent }]}>{t('today.sortLaundry')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { alignItems: 'center' },
  icon: {
    width: size.sizeTap,
    height: size.sizeTap,
    borderRadius: size.sizeTap / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: spacing.space10,
    fontFamily: fontFamilies.display,
    fontSize: 19,
    fontWeight: '600',
    letterSpacing: -0.19,
    textAlign: 'center',
  },
  link: {
    marginTop: spacing.space2,
    height: LINK_HEIGHT,
    paddingHorizontal: spacing.space2 * 2,
    justifyContent: 'center',
  },
  linkText: {
    fontFamily: fontFamilies.text,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
