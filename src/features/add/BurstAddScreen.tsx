import { type CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { AppState, Linking, StyleSheet, View } from 'react-native';

import { db } from '../../db/client';
import { recentSubtypes } from '../../db/repositories/garments';
import { activeWardrobeId } from '../../db/repositories/settings';
import { BurstCamera } from './BurstCamera';
import { CameraDenied } from './CameraDenied';
import { cameraColors } from './cameraColors';
import { DraftPhoto } from './DraftPhoto';
import { TypeSheet } from './TypeSheet';
import { type CapturedPhoto, useBurstSession } from './useBurstSession';

// Recent types shown first in the type sheet (AG2 shows three).
const RECENT_TYPES = 3;

/** Burst add flow (design/specs/07): photo → type → save → next photo. */
export function BurstAddScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const session = useBurstSession();
  const { draft } = session;

  // Asks once; after a refusal the access screen offers the phone settings.
  const hasAsked = useRef(false);
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain && !hasAsked.current) {
      hasAsked.current = true;
      void requestPermission();
    }
  }, [permission, requestPermission]);

  // Back from the phone settings: the access may have been granted there.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void getPermission();
      }
    });
    return () => subscription.remove();
  }, [getPermission]);

  const draftKey = draft?.key;
  const recents = useMemo(
    () => (draftKey === undefined ? [] : recentSubtypes(db, activeWardrobeId(db), RECENT_TYPES)),
    [draftKey],
  );

  const close = () => router.back();

  const takePhoto = () =>
    session.capture(async () => {
      const picture = await cameraRef.current?.takePictureAsync({ quality: 0.9 });
      return picture ? { ...picture, isTemporary: true } : null;
    });

  const pickFromGallery = () =>
    session.capture(async (): Promise<CapturedPhoto | null> => {
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
      });
      const asset = picked.canceled ? undefined : picked.assets[0];
      return asset
        ? { uri: asset.uri, width: asset.width, height: asset.height, isTemporary: false }
        : null;
    });

  if (!permission) {
    return <View style={styles.screen} />;
  }

  if (!permission.granted && !draft) {
    return (
      <CameraDenied
        onClose={close}
        onOpenSettings={() => void Linking.openSettings()}
        onPickFromGallery={() => void pickFromGallery()}
      />
    );
  }

  return (
    <View style={styles.screen}>
      {permission.granted ? (
        <BurstCamera
          cameraRef={cameraRef}
          isActive={!draft}
          isBusy={session.isBusy}
          addedCount={session.added.count}
          lastPhotoUri={session.added.lastPhotoUri}
          onClose={close}
          onDone={close}
          onShutter={() => void takePhoto()}
          onPickFromGallery={() => void pickFromGallery()}
          onOpenAdded={close}
        />
      ) : null}
      {draft ? (
        <>
          <DraftPhoto
            photoUri={draft.photoUri}
            cutoutStatus={draft.cutoutStatus}
            isBusy={session.isBusy}
            onRetake={session.retake}
            onRotate={() => void session.rotate()}
          />
          <TypeSheet
            key={draft.key}
            recentSubtypes={recents}
            isBusy={session.isBusy}
            onSave={session.save}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: cameraColors.ground },
});
