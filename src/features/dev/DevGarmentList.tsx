import { desc, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { db } from '../../db/client';
import { activeWardrobeId } from '../../db/repositories/settings';
import { garments } from '../../db/schema';
import { Button } from '../../ui/Button';
import { useTheme } from '../../ui/theme';
import { fontFamilies, spacing } from '../../ui/tokens';
import { photoUri } from '../add/photos/photoStore';

const THUMBNAIL = 56;

/**
 * Provisional home (development only): the garments of the active wardrobe,
 * newest first, to check the burst add flow. Not designed; replaced in S7–S8.
 */
export function DevGarmentList() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Built once: a new query object on every render would restart the live query.
  const query = useMemo(
    () =>
      db
        .select({
          id: garments.id,
          subtype: garments.subtype,
          cutoutStatus: garments.cutoutStatus,
          photoOriginalPath: garments.photoOriginalPath,
          photoCutoutPath: garments.photoCutoutPath,
        })
        .from(garments)
        .where(eq(garments.wardrobeId, activeWardrobeId(db)))
        .orderBy(desc(garments.createdAt)),
    [],
  );
  const { data } = useLiveQuery(query);

  return (
    <View style={[styles.screen, { backgroundColor: colors.ground, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>
          {t('dev.title', { count: data.length })}
        </Text>
        <Button
          label={t('dev.openEngine')}
          variant="outline"
          onPress={() => router.push('/dev/engine')}
        />
        <Button
          label={t('dev.openGestures')}
          variant="outline"
          onPress={() => router.push('/dev/gestures')}
        />
        <Button label={t('dev.add')} onPress={() => router.push('/add')} />
      </View>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.space16 }}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.inkSecondary }]}>{t('dev.empty')}</Text>
        }
        renderItem={({ item }) => (
          <View style={[styles.row, { borderBottomColor: colors.divider }]}>
            <Image
              source={{ uri: photoUri(item.photoCutoutPath ?? item.photoOriginalPath) }}
              style={styles.thumbnail}
              contentFit="contain"
              accessible={false}
            />
            <View style={styles.text}>
              <Text style={[styles.subtype, { color: colors.ink }]}>
                {t(`subtypes.${item.subtype}`)}
              </Text>
              <Text style={[styles.status, { color: colors.inkSecondary }]}>
                {t(`dev.cutout.${item.cutoutStatus}`)}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: spacing.space16,
    paddingVertical: spacing.space16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.space10,
  },
  title: { flex: 1, fontFamily: fontFamilies.display, fontWeight: '600', fontSize: 24 },
  empty: { paddingHorizontal: spacing.space16, fontFamily: fontFamilies.text, fontSize: 14.5 },
  row: {
    marginHorizontal: spacing.space16,
    paddingVertical: spacing.space10,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.space14,
  },
  thumbnail: { width: THUMBNAIL, height: THUMBNAIL },
  text: { flex: 1, gap: spacing.space2 },
  subtype: { fontFamily: fontFamilies.text, fontWeight: '600', fontSize: 15 },
  status: { fontFamily: fontFamilies.text, fontSize: 13 },
});
