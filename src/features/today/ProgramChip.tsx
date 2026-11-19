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

// Transport icons drawn in the mockups; the other modes have none yet and
// show the activity alone (level-2 note).
const COMMUTE_ICONS: Partial<Record<CommuteMode, IconName>> = {
  bike: 'bike',
  walking: 'walking',
};

function commuteMode(context: DayContext): CommuteMode | undefined {
  return context.commuteModes.find((candidate) => COMMUTE_ICONS[candidate] !== undefined);
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

/** The day's program: activity in text, transport as an icon (design-system ProgramChip). */
export function ProgramChip({ context, label, labelScale, onPress }: ProgramChipProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const mode = commuteMode(context);
  const icon = mode === undefined ? undefined : COMMUTE_ICONS[mode];
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
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
        {mode !== undefined && icon !== undefined ? (
          <>
            <View style={[styles.divider, { backgroundColor: colors.chipDivider }]} />
            <View
              accessible
              accessibilityRole="image"
              accessibilityLabel={t(`today.commute.${mode}`)}
            >
              <Icon name={icon} size={ICON} color={colors.controlInk} />
            </View>
          </>
        ) : null}
      </Glass>
    </Pressable>
  );
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
