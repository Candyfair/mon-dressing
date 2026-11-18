import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { GlassBlur, type GlassKind } from './GlassBlur';
import { useGlassFill } from './useGlassFill';

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
  const { blur, fill } = useGlassFill(tint);
  return (
    <View style={[styles.clip, style]}>
      {blur ? <GlassBlur kind={kind} style={StyleSheet.absoluteFill} /> : null}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: fill }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
});
