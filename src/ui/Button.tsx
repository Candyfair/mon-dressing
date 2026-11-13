import { Pressable, StyleSheet, Text } from 'react-native';

import { type Theme, useTheme } from './theme';
import { fontFamilies, radius, size } from './tokens';

// Variants used so far (design-system/components/Button). Text styles from
// design-system/components/bundle.css (.md-button, .md-link).
export type ButtonVariant = 'primary' | 'outline' | 'link';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  /** Stretches to the parent width (bottom of a sheet). */
  fullWidth?: boolean;
  /** Fixed theme for a screen that ignores the system one (the always-dark camera). */
  theme?: Theme;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  fullWidth = false,
  theme,
}: ButtonProps) {
  const systemTheme = useTheme();
  const { colors } = theme ?? systemTheme;
  const look = (() => {
    switch (variant) {
      case 'primary':
        return disabled
          ? { container: { backgroundColor: colors.actionDisabled }, text: colors.onActionDisabled }
          : { container: { backgroundColor: colors.action }, text: colors.onAction };
      case 'outline':
        return {
          container: { borderWidth: 1, borderColor: colors.outlineEdge },
          text: colors.controlInk,
        };
      case 'link':
        return { container: styles.link, text: colors.controlInk };
      default: {
        const unreachable: never = variant;
        throw new Error(`Unknown button variant ${String(unreachable)}`);
      }
    }
  })();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        variant === 'link' ? null : styles.pill,
        fullWidth && styles.fullWidth,
        look.container,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[variant === 'link' ? styles.linkText : styles.text, { color: look.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: size.sizeButton,
    paddingHorizontal: 22,
    borderRadius: radius.radiusFull,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { alignSelf: 'stretch' },
  link: { minHeight: size.sizeTap, paddingHorizontal: 4, justifyContent: 'center' },
  pressed: { opacity: 0.8 },
  // Wraps on two lines at 200 % text size rather than truncating (Button README).
  text: {
    fontFamily: fontFamilies.text,
    fontWeight: '600',
    fontSize: 15,
    textAlign: 'center',
  },
  linkText: {
    fontFamily: fontFamilies.text,
    fontWeight: '600',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
