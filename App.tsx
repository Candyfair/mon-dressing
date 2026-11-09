import { StatusBar } from 'expo-status-bar';

import { DatabaseProvider } from './src/db/DatabaseProvider';
import { CutoutHarnessScreen } from './src/features/cutout-harness/CutoutHarnessScreen';

export default function App() {
  return (
    <DatabaseProvider>
      <CutoutHarnessScreen />
      <StatusBar style="auto" />
    </DatabaseProvider>
  );
}
