import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { useTheme } from '../../ui/theme';
import { fontFamilies, spacing } from '../../ui/tokens';
import { frameMeterStore } from './frameMeterStore';

const REPORT_EVERY = 1000;
// A sheet may hide the meter: the last seconds stay readable once it closes.
const KEPT_REPORTS = 10;

interface FrameReport {
  fps: number;
  worst: number;
}

/** Frame rate of the UI thread, above every screen, when switched on. */
export function DevFrameMeter() {
  return frameMeterStore.use() ? <FrameMeter /> : null;
}

function FrameMeter() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState<readonly FrameReport[]>([]);
  const frames = useSharedValue(0);
  const elapsed = useSharedValue(0);
  const worst = useSharedValue(0);

  const report = useCallback((fps: number, slowest: number) => {
    setReports((previous) => [...previous, { fps, worst: slowest }].slice(-KEPT_REPORTS));
  }, []);

  useFrameCallback(({ timeSincePreviousFrame: frame }) => {
    if (frame === null) return;
    frames.set(frames.get() + 1);
    elapsed.set(elapsed.get() + frame);
    worst.set(Math.max(worst.get(), frame));
    if (elapsed.get() < REPORT_EVERY) return;
    scheduleOnRN(report, (frames.get() * 1000) / elapsed.get(), worst.get());
    frames.set(0);
    elapsed.set(0);
    worst.set(0);
  });

  const last = reports.at(-1);
  if (!last) return null;
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.meter, { top: insets.top + spacing.space6, backgroundColor: colors.ink }]}
    >
      <Text style={[styles.text, { color: colors.ground }]}>
        {t('dev.gestures.frameMeter', {
          fps: Math.round(last.fps),
          low: Math.round(Math.min(...reports.map((item) => item.fps))),
          worst: Math.round(Math.max(...reports.map((item) => item.worst))),
        })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  meter: {
    position: 'absolute',
    right: spacing.space8,
    paddingHorizontal: spacing.space8,
    paddingVertical: spacing.space6,
    borderRadius: spacing.space8,
  },
  text: { fontFamily: fontFamilies.text, fontSize: 12, fontVariant: ['tabular-nums'] },
});
