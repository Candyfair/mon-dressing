import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../ui/Button';
import type { TabName } from '../../ui/TabBar';
import { useTheme } from '../../ui/theme';
import { fontFamilies, spacing } from '../../ui/tokens';

/**
 * Provisional tab content (not designed): the tab's name and, in development
 * builds, the way to the development screens. Replaced as each screen is built.
 */
export function PlaceholderTab({ tab }: { tab: Exclude<TabName, 'today'> }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.ground, paddingTop: insets.top + spacing.space40 },
      ]}
    >
      <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>
        {t(`tabs.${tab}`)}
      </Text>
      {__DEV__ ? (
        <Button label={t('dev.open')} variant="outline" onPress={() => router.push('/dev')} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', gap: spacing.space24 },
  title: { fontFamily: fontFamilies.display, fontSize: 22, fontWeight: '600' },
});
