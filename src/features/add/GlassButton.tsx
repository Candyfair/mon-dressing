import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { fontFamilies, radius, size } from '../../ui/tokens';
import { cameraColors } from './cameraColors';

interface GlassButtonProps {
  onPress: () => void;
  accessibilityLabel?: string;
  disabled?: boolean;
  /** Round icon button when set, text pill otherwise. */
  icon?: ReactNode;
  label?: string;
  diameter?: number;
}

/**
 * Translucent control over the camera picture (mockups AG1 to AG3). The
 * mockups blur the picture behind it; a flat dark fill stands in until the
 * S6 blur decision (SPEC §14.1).
 */
export function GlassButton({
  onPress,
  accessibilityLabel,
  disabled = false,
  icon,
  label,
  diameter = size.sizeTap,
}: GlassButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={Math.max(0, (size.sizeTap - diameter) / 2)}
      style={({ pressed }) => [
        styles.base,
        icon ? { width: diameter, height: diameter } : { height: diameter, paddingHorizontal: 16 },
        (pressed || disabled) && styles.dimmed,
      ]}
    >
      {icon ?? <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.radiusFull,
    borderWidth: 1,
    borderColor: cameraColors.glassEdge,
    backgroundColor: cameraColors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimmed: { opacity: 0.6 },
  label: {
    fontFamily: fontFamilies.text,
    fontWeight: '600',
    fontSize: 14,
    color: cameraColors.ink,
  },
});
