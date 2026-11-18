import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { Icon } from './Icon';
import { useTheme } from './theme';
import { radius, size, spacing } from './tokens';

// Library default springs: durations and curves are set in the S6 prototype (SPEC §14.1).
const CLOSE_DISTANCE = 80;
const CLOSE_VELOCITY = 800;
// Android draws its navigation under the app: the content stays clear of it.
const ANDROID_NAV_GAP = spacing.space16;

interface SheetProps {
  accessibilityLabel: string;
  /**
   * Makes the sheet dismissible: scrim, close button, swipe down on the
   * handle. Without it the sheet is docked (burst type sheet: the screen
   * above it stays usable and "Reprendre" is the way out).
   */
  onClose?: () => void;
  children: ReactNode;
}

/**
 * Bottom sheet (design-system/components/Sheet). Height fits the content;
 * a long content scrolls inside. The swipe is caught by the top bar only,
 * so scrolling the content never closes the sheet.
 */
export function Sheet({ accessibilityLabel, onClose, children }: SheetProps) {
  const { t } = useTranslation();
  const { colors, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  const offset = useSharedValue(0);
  const paddingBottom =
    Platform.OS === 'android'
      ? Math.max(spacing.space24, insets.bottom + ANDROID_NAV_GAP)
      : Math.max(insets.bottom, spacing.space24);

  const swipe = Gesture.Pan()
    .enabled(onClose !== undefined)
    .onUpdate((event) => {
      offset.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      if (onClose && (event.translationY > CLOSE_DISTANCE || event.velocityY > CLOSE_VELOCITY)) {
        scheduleOnRN(onClose);
      } else {
        offset.value = withSpring(0);
      }
    });

  const followFinger = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {onClose ? (
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]}
          onPress={onClose}
          accessible={false}
          importantForAccessibility="no"
        />
      ) : null}
      <Animated.View
        entering={SlideInDown}
        accessibilityViewIsModal={onClose !== undefined}
        accessibilityLabel={accessibilityLabel}
        style={[
          styles.sheet,
          {
            backgroundColor: colors.sheet,
            borderColor: colors.sheetEdge,
            boxShadow: shadows.shadowSheet,
            paddingBottom,
          },
          followFinger,
        ]}
      >
        <GestureDetector gesture={swipe}>
          <View style={onClose ? styles.top : styles.dockedTop}>
            <View style={[styles.handle, { backgroundColor: colors.handle }]} />
            {onClose ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
                onPress={onClose}
                hitSlop={(size.sizeTap - size.sizeClose) / 2}
                style={[styles.close, { backgroundColor: colors.controlFill }]}
              >
                <Icon name="close" size={18} color={colors.ink} />
              </Pressable>
            ) : null}
          </View>
        </GestureDetector>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '92%',
    paddingTop: spacing.space10,
    paddingHorizontal: 20,
    borderTopLeftRadius: radius.radiusSheet,
    borderTopRightRadius: radius.radiusSheet,
    borderTopWidth: 1,
  },
  // .md-sheet-top: room for the close button.
  top: { height: 40, alignItems: 'center' },
  dockedTop: { alignItems: 'center' },
  handle: { width: 40, height: 5, borderRadius: 3 },
  close: {
    position: 'absolute',
    right: -6,
    top: spacing.space10,
    width: size.sizeClose,
    height: size.sizeClose,
    borderRadius: radius.radiusFull,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
