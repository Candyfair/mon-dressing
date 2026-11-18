import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { DatabaseProvider } from '../db/DatabaseProvider';
import { useResumePendingCutouts } from '../features/add/cutout';
import { queryClient } from '../features/weather/queryClient';
import '../i18n';

// The tabs sit under the modal routes (add) and the development screens.
export const unstable_settings = { anchor: '(tabs)' };

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <DatabaseProvider>
          <AppShell />
        </DatabaseProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

// Rendered once the database is ready.
function AppShell() {
  useResumePendingCutouts();
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="add" options={{ presentation: 'fullScreenModal' }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
