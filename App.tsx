import { StatusBar } from 'expo-status-bar';

import { CutoutHarnessScreen } from './src/features/cutout-harness/CutoutHarnessScreen';

export default function App() {
  return (
    <>
      <CutoutHarnessScreen />
      <StatusBar style="auto" />
    </>
  );
}
