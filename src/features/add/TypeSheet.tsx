import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { SubtypeKey } from '../../domain/catalogue/subtypes';
import type { Usage } from '../../domain/types';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { Sheet } from '../../ui/Sheet';
import { useTheme } from '../../ui/theme';
import { ToggleOption } from '../../ui/ToggleOption';
import { fontFamilies, spacing } from '../../ui/tokens';
import { TypeTile } from '../../ui/TypeTile';
import { type AddCategory, typeSections } from './typeSections';
import type { GarmentChoice } from './useBurstSession';
import { UsagePicker } from './UsagePicker';

const TILES_PER_ROW = 4;

function rowsOf<T>(items: readonly T[]): T[][] {
  const rows: T[][] = [];
  for (let start = 0; start < items.length; start += TILES_PER_ROW) {
    rows.push(items.slice(start, start + TILES_PER_ROW));
  }
  return rows;
}

interface TypeSheetProps {
  // Asked for by a missing silhouette on Today: its types come first.
  category: AddCategory | null;
  recentSubtypes: readonly SubtypeKey[];
  /** A rotation is in progress: saving waits for it. */
  isBusy: boolean;
  onSave: (choice: GarmentChoice) => void;
}

/**
 * "Quel type de pièce ?" (AG2, AG4, AG5). Only the type is required; the
 * toggles and usages are optional and nothing is inferred from the type.
 */
export function TypeSheet({ category, recentSubtypes, isBusy, onSave }: TypeSheetProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [subtype, setSubtype] = useState<SubtypeKey | null>(null);
  const [isChoosingType, setIsChoosingType] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [statementPiece, setStatementPiece] = useState(false);
  const [needsIroning, setNeedsIroning] = useState(false);
  const [usages, setUsages] = useState<ReadonlySet<Usage>>(new Set());
  const [areDetailsOpen, setAreDetailsOpen] = useState(false);

  const sections = typeSections(category, recentSubtypes);

  const choose = (key: SubtypeKey) => {
    setSubtype(key);
    setIsChoosingType(false);
  };

  const save = () => {
    if (subtype && !isBusy) {
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
            {category !== null ? (
              <>
                <Text style={sectionLabel}>{t(`add.category.${category}`)}</Text>
                {tileGrid(sections.category)}
              </>
            ) : null}
            {sections.recent.length > 0 ? (
              <>
                <Text style={sectionLabel}>{t('add.recent')}</Text>
                {tileGrid(sections.recent)}
              </>
            ) : null}
            <Text style={sectionLabel}>{t('add.allTypes')}</Text>
            {tileGrid(sections.others)}
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
            <UsagePicker usages={usages} onChange={setUsages} titleStyle={sectionLabel} />
          </View>
        ) : null}
      </ScrollView>
      <View style={styles.footer}>
        <Button label={t('add.save')} onPress={save} disabled={!subtype || isBusy} fullWidth />
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
  footer: { paddingTop: spacing.space10 },
});
