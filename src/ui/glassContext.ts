import { type ComponentRef, createContext, type RefObject, useContext } from 'react';
import type { View } from 'react-native';

/**
 * How glass surfaces are drawn (design-system "Verre dépoli"):
 * - `blur`: frosted, the content behind is blurred under the tint;
 * - `tint`: the low-end Android fallback, the same tint more opaque, no blur.
 * Decided per platform after the S6 measures on the Galaxy A06 (SPEC §14.1).
 */
export type GlassMode = 'blur' | 'tint';

// Blur everywhere until the A06 measures say otherwise.
export const DEFAULT_GLASS_MODE: GlassMode = 'blur';

export interface GlassSettings {
  mode: GlassMode;
  // Android blurs only the content of a BlurTargetView: the screen's
  // GlassStage registers it here. Unused on iOS.
  target: RefObject<ComponentRef<typeof View> | null> | null;
}

export const GlassContext = createContext<GlassSettings>({
  mode: DEFAULT_GLASS_MODE,
  target: null,
});

export function useGlass(): GlassSettings {
  return useContext(GlassContext);
}
