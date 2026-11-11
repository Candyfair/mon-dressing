import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { DatabaseProvider } from '../db/DatabaseProvider';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <DatabaseProvider>
        <Stack screenOptions={{ headerShown: false }} />
        <StatusBar style="auto" />
      </DatabaseProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
