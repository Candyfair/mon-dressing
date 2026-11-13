import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { fontFamilies, radius, size, spacing, themes } from '../../ui/tokens';
import { cameraColors } from './cameraColors';
import { GlassButton } from './GlassButton';

interface CameraDeniedProps {
  onClose: () => void;
  onOpenSettings: () => void;
  onPickFromGallery: () => void;
}

/** Camera access refused (AG3), always dark like the camera. */
export function CameraDenied({ onClose, onOpenSettings, onPickFromGallery }: CameraDeniedProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { top: insets.top + spacing.space8 }]}>
        <GlassButton
          accessibilityLabel={t('common.close')}
          onPress={onClose}
          icon={<Icon name="close" size={20} color={cameraColors.ink} />}
        />
      </View>
      <View style={styles.content}>
        <View style={styles.badge}>
          <Icon name="cameraOff" size={32} color={cameraColors.ink} />
        </View>
        <Text accessibilityRole="header" style={styles.title}>
          {t('add.cameraDenied.title')}
        </Text>
        <Text style={styles.text}>{t('add.cameraDenied.text')}</Text>
        <View style={styles.primary}>
          <Button
            label={t('add.cameraDenied.openSettings')}
            onPress={onOpenSettings}
            theme={themes.soir}
          />
        </View>
        <Pressable accessibilityRole="button" onPress={onPickFromGallery} style={styles.link}>
          <Text style={styles.linkText}>{t('add.pickFromGallery')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Layout from the AG3 mockup. The gallery link is 15 pt here, larger than
// the shared link style (13 pt), so it is drawn locally.
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: cameraColors.ground },
  header: { position: 'absolute', left: spacing.space16 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: radius.radiusFull,
    borderWidth: 1,
    borderColor: cameraColors.glassEdge,
    backgroundColor: cameraColors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 22,
    textAlign: 'center',
    fontFamily: fontFamilies.display,
    fontWeight: '600',
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.48,
    color: cameraColors.ink,
  },
  text: {
    marginTop: spacing.space10,
    textAlign: 'center',
    fontFamily: fontFamilies.text,
    fontSize: 15,
    lineHeight: 22,
    color: cameraColors.inkSecondary,
  },
  primary: { marginTop: 26 },
  link: { marginTop: 12, minHeight: size.sizeTap, justifyContent: 'center' },
  linkText: {
    fontFamily: fontFamilies.text,
    fontWeight: '600',
    fontSize: 15,
    textDecorationLine: 'underline',
    color: cameraColors.controlInk,
  },
});
