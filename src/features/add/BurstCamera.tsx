import { CameraView } from 'expo-camera';
import { Image } from 'expo-image';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Icon } from '../../ui/Icon';
import { fontFamilies, radius, spacing } from '../../ui/tokens';
import { cameraColors, cameraShadows } from './cameraColors';
import { GlassButton } from './GlassButton';

// Framing guide of AG1: corners 26 pt long, 24 pt from the sides.
const FRAME_SIDE = 24;
const FRAME_CORNER = 26;

interface BurstCameraProps {
  cameraRef: RefObject<CameraView | null>;
  /** False while the type sheet is open: the preview pauses but stays mounted. */
  isActive: boolean;
  isBusy: boolean;
  addedCount: number;
  lastPhotoUri: string | null;
  onClose: () => void;
  onDone: () => void;
  onShutter: () => void;
  onPickFromGallery: () => void;
  onOpenAdded: () => void;
}

/** Full-screen camera of the burst add flow (AG1), always dark. */
export function BurstCamera({
  cameraRef,
  isActive,
  isBusy,
  addedCount,
  lastPhotoUri,
  onClose,
  onDone,
  onShutter,
  onPickFromGallery,
  onOpenAdded,
}: BurstCameraProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const frameTop = insets.top + 120;
  const frameBottom = height - insets.bottom - 202;
  const frameRight = width - FRAME_SIDE;

  return (
    <View style={styles.screen}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" active={isActive} />

      <Svg
        width={width}
        height={height}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
        accessible={false}
      >
        <Path
          d={[
            `M${FRAME_SIDE} ${frameTop + FRAME_CORNER}V${frameTop}H${FRAME_SIDE + FRAME_CORNER}`,
            `M${frameRight - FRAME_CORNER} ${frameTop}H${frameRight}V${frameTop + FRAME_CORNER}`,
            `M${frameRight} ${frameBottom - FRAME_CORNER}V${frameBottom}H${frameRight - FRAME_CORNER}`,
            `M${FRAME_SIDE + FRAME_CORNER} ${frameBottom}H${FRAME_SIDE}V${frameBottom - FRAME_CORNER}`,
          ].join(' ')}
          fill="none"
          stroke={cameraColors.ink}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>

      <View style={[styles.header, { top: insets.top + spacing.space8 }]}>
        <GlassButton
          accessibilityLabel={t('common.close')}
          onPress={onClose}
          icon={<Icon name="close" size={20} color={cameraColors.ink} />}
        />
        <Text style={styles.title} accessibilityRole="header">
          {t('add.title')}
        </Text>
        <GlassButton label={t('add.done')} onPress={onDone} />
      </View>
      <Text style={[styles.instruction, { top: insets.top + 70 }]}>{t('add.instruction')}</Text>

      <View style={[styles.footer, { bottom: insets.bottom + 40 }]}>
        {addedCount > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('add.addedCount', { count: addedCount })}
            onPress={onOpenAdded}
            style={styles.stack}
          >
            {lastPhotoUri ? (
              <Image source={{ uri: lastPhotoUri }} style={styles.stackPhoto} contentFit="cover" />
            ) : null}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{addedCount}</Text>
            </View>
          </Pressable>
        ) : (
          <View style={styles.stackPlaceholder} />
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('add.takePhoto')}
          accessibilityState={{ disabled: isBusy }}
          disabled={isBusy}
          onPress={onShutter}
          style={({ pressed }) => [styles.shutter, (pressed || isBusy) && styles.dimmed]}
        >
          <View style={styles.shutterCore} />
        </Pressable>
        <GlassButton
          accessibilityLabel={t('add.pickFromGallery')}
          disabled={isBusy}
          onPress={onPickFromGallery}
          diameter={52}
          icon={<Icon name="gallery" size={22} color={cameraColors.ink} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: cameraColors.ground },
  header: {
    position: 'absolute',
    left: spacing.space16,
    right: spacing.space16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.space10,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fontFamilies.display,
    fontWeight: '600',
    fontSize: 17,
    color: cameraColors.ink,
  },
  instruction: {
    position: 'absolute',
    left: spacing.space16,
    right: spacing.space16,
    textAlign: 'center',
    fontFamily: fontFamilies.text,
    fontSize: 14,
    color: cameraColors.ink,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 84,
    paddingHorizontal: spacing.space40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stack: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: cameraColors.cream,
    boxShadow: cameraShadows.shadowAdd,
  },
  stackPhoto: { flex: 1, borderRadius: 14 },
  stackPlaceholder: { width: 52, height: 52 },
  badge: {
    position: 'absolute',
    right: -6,
    top: -6,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    borderRadius: radius.radiusFull,
    backgroundColor: cameraColors.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: fontFamilies.text,
    fontWeight: '700',
    fontSize: 12,
    color: cameraColors.onAction,
  },
  shutter: {
    width: 80,
    height: 80,
    borderRadius: radius.radiusFull,
    borderWidth: 4,
    borderColor: cameraColors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterCore: {
    width: 64,
    height: 64,
    borderRadius: radius.radiusFull,
    backgroundColor: cameraColors.ink,
  },
  dimmed: { opacity: 0.6 },
});
