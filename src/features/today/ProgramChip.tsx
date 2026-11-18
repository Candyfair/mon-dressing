import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { CommuteMode, DayContext } from '../../domain/types';
import { Glass } from '../../ui/Glass';
import { Icon, type IconName } from '../../ui/Icon';
import { useTheme } from '../../ui/theme';
import { size, typography } from '../../ui/tokens';

const ICON = 20;

// Transport icons drawn in the mockups; the other modes have none yet and
// show the activity alone (level-2 note).
const COMMUTE_ICONS: Partial<Record<CommuteMode, IconName>> = {
  bike: 'bike',
  walking: 'walking',
};

interface ProgramChipProps {
  context: DayContext;
  onPress: () => void;
}

/** The day's program: activity in text, transport as an icon (design-system ProgramChip). */
export function ProgramChip({ context, onPress }: ProgramChipProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const mode = context.commuteModes.find((candidate) => COMMUTE_ICONS[candidate] !== undefined);
  const icon = mode === undefined ? undefined : COMMUTE_ICONS[mode];
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Glass style={[styles.chip, { borderColor: colors.glassEdge }]}>
        <Text style={[typography.chip, { color: colors.controlInk }]} numberOfLines={1}>
          {t(`usages.activity.${context.activity}`)}
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
    paddingHorizontal: 12,
    borderRadius: size.sizeChip / 2,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  divider: { width: 1, height: 14 },
});
