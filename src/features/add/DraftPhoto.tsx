import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '../../ui/Icon';
import { fontFamilies, spacing } from '../../ui/tokens';
import { cameraColors } from './cameraColors';
import type { CutoutJobStatus } from './cutout';
import { GlassButton } from './GlassButton';

interface DraftPhotoProps {
  photoUri: string;
  cutoutStatus: CutoutJobStatus;
  isBusy: boolean;
  onRetake: () => void;
  onRotate: () => void;
}

/** The photo above the type sheet, with "Reprendre" and the cutout status (AG2, AG4). */
export function DraftPhoto({
  photoUri,
  cutoutStatus,
  isBusy,
  onRetake,
  onRotate,
}: DraftPhotoProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={StyleSheet.absoluteFill}>
      <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />
      <View style={[styles.header, { top: insets.top + spacing.space8 }]}>
        <GlassButton
          label={t('add.retake')}
          accessibilityLabel={t('add.retakeLabel')}
          onPress={onRetake}
          diameter={36}
        />
        {/* Rotate: not in the mockups, placement provisional (decided 2026-11-13). */}
        <GlassButton
          accessibilityLabel={t('add.rotateLabel')}
          disabled={isBusy}
          onPress={onRotate}
          diameter={36}
          icon={<Icon name="rotate" size={18} color={cameraColors.ink} />}
        />
        <View style={styles.status} accessibilityLiveRegion="polite">
          {cutoutStatus === 'running' ? (
            <>
              <Icon name="progress" size={14} color={cameraColors.ink} />
              <Text style={styles.statusText}>{t('add.cuttingOut')}</Text>
            </>
          ) : null}
          {cutoutStatus === 'done' ? (
            <>
              <Icon name="check" size={14} color={cameraColors.ink} />
              <Text style={styles.statusText}>{t('add.cutOut')}</Text>
            </>
          ) : null}
          {/* Failed: nothing to say here, the original photo is used (SPEC §10.3). */}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  photo: { flex: 1, backgroundColor: cameraColors.ground },
  header: {
    position: 'absolute',
    left: spacing.space16,
    right: spacing.space16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.space10,
  },
  status: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.space6,
  },
  statusText: { fontFamily: fontFamilies.text, fontSize: 13, color: cameraColors.ink },
});
