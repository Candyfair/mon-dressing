import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { motion as initialMotion } from '../../ui/motion';
import {
  type MotionField,
  motionFields,
  nudgeMotionValue,
  resetMotion,
  useMotion,
} from '../../ui/motionStore';
import { useTheme } from '../../ui/theme';
import { fontFamilies, radius, size, spacing } from '../../ui/tokens';
import { frameMeterStore } from './frameMeterStore';

const GROUPS = ['carousel', 'tabs', 'radial'] as const;
type Group = (typeof GROUPS)[number];

const INITIAL_VALUES = new Map(
  motionFields(initialMotion).map((field) => [field.id, field.value] as const),
);

/** Steppers for every animation value, and the frame meter's switch. */
export function DevMotionPanel() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const motion = useMotion();
  const meterShown = frameMeterStore.use();
  const [openGroup, setOpenGroup] = useState<Group | null>(null);
  const fields = motionFields(motion);
  const changed = fields.filter((field) => field.value !== INITIAL_VALUES.get(field.id)).length;

  return (
    <View style={styles.root}>
      <View style={styles.actions}>
        <PanelButton
          label={t('dev.gestures.motion.meter')}
          selected={meterShown}
          role="switch"
          onPress={() => frameMeterStore.set(!meterShown)}
        />
        <PanelButton label={t('dev.gestures.motion.reset')} onPress={resetMotion} />
      </View>
      <Text style={[styles.caption, { color: colors.inkSecondary }]}>
        {t('dev.gestures.motion.changed', { count: changed })}
      </Text>
      {GROUPS.map((group) => (
        <View key={group} style={styles.group}>
          <PanelButton
            label={t(`dev.gestures.motion.${group}`)}
            selected={openGroup === group}
            onPress={() => setOpenGroup((open) => (open === group ? null : group))}
          />
          {openGroup === group
            ? fields
                .filter((field) => field.path[0] === group)
                .map((field) => <MotionRow key={field.id} field={field} />)
            : null}
        </View>
      ))}
    </View>
  );
}

function MotionRow({ field }: { field: MotionField }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const name = field.path.slice(1).join(' · ');
  const initial = INITIAL_VALUES.get(field.id);
  const stepper = (direction: 1 | -1) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t(
        direction === 1 ? 'dev.gestures.motion.moreLabel' : 'dev.gestures.motion.lessLabel',
        { name },
      )}
      onPress={() => nudgeMotionValue(field.id, direction)}
      style={[styles.stepper, { borderColor: colors.divider }]}
    >
      <Text style={[styles.value, { color: colors.ink }]}>
        {t(direction === 1 ? 'dev.gestures.motion.more' : 'dev.gestures.motion.less')}
      </Text>
    </Pressable>
  );
  return (
    <View style={styles.row}>
      <View style={styles.rowName}>
        <Text style={[styles.caption, { color: colors.ink }]}>{name}</Text>
        {field.value !== initial ? (
          <Text style={[styles.caption, { color: colors.inkSecondary }]}>
            {t('dev.gestures.motion.initial', { value: initial })}
          </Text>
        ) : null}
      </View>
      {stepper(-1)}
      <Text style={[styles.value, styles.number, { color: colors.ink }]}>{field.value}</Text>
      {stepper(1)}
    </View>
  );
}

interface PanelButtonProps {
  label: string;
  selected?: boolean;
  role?: 'button' | 'switch';
  onPress: () => void;
}

function PanelButton({ label, selected = false, role = 'button', onPress }: PanelButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityState={role === 'switch' ? { checked: selected } : { expanded: selected }}
      onPress={onPress}
      style={[
        styles.button,
        { borderColor: colors.divider },
        selected && { backgroundColor: colors.ink },
      ]}
    >
      <Text style={[styles.caption, { color: selected ? colors.ground : colors.ink }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.space10, paddingHorizontal: spacing.space16 },
  actions: { flexDirection: 'row', gap: spacing.space10 },
  group: { gap: spacing.space6 },
  button: {
    minHeight: size.sizeTap,
    paddingHorizontal: spacing.space16,
    borderWidth: 1,
    borderRadius: radius.radiusTabbar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.space6 },
  rowName: { flex: 1 },
  stepper: {
    width: size.sizeTap,
    height: size.sizeTap,
    borderWidth: 1,
    borderRadius: size.sizeTap / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: { width: 52, textAlign: 'center' },
  value: { fontFamily: fontFamilies.text, fontSize: 15, fontWeight: '600' },
  caption: { fontFamily: fontFamilies.text, fontSize: 13 },
});
