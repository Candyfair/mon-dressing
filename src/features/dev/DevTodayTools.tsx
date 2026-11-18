import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Appearance, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { useTheme } from '../../ui/theme';
import { fontFamilies, radius, size, spacing } from '../../ui/tokens';

/**
 * Temporary test tools on Today (development builds only, not designed):
 * add garments and switch between the light and dark themes.
 */
export function DevTodayTools() {
  const { t } = useTranslation();
  const scheme = useColorScheme();
  return (
    <View style={styles.row}>
      <Tool label={t('dev.today.add')} onPress={() => router.push('/add')} />
      <Tool
        label={t('dev.today.theme')}
        onPress={() => Appearance.setColorScheme(scheme === 'dark' ? 'light' : 'dark')}
      />
    </View>
  );
}

function Tool({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.tool, { borderColor: colors.optionEdge }]}
    >
      <Text style={[styles.label, { color: colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.space6 },
  tool: {
    height: size.sizeOptionSmall,
    paddingHorizontal: spacing.space10,
    borderWidth: 1,
    borderRadius: radius.radiusFull,
    justifyContent: 'center',
  },
  label: { fontFamily: fontFamilies.text, fontSize: 12, fontWeight: '600' },
});
