import { useTranslation } from 'react-i18next';
import { type StyleProp, StyleSheet, Text, type TextStyle, View } from 'react-native';

import {
  clearGroup,
  coversWholeGroup,
  hasAllTag,
  toggleUsage,
  USAGE_GROUPS,
} from '../../domain/catalogue/usageGroups';
import type { Usage } from '../../domain/types';
import { UsageOption } from '../../ui/UsageOption';
import { spacing } from '../../ui/tokens';

interface UsagePickerProps {
  usages: ReadonlySet<Usage>;
  onChange: (usages: ReadonlySet<Usage>) => void;
  titleStyle: StyleProp<TextStyle>;
}

/**
 * The usage tags of a garment, by group. The "all" tags store nothing: they
 * are on when no usage is chosen (everywhere, or in their group), and
 * choosing one clears those usages (SPEC §4.3).
 */
export function UsagePicker({ usages, onChange, titleStyle }: UsagePickerProps) {
  const { t } = useTranslation();
  return (
    <>
      <View style={styles.all}>
        <UsageOption
          label={t('add.allUsages')}
          selected={usages.size === 0}
          onToggle={() => onChange(new Set())}
        />
      </View>
      {USAGE_GROUPS.map(({ group, usages: groupUsages }) => (
        <View key={group} style={styles.group}>
          <Text accessibilityRole="header" style={[titleStyle, styles.title]}>
            {t(`usages.groups.${group}`)}
          </Text>
          <View style={styles.usages}>
            {hasAllTag(group) ? (
              <UsageOption
                label={t(`add.allInGroup.${group}`)}
                selected={coversWholeGroup(usages, group)}
                onToggle={() => onChange(clearGroup(usages, group))}
              />
            ) : null}
            {groupUsages.map((usage) => (
              <UsageOption
                key={usage}
                label={t(`usages.${usage}`)}
                selected={usages.has(usage)}
                onToggle={() => onChange(toggleUsage(usages, usage))}
              />
            ))}
          </View>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  all: { flexDirection: 'row', marginTop: spacing.space10 },
  group: { marginTop: 12 },
  title: { marginTop: 0, marginBottom: 7 },
  usages: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space6 },
});
