# Cutout test protocol

Fixed protocol for risk R7 (`SPEC.md` §3, §10). Run it on both reference devices after any change to `modules/subject-cutout/`. The photos stay on the device: they are not versioned, because this repository is public.

## Devices
- iPhone 12 mini (S1)
- Galaxy A06 (S2)

## The 15 photos
Real garments from the wardrobe, shot the way burst mode will be used: phone in hand, ordinary home lighting, no staging. Keep the same 15 photos between runs.

| # | Case |
|---|---|
| 1 | Plain light top, flat on a dark surface |
| 2 | Plain dark top, flat on a light surface |
| 3 | Top close in colour to the background |
| 4 | Patterned top |
| 5 | Top on a hanger, against a wall |
| 6 | Trousers, flat |
| 7 | Dark trousers on a dark surface |
| 8 | Skirt with folds |
| 9 | Dress on a hanger |
| 10 | Thin or see-through fabric |
| 11 | Knit with an irregular outline |
| 12 | Coat or jacket, sleeves spread out |
| 13 | Pair of shoes, side by side |
| 14 | Busy background (bed, chair, clutter) |
| 15 | Low-light shot |

## Method
1. Build the app on the device:
   - iOS: `npx expo run:ios --device`;
   - Android: `npx expo run:android --device`, on a **fresh install** (uninstall the app first; see "Android setup" below).

   A debug build is enough for quality, but read the timings with care and note the build type.
2. Close other apps, then open the app (cutout harness screen).
3. Pick the 15 photos in order. They are processed one at a time.
4. Check each cutout on the white, black and magenta backdrops: magenta reveals fringes and holes.
5. Export the CSV and copy the timings below.

### Android specifics
- **Model download.** ML Kit Subject Segmentation is delivered by Google Play services, not shipped in the APK. On a sideloaded debug build, the first cutout can wait for the download. Record photo 1's duration separately, and note whether the device was on Wi-Fi.
- **Model size.** Note the size given in Google's documentation, and the storage used by Google Play services before and after the first install (Settings › Apps › Google Play services › Storage).
- **Selection order.** `orderedSelection` only exists on iOS. Check that the rows come back in the order the photos were picked; otherwise, pick them one by one.
- **Resolution.** Android scales the longest side down to 2048 px before segmentation, while iOS keeps the source resolution. Compare quality with that in mind.

### Android setup (Mac mini, once)
1. Install the JDK required by the current Expo SDK (Expo documentation, "Set up your environment" › Android device › Development build), for example `brew install --cask zulu@17`.
2. Install Android Studio. In SDK Manager, add the Android SDK Platform listed in the same Expo page and the Android SDK Platform-Tools.
3. Add to `~/.zshrc`, then open a new terminal:
   ```bash
   export JAVA_HOME=/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools
   ```
4. On the Galaxy A06: Settings › About phone › Software information, tap "Build number" seven times. Then, in Developer options, turn on "USB debugging".
5. Plug the phone in, accept the debugging prompt, and check that `adb devices` lists it.

## Rating
- **Good**: usable as is.
- **Acceptable**: visible defect, but the garment reads well on a card.
- **Unusable**: part of the garment is missing, or part of the background remains.

The fallback decision (`SPEC.md` §10.4) is taken in S2, once both devices have been tested.

## Results

### iPhone 12 mini
Date: 2026-11-06 · iOS: 27.0.1 · Build: Debug (`npx expo run:ios --device`)

