import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import {
  Platform,
  type StyleProp,
  StyleSheet,
  useColorScheme,
  View,
  type ViewStyle,
} from 'react-native';

import { withAlpha } from './color';
import { useGlass } from './glassContext';
import { themeNameFor, useTheme } from './theme';
import { blur } from './tokens';

type GlassKind = 'control' | 'surface';

// Design blur radius (CSS px) per kind: round buttons and chip, or the menu.
const BLUR_RADIUS: Record<GlassKind, number> = {
  control: blur.blurGlass,
  surface: blur.blurSurface,
};
// expo-blur takes an intensity from 1 to 100, not a radius. Starting ratio,
// tuned on device in S6.
const INTENSITY_PER_PX = 3;
// Tint fallback (no blur): "the same tint, more opaque". The handoff has no
// value for it: starting opacity, to review at the level-2 checkpoint.
const FALLBACK_ALPHA = { matin: 0.9, soir: 0.22 } as const;

interface GlassProps {
  kind?: GlassKind;
  // Tint over the blur; defaults to the `glass` role.
  tint?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

/**
 * Frosted glass surface (design-system "Verre dépoli"): blurs what is behind
 * it under a translucent tint, or falls back to the tint alone, more opaque.
 * On Android the blur needs the screen's GlassStage; without one, the tint
 * fallback is used. Give it its shape (size, radius) through `style`.
 */
export function Glass({ kind = 'control', tint, style, children }: GlassProps) {
  const { colors } = useTheme();
  const themeName = themeNameFor(useColorScheme());
  const { mode, target } = useGlass();
  const fill = tint ?? colors.glass;
  const canBlur = mode === 'blur' && (Platform.OS !== 'android' || target !== null);

  return (
    <View style={[styles.clip, style]}>
      {canBlur ? (
        <>
          <BlurView
            style={StyleSheet.absoluteFill}
            intensity={Math.min(100, BLUR_RADIUS[kind] * INTENSITY_PER_PX)}
            blurMethod="dimezisBlurViewSdk31Plus"
            blurTarget={target ?? undefined}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: fill }]} />
        </>
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: withAlpha(fill, FALLBACK_ALPHA[themeName]) },
          ]}
        />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
});
