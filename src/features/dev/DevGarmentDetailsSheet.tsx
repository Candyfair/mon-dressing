import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { db } from '../../db/client';
import { getGarmentDetails, setGarmentDetails } from '../../db/repositories/garments';
import type { Usage } from '../../domain/types';
import { Button } from '../../ui/Button';
import { Sheet } from '../../ui/Sheet';
import { useTheme } from '../../ui/theme';
import { ToggleOption } from '../../ui/ToggleOption';
import { fontFamilies, spacing } from '../../ui/tokens';
import { UsagePicker } from '../add/UsagePicker';

interface DevGarmentDetailsSheetProps {
  garmentId: string;
  title: string;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Development only (S4): favourite, statement piece and usages of a real
 * garment, to give the engine something to filter before the garment sheet
 * (S8). Reuses the add-flow options; not designed.
 */
export function DevGarmentDetailsSheet({
  garmentId,
  title,
  onClose,
  onSaved,
}: DevGarmentDetailsSheetProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [initial] = useState(() => getGarmentDetails(db, garmentId));
  const [isFavorite, setIsFavorite] = useState(initial.isFavorite);
  const [statementPiece, setStatementPiece] = useState(initial.statementPiece);
  const [usages, setUsages] = useState<ReadonlySet<Usage>>(() => new Set(initial.usages));

  const save = () => {
    setGarmentDetails(
      db,
      garmentId,
      { isFavorite, statementPiece, usages: [...usages] },
      { now: new Date() },
    );
    onSaved();
  };

  return (
    <Sheet accessibilityLabel={title} onClose={onClose}>
      <ScrollView style={styles.scroll}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>
          {title}
        </Text>
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
        </View>
        <UsagePicker
          usages={usages}
          onChange={setUsages}
          titleStyle={[styles.groupTitle, { color: colors.ink }]}
        />
      </ScrollView>
      <View style={styles.footer}>
        <Button label={t('add.save')} onPress={save} fullWidth />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  scroll: { flexShrink: 1 },
  title: { marginTop: spacing.space16, fontFamily: fontFamilies.display, fontSize: 22 },
  toggles: {
    marginTop: spacing.space10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.space6,
  },
  groupTitle: { fontFamily: fontFamilies.text, fontWeight: '600', fontSize: 13 },
  footer: { paddingVertical: spacing.space10 },
});
