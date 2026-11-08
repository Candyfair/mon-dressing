import type { ExpoConfig } from 'expo/config';

// Local builds default to the .dev variant so they can never overwrite the
// daily-use app and its local wardrobe (SPEC §13.3).
const isProduction = process.env.APP_VARIANT === 'production';
const applicationId = isProduction
  ? 'com.candyfairstudio.wardrobe'
  : 'com.candyfairstudio.wardrobe.dev';

const config: ExpoConfig = {
  name: isProduction ? 'Frog-à-porter' : 'Frog-à-porter dev',
  slug: 'frog-a-porter',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: applicationId,
    appleTeamId: 'WFS7KVB6Q9',
    supportsTablet: false,
  },
  android: {
    package: applicationId,
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    // iOS 17 is the floor of Vision's VNGenerateForegroundInstanceMaskRequest (SPEC §10.1).
    ['expo-build-properties', { ios: { deploymentTarget: '17.0' } }],
  ],
};

export default config;
