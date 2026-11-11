import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { DatabaseProvider } from '../db/DatabaseProvider';

export default function RootLayout() {
  return (
    <DatabaseProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </DatabaseProvider>
  );
}
