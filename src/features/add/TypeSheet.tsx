import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SUBTYPES, type SubtypeKey } from '../../domain/catalogue/subtypes';
import { USAGE_GROUPS } from '../../domain/catalogue/usageGroups';
import type { Usage } from '../../domain/types';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { Sheet } from '../../ui/Sheet';
import { useTheme } from '../../ui/theme';
import { ToggleOption } from '../../ui/ToggleOption';
import { fontFamilies, spacing } from '../../ui/tokens';
import { TypeTile } from '../../ui/TypeTile';
import { UsageOption } from '../../ui/UsageOption';
import type { GarmentChoice } from './useBurstSession';

const TILES_PER_ROW = 4;

function rowsOf<T>(items: readonly T[]): T[][] {
  const rows: T[][] = [];
  for (let start = 0; start < items.length; start += TILES_PER_ROW) {
    rows.push(items.slice(start, start + TILES_PER_ROW));
  }
  return rows;
}

interface TypeSheetProps {
  recentSubtypes: readonly SubtypeKey[];
  onSave: (choice: GarmentChoice) => void;
}

/**
 * "Quel type de pièce ?" (AG2, AG4, AG5). Only the type is required; the
 * toggles and usages are optional and nothing is inferred from the type.
 */
export function TypeSheet({ recentSubtypes, onSave }: TypeSheetProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [subtype, setSubtype] = useState<SubtypeKey | null>(null);
  const [isChoosingType, setIsChoosingType] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [statementPiece, setStatementPiece] = useState(false);
  const [needsIroning, setNeedsIroning] = useState(false);
  const [usages, setUsages] = useState<ReadonlySet<Usage>>(new Set());
  const [areDetailsOpen, setAreDetailsOpen] = useState(false);

  const otherSubtypes = SUBTYPES.map((s) => s.key).filter((key) => !recentSubtypes.includes(key));

  const choose = (key: SubtypeKey) => {
    setSubtype(key);
    setIsChoosingType(false);
  };

  const toggleUsage = (usage: Usage) =>
    setUsages((current) => {
      const next = new Set(current);
      if (!next.delete(usage)) {
        next.add(usage);
      }
      return next;
    });

  const save = () => {
    if (subtype) {
      onSave({ subtype, isFavorite, statementPiece, needsIroning, usages: [...usages] });
    }
  };

  const sectionLabel = [styles.sectionLabel, { color: colors.inkSecondary }];
  const tileGrid = (keys: readonly SubtypeKey[]) =>
    rowsOf(keys).map((row) => (
      <View key={row.join()} style={styles.tileRow}>
        {row.map((key) => (
          <TypeTile
            key={key}
            label={t(`subtypes.${key}`)}
            selected={key === subtype}
            onPress={() => choose(key)}
          />
        ))}
        {/* Keeps the last row's tiles at a quarter of the width. */}
        {Array.from({ length: TILES_PER_ROW - row.length }, (_, i) => (
          <View key={`gap-${i}`} style={styles.tileGap} />
        ))}
      </View>
    ));

  return (
    <Sheet accessibilityLabel={t('add.typeQuestion')}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {isChoosingType || !subtype ? (
          <>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>
              {t('add.typeQuestion')}
            </Text>
            {recentSubtypes.length > 0 ? (
              <>
                <Text style={sectionLabel}>{t('add.recent')}</Text>
                {tileGrid(recentSubtypes)}
              </>
            ) : null}
            <Text style={sectionLabel}>{t('add.allTypes')}</Text>
            {tileGrid(otherSubtypes)}
          </>
        ) : (
          <View style={styles.chosen}>
            <Text
              accessibilityRole="header"
              style={[styles.title, styles.chosenTitle, { color: colors.ink }]}
            >
              {t(`subtypes.${subtype}`)}
            </Text>
            <Button
              variant="link"
              label={t('add.changeType')}
              onPress={() => setIsChoosingType(true)}
            />
          </View>
        )}

        <View style={styles.toggles}>
          <ToggleOption
            label={t('add.favorite')}
            icon="favorite"
            checked={isFavorite}
            onToggle={() => setIsFavorite((value) => !value)}
          />
          <ToggleOption
            label={t('add.statementPiece')}
            icon="statementPiece"
            checked={statementPiece}
            onToggle={() => setStatementPiece((value) => !value)}
          />
          <ToggleOption
            label={t('add.needsIroning')}
            icon="ironing"
            checked={needsIroning}
            onToggle={() => setNeedsIroning((value) => !value)}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: areDetailsOpen }}
          onPress={() => setAreDetailsOpen((open) => !open)}
          style={[styles.disclosure, { borderTopColor: colors.divider }]}
        >
          <Text style={[styles.disclosureText, { color: colors.ink }]}>
            {t('add.moreDetails')}{' '}
            <Text style={[styles.optional, { color: colors.inkSecondary }]}>
              {t('add.optional')}
            </Text>
          </Text>
          <View style={areDetailsOpen ? styles.chevronOpen : undefined}>
            <Icon name="chevronDown" size={18} color={colors.ink} />
          </View>
        </Pressable>

        {areDetailsOpen ? (
          <View>
            <Text style={[styles.help, { color: colors.inkSecondary }]}>{t('add.usageHelp')}</Text>
            {USAGE_GROUPS.map(({ group, usages: groupUsages }) => (
              <View key={group} style={styles.group}>
                <Text accessibilityRole="header" style={[sectionLabel, styles.groupTitle]}>
                  {t(`usages.groups.${group}`)}
                </Text>
                <View style={styles.usages}>
                  {groupUsages.map((usage) => (
                    <UsageOption
                      key={usage}
                      label={t(`usages.${usage}`)}
                      selected={usages.has(usage)}
                      onToggle={() => toggleUsage(usage)}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
      <View style={styles.footer}>
        <Button label={t('add.save')} onPress={save} disabled={!subtype} fullWidth />
      </View>
    </Sheet>
  );
}

// Spacing and text sizes from the AG2 / AG4 mockups.
const styles = StyleSheet.create({
  scroll: { flexShrink: 1 },
  content: { paddingBottom: spacing.space8 },
  title: {
    marginTop: spacing.space16,
    fontFamily: fontFamilies.display,
    fontWeight: '600',
    fontSize: 24,
    letterSpacing: -0.48,
  },
  chosen: {
    marginTop: spacing.space14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.space10,
  },
  chosenTitle: { flex: 1, marginTop: 0 },
  sectionLabel: {
    marginTop: 12,
    marginBottom: spacing.space8,
    fontFamily: fontFamilies.text,
    fontWeight: '600',
    fontSize: 12.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tileRow: { flexDirection: 'row', gap: spacing.space8, marginBottom: spacing.space8 },
  tileGap: { flex: 1 },
  toggles: {
    marginTop: spacing.space10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.space6,
  },
  disclosure: {
    marginTop: spacing.space10,
    minHeight: 44,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.space8,
  },
  disclosureText: {
    flexShrink: 1,
    fontFamily: fontFamilies.text,
    fontWeight: '600',
    fontSize: 14.5,
  },
  optional: { fontWeight: '400' },
  chevronOpen: { transform: [{ rotate: '180deg' }] },
  help: { fontFamily: fontFamilies.text, fontSize: 13, lineHeight: 18 },
  group: { marginTop: 12 },
  groupTitle: { marginTop: 0, marginBottom: 7 },
  usages: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space6 },
  footer: { paddingTop: spacing.space10 },
});
