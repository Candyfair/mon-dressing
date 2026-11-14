const { AndroidConfig, withAndroidManifest } = require('expo/config-plugins');

// ML Kit reads one comma-separated list from this key to download its models
// at install time. expo-camera declares barcode_ui under the same key, which
// breaks the manifest merge; its barcode scanner is turned off in
// app.config.ts, so the app manifest keeps only the segmentation model and
// overrides every library value.
const MLKIT_DEPENDENCIES = 'com.google.mlkit.vision.DEPENDENCIES';
const MODELS = 'subject_segment';

/** @type {import('expo/config-plugins').ConfigPlugin} */
const withSubjectSegmentationModel = (config) =>
  withAndroidManifest(config, (config) => {
    const manifest = AndroidConfig.Manifest.ensureToolsAvailable(config.modResults);
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
    const others = (application['meta-data'] ?? []).filter(
      (item) => item.$['android:name'] !== MLKIT_DEPENDENCIES,
    );
    application['meta-data'] = [
      ...others,
      {
        $: {
          'android:name': MLKIT_DEPENDENCIES,
          'android:value': MODELS,
          'tools:replace': 'android:value',
        },
      },
    ];
    config.modResults = manifest;
    return config;
  });

module.exports = withSubjectSegmentationModel;
