# Android system backup coverage

Open item of `SPEC.md` §14.1, resolved in S3 on the Galaxy A06 (2026-11-14). Decision recorded in §11.4 and §14.2.

## Question
Does Android's system backup (Auto Backup to Google Drive) keep the wardrobe — database and photos — when the app is reinstalled or the phone replaced?

## Configuration
- The generated manifest has `android:allowBackup="true"` (Expo default) and no backup rules: Auto Backup covers `files/` (database under `files/SQLite`, photos under `files/photos`), `databases/` and `shared_prefs/`. `cache/` is never backed up.
- Auto Backup stops at **25 MB per app**: over the quota, Android backs up **nothing** for the app, database included, and the app is not told.

## Measurements (Galaxy A06, development build, 5 garments)
| Item | Size |
|---|---|
| One garment (original JPEG 2048 px, JPEG 0.8 + cutout PNG) | 1,248–1,312 KB, about 1.3 MB |
| Database (`files/SQLite`) | 120 KB |
| Development JS bundle (`files/BridgelessReactNativeDevBundle.js`) | 9.8 MB, development builds only (release builds read it from the APK) |
| Cache (`cache/`, ML Kit model and image caches) | 28 MB, never backed up |

At about 1.3 MB per garment, the 25 MB quota is reached around **18 garments** in a release build (fewer in a development build). A real wardrobe of 100 garments weighs about 130 MB.

## Device test
1. `adb shell bmgr backupnow com.candyfairstudio.wardrobe.dev` returned "Backup is not allowed": the phone's backup service was off (`bmgr enabled` → disabled; logcat `Backup requested but enabled=false`).
2. Once Google backup was turned on, the app package was refused by the Google transport ("Transport rejected package because it wasn't able to process it at the time") and `bmgr list sets` listed no restore set.
3. After uninstalling and reinstalling, nothing came back.

The restore was not pursued: even when it works, the quota alone rules out photo coverage. The test also shows that system backup depends on a phone setting the app cannot see.

## Conclusion
Android system backup does not cover a real wardrobe, photos or database. The decision (Candice, 2026-11-14):
- **Photos are excluded from Android system backup; the database is kept** (a few hundred KB, always under the quota). After a reinstall, garments and their history come back without their photos.
- Implemented in S11, with the export/import archive, which becomes the only photo backup on Android, and a "missing photo" state for cards (to design).
- Until then, the default configuration stays: it covers the first garments only.

## Procedure (to check the S11 rules)
With the phone plugged in, Google backup on (`adb shell bmgr enabled` → enabled), the app open and a few garments added:
```bash
adb shell run-as com.candyfairstudio.wardrobe.dev du -sh files files/photos files/SQLite
adb shell bmgr backupnow com.candyfairstudio.wardrobe.dev
adb shell bmgr list sets
adb uninstall com.candyfairstudio.wardrobe.dev
adb install android/app/build/outputs/apk/debug/app-debug.apk
adb shell bmgr restore <TOKEN> com.candyfairstudio.wardrobe.dev   # if nothing came back on install
```
