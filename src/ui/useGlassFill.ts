import { Platform, useColorScheme } from 'react-native';

import { withMinAlpha } from './color';
import { useGlass } from './glassContext';
import { themeNameFor, useTheme } from './theme';

// Tint fallback (no blur): "the same tint, more opaque". The handoff has no
// value for it: minimum opacity, to review at the level-2 checkpoint. The
// tab bar tints are already more opaque and keep their own.
const FALLBACK_ALPHA = { matin: 0.9, soir: 0.22 } as const;

export interface GlassFill {
  // Whether a GlassBlur draws under the tint.
  blur: boolean;
  // The tint to paint over the blur, or alone, more opaque, without it.
  fill: string;
}

/**
 * How a glass surface is painted in the current mode. For surfaces drawing
 * their own shape (the tab bar): GlassBlur under, `fill` on top.
 */
export function useGlassFill(tint?: string): GlassFill {
  const { colors } = useTheme();
  const themeName = themeNameFor(useColorScheme());
  const { mode, target } = useGlass();
  const color = tint ?? colors.glass;
  // On Android expo-blur needs the screen's GlassStage target.
  const blur = mode === 'blur' && (Platform.OS !== 'android' || target !== null);
  return { blur, fill: blur ? color : withMinAlpha(color, FALLBACK_ALPHA[themeName]) };
}
