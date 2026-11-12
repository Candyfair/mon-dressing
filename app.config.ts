import type { ExpoConfig } from 'expo/config';

// Local builds default to the .dev variant so they can never overwrite the
// daily-use app and its local wardrobe (SPEC §13.3).
const isProduction = process.env.APP_VARIANT === 'production';
const applicationId = isProduction
  ? 'com.candyfairstudio.wardrobe'
  : 'com.candyfairstudio.wardrobe.dev';

// Fonts embedded at build time (no loading at startup). Weights used by
// design/: tokens.json and the mockups (Instrument Sans 700 for counts).
const FONT_FAMILIES = [
  {
    fontFamily: 'Space Grotesk',
    files: {
      500: '500Medium/SpaceGrotesk_500Medium.ttf',
      600: '600SemiBold/SpaceGrotesk_600SemiBold.ttf',
    },
    folder: 'space-grotesk',
  },
  {
    fontFamily: 'Instrument Sans',
    files: {
      400: '400Regular/InstrumentSans_400Regular.ttf',
      500: '500Medium/InstrumentSans_500Medium.ttf',
      600: '600SemiBold/InstrumentSans_600SemiBold.ttf',
      700: '700Bold/InstrumentSans_700Bold.ttf',
    },
    folder: 'instrument-sans',
  },
];

const fontDefinitions = ({ files, folder }: (typeof FONT_FAMILIES)[number]) =>
  Object.entries(files).map(([weight, file]) => ({
    path: `node_modules/@expo-google-fonts/${folder}/${file}`,
    weight: Number(weight),
  }));

const config: ExpoConfig = {
  name: isProduction ? 'Frog-à-porter' : 'Frog-à-porter dev',
  slug: 'frog-a-porter',
  // Deep-link scheme required by Expo Router; distinct per variant so both apps can coexist.
  scheme: isProduction ? 'frogaporter' : 'frogaporter-dev',
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
    'expo-router',
    [
      'expo-font',
      {
        // iOS matches fontFamily + fontWeight through each file's typographic family;
        // Android needs an explicit XML font family per family.
        ios: {
          fonts: FONT_FAMILIES.flatMap((family) => fontDefinitions(family).map((d) => d.path)),
        },
        android: {
          fonts: FONT_FAMILIES.map((family) => ({
            fontFamily: family.fontFamily,
            fontDefinitions: fontDefinitions(family),
          })),
        },
      },
    ],
    // iOS 17 is the floor of Vision's VNGenerateForegroundInstanceMaskRequest (SPEC §10.1).
    ['expo-build-properties', { ios: { deploymentTarget: '17.0' } }],
  ],
};

export default config;
