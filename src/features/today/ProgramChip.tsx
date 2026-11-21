import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { CommuteMode, DayContext } from '../../domain/types';
import { Glass } from '../../ui/Glass';
import { Icon, type IconName } from '../../ui/Icon';
import { useTheme } from '../../ui/theme';
import { size, typography } from '../../ui/tokens';
import { HEADER_TOP_MAX_MULTIPLIER } from './headerFit';

const ICON = 20;
const PADDING = 12;
const BORDER = 1;
const GAP = 7;
const DIVIDER = 1;

// One icon per commute mode (Candice, 2026-11-21).
const COMMUTE_ICONS: Record<CommuteMode, IconName> = {
  walking: 'walking',
  bike: 'bike',
  scooter: 'scooter',
  publicTransport: 'publicTransport',
  car: 'car',
  motorbike: 'motorbike',
};

// The chip shows the first mode of the day; all of them are read out.
function commuteMode(context: DayContext): CommuteMode | undefined {
  return context.commuteModes[0];
}

/** Width of the chip without its label. */
export function programChipFixedWidth(context: DayContext): number {
  const frame = 2 * (PADDING + BORDER);
  return commuteMode(context) === undefined ? frame : frame + 2 * GAP + DIVIDER + ICON;
}

interface ProgramChipProps {
  context: DayContext;
  label: string;
  labelScale: number;
  onPress: () => void;
}

/**
 * The day's program: activity in text, transport as an icon (design-system
 * ProgramChip). One button for screen readers, « Programme du jour : bureau,
 * à pied et à vélo ».
 */
export function ProgramChip({ context, label, labelScale, onPress }: ProgramChipProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const mode = commuteMode(context);
  const activity = label.toLocaleLowerCase(i18n.language);
  const commutes = context.commuteModes.map((each) => t(`today.commute.${each}`));
  const name =
    commutes.length === 0
      ? t('today.program.name', { activity })
      : t('today.program.nameWithCommute', {
          activity,
          commute: joinList(commutes, t('today.program.and')),
        });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      accessibilityHint={t('today.program.hint')}
      onPress={onPress}
    >
      <Glass style={[styles.chip, { borderColor: colors.glassEdge }]}>
        <Text
          testID="header-program"
          maxFontSizeMultiplier={HEADER_TOP_MAX_MULTIPLIER}
          style={[
            typography.chip,
            {
              color: colors.controlInk,
              fontSize: typography.chip.fontSize * labelScale,
              lineHeight: typography.chip.lineHeight * labelScale,
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {mode !== undefined ? (
          <>
            <View style={[styles.divider, { backgroundColor: colors.chipDivider }]} />
            <Icon name={COMMUTE_ICONS[mode]} size={ICON} color={colors.controlInk} />
          </>
        ) : null}
      </Glass>
    </Pressable>
  );
}

// « à pied », « à pied et à vélo », « à pied, à vélo et en voiture ».
function joinList(items: readonly string[], and: string): string {
  if (items.length < 2) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`;
}

const styles = StyleSheet.create({
  chip: {
    height: size.sizeChip,
    paddingHorizontal: PADDING,
    borderRadius: size.sizeChip / 2,
    borderWidth: BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    gap: GAP,
  },
  divider: { width: DIVIDER, height: 14 },
});
