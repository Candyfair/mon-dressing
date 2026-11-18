import { BlurView } from 'expo-blur';
import { type StyleProp, useColorScheme, type ViewStyle } from 'react-native';

import { useGlass } from './glassContext';
import { themeNameFor } from './theme';
import { blur } from './tokens';

export type GlassKind = 'control' | 'surface';

// Design blur radius (CSS px) per kind: round buttons and chip, or the menu.
const BLUR_RADIUS: Record<GlassKind, number> = {
  control: blur.blurGlass,
  surface: blur.blurSurface,
};
// expo-blur takes an intensity from 1 to 100, not a radius. Starting ratio,
// tuned on device in S6.
const INTENSITY_PER_PX = 3;
// expo-blur always lays its own overlay on the blur (white by default). One
// close to the theme's ground keeps the role tint on top true to the design.
const OVERLAY = { matin: 'light', soir: 'dark' } as const;

interface GlassBlurProps {
  kind: GlassKind;
  style?: StyleProp<ViewStyle>;
}

/**
 * The blur alone, without tint: draw it only when useGlassFill says `blur`,
 * then paint the fill over it.
 */
export function GlassBlur({ kind, style }: GlassBlurProps) {
  const { target } = useGlass();
  const themeName = themeNameFor(useColorScheme());
  return (
    <BlurView
      style={style}
      tint={OVERLAY[themeName]}
      intensity={Math.min(100, BLUR_RADIUS[kind] * INTENSITY_PER_PX)}
      blurMethod="dimezisBlurViewSdk31Plus"
      blurTarget={target ?? undefined}
    />
  );
}
