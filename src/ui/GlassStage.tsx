import { BlurTargetView } from 'expo-blur';
import { type ComponentRef, type ReactNode, useMemo, useRef } from 'react';
import { Platform, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { DEFAULT_GLASS_MODE, GlassContext, type GlassMode } from './glassContext';

interface GlassStageProps {
  // What the glass surfaces blur: background, outfit, content.
  behind: ReactNode;
  // The glass layer on top (header controls, tab bar, menus).
  children: ReactNode;
  // Development override, to compare blur and tint on device.
  mode?: GlassMode;
  style?: StyleProp<ViewStyle>;
}

/**
 * A screen with glass on top of it. On Android, expo-blur only blurs the
 * content of a BlurTargetView, so the screen draws its content in `behind`
 * and its glass in `children`, which must not be inside the target.
 */
export function GlassStage({
  behind,
  children,
  mode = DEFAULT_GLASS_MODE,
  style,
}: GlassStageProps) {
  const target = useRef<ComponentRef<typeof View>>(null);
  const settings = useMemo(() => ({ mode, target }), [mode]);
  return (
    <GlassContext.Provider value={settings}>
      <View style={[styles.stage, style]}>
        {Platform.OS === 'android' ? (
          <BlurTargetView ref={target} style={StyleSheet.absoluteFill}>
            {behind}
          </BlurTargetView>
        ) : (
          <View style={StyleSheet.absoluteFill}>{behind}</View>
        )}
        {children}
      </View>
    </GlassContext.Provider>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1 },
});