| # | Rating | Duration (ms) | Size | Notes |
|---|---|---|---|---|
| 1 | Good | 747 | 2954 × 3419 |  |
| 2 | Good | 416 | 2878 × 3277 |  |
| 3 | Good | 347 | 2877 × 2804 |  |
| 4 | Good | 419 | 2558 × 2962 |  |
| 5 | Acceptable | 336 | 2860 × 3009 | Wooden hanger kept; its metal hook was removed |
| 6 | Unusable | 576 | 2942 × 4032 | Light blue jeans on a white surface: only a small part of the background removed, on the right |
| 7 | Unusable | 484 | 2830 × 3985 | Background kept as if it were part of the garment |
| 8 | Good | 381 | 2924 × 1961 |  |
| 9 | Acceptable | 351 | 2009 × 4009 | Same as 5: wooden part of the hanger kept |
| 10 | Good | 245 | 2954 × 1490 |  |
| 11 | Good | 396 | 2896 × 2875 |  |
| 12 | Good | 294 | 3734 × 2062 |  |
| 13 | Good | 351 | 2274 × 3300 |  |
| 14 | Unusable | 498 | 2682 × 3969 | Part of the background merged into the garment |
| 15 | Good | 307 | 1977 × 2316 |  |

**Summary:** 10 good, 2 acceptable, 3 unusable. Both acceptable cases keep a wooden hanger. The unusable ones are low contrast (6, 7) and a busy background (14).

**Timings:** median 381 ms, mean 410 ms, range 245–747 ms. The slowest is the first photo, which probably includes loading the model; the others stay under 600 ms. Debug build, so a release build should be at least as fast.

**Output size:** the PNGs keep the source resolution, up to 3734 × 2062 and 2942 × 4032 px. To keep in mind for storage and card thumbnails in S3.

Rows follow the selection order (the order of the cases above), not the file names.

### Galaxy A06
Date: 2026-11-08 · Android: 16 · Build: Debug (`npx expo run:android --device`) · Fresh install, Wi-Fi

Source photos: the iPhone set, transferred as JPEG at 100 % quality.

| # | Rating | Duration (ms) | Size | Notes |
|---|---|---|---|---|
| 1 | Good | 7371 | 1500 × 1736 | First cutout after a fresh install: includes initialisation and possibly the model download |
| 2 | Good | 3772 | 1461 × 1664 |  |
| 3 | Good | 3602 | 1330 × 1569 |  |
| 4 | Good | 3789 | 1299 × 1509 |  |
| 5 | Acceptable | 3182 | 1454 × 1462 | Small part of the wooden hanger kept |
| 6 | Good | 5015 | 1272 × 1893 |  |
| 7 | Acceptable | 5269 | 1283 × 1960 | A very small part of the background kept with the garment |
| 8 | Good | 4424 | 1486 × 993 |  |
| 9 | Good | 3238 | 1020 × 1968 |  |
| 10 | Good | 2746 | 1506 × 756 |  |
| 11 | Good | 3612 | 1472 × 1459 |  |
| 12 | Good | 2812 | 1896 × 1047 |  |
| 13 | Good | 2964 | 1153 × 1674 |  |
| 14 | Good | 3446 | 1462 × 1421 |  |
| 15 | Good | 3737 | 1424 × 1219 |  |

**Summary:** 13 good, 2 acceptable, 0 unusable. The three cases that fail on iOS (low contrast 6 and 7, busy background 14) pass here; 7 keeps a very small part of the background.

**Timings:** median 3612 ms, mean 3932 ms (3686 ms without photo 1), range 2746–7371 ms: about ten times slower than the iPhone 12 mini. Photo 1 cannot separate the model download from initialisation.

**Model size:** not measured.

**Output size:** at most 1968 px on the longest side, after the 2048 px input downscale and the crop.

Rows follow the selection order (the order of the cases above), checked on the device.

## Decision (S2)
Native APIs are kept on both platforms (step 1 of `SPEC.md` §10.4); no fallback is started. 13/15 usable on iOS, 15/15 on Android. The iOS failures are low-contrast and busy-background shots, covered by the shooting guidance and the user fallback (§10.3: original photo, "Réessayer").

Consequences for S3:
- Android takes about 3.5 s per cutout: in burst mode, the queue for 10 garments takes about 40 s in the background, so the loading state of the cards must stay clear.
- Output resolution differs between platforms (source size on iOS, at most 2048 px on Android): to settle with storage and thumbnails.
