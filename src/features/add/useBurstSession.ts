import { randomUUID } from 'expo-crypto';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { SubtypeKey } from '../../domain/catalogue/subtypes';
import type { Usage } from '../../domain/types';
import { db } from '../../db/client';
import { insertGarment } from '../../db/repositories/garmentLifecycle';
import { activeWardrobeId } from '../../db/repositories/settings';
import { type CutoutJob, type CutoutJobStatus, cutoutQueue } from './cutout';
import {
  deleteGarmentPhotos,
  discardCachedFile,
  normalizePhoto,
  type PhotoSize,
  photoUri,
  rotatePhoto,
  storeOriginalPhoto,
} from './photos/photoStore';
import { reportError } from './reportError';

/** What the type sheet decides for one photo. */
export interface GarmentChoice {
  subtype: SubtypeKey;
  isFavorite: boolean;
  statementPiece: boolean;
  needsIroning: boolean;
  usages: Usage[];
}

/** The photo being described in the type sheet. */
export interface Draft {
  // Stable across rotations: keys the type sheet so its choices survive them.
  key: number;
  photoUri: string;
  job: CutoutJob;
  cutoutStatus: CutoutJobStatus;
  // Shutter press, for the R2 timing log (development builds only).
  startedAt: number;
}

export interface CapturedPhoto extends PhotoSize {
  uri: string;
  /** Temporary file of the camera, deleted once normalized; not set for the gallery. */
  isTemporary: boolean;
}

// Deletes the draft photo once its cutout no longer needs it.
function releaseWhenSettled(draft: Draft): void {
  void draft.job.settled.then(() => discardCachedFile(draft.photoUri)).catch(reportError);
}

function abandon(draft: Draft): void {
  cutoutQueue.discard(draft.job);
  releaseWhenSettled(draft);
}

/**
 * State of one burst add session: the current draft, its cutout status, and
 * what was added since the camera opened (the stack in the camera footer).
 */
export function useBurstSession() {
  const [draft, setDraftState] = useState<Draft | null>(null);
  // A capture or a rotation is in progress. The ref blocks a second one
  // synchronously (double tap); the state disables the buttons.
  const [isBusy, setIsBusyState] = useState(false);
  const isBusyRef = useRef(false);
  const [added, setAdded] = useState<{ count: number; lastPhotoUri: string | null }>({
    count: 0,
    lastPhotoUri: null,
  });

  // The draft as of the last change, read after an await to detect that it was
  // saved, retaken or replaced meanwhile. Written with the state, in handlers.
  const draftRef = useRef<Draft | null>(null);
  const isMountedRef = useRef(true);

  const setDraft = useCallback((next: Draft | null) => {
    draftRef.current = next;
    setDraftState(next);
  }, []);

  const setIsBusy = useCallback((next: boolean) => {
    isBusyRef.current = next;
    setIsBusyState(next);
  }, []);

  // Starts a cutout and shows its outcome while its draft is still on screen.
  const startCutout = useCallback((uri: string): CutoutJob => {
    const job = cutoutQueue.start(uri);
    void job.settled.then((cutoutStatus) => {
      const current = draftRef.current;
      if (isMountedRef.current && current?.job === job) {
        draftRef.current = { ...current, cutoutStatus };
        setDraftState(draftRef.current);
      }
    });
    return job;
  }, []);

  // Abandons the draft left open when the screen closes. The state is cleared
  // too, for a Fast Refresh that re-runs this effect on a mounted screen.
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (draftRef.current) {
        abandon(draftRef.current);
        setDraft(null);
      }
    };
  }, [setDraft]);

  /**
   * Takes a photo (camera or gallery) and opens it as the draft. Ignored while
   * another capture or a rotation runs. Errors are reported, never thrown.
   */
  const capture = useCallback(
    async (take: () => Promise<CapturedPhoto | null>) => {
      if (isBusyRef.current || draftRef.current) {
        return;
      }
      const startedAt = Date.now();
      setIsBusy(true);
      try {
        const photo = await take();
        if (!photo) {
          return;
        }
        const uri = await normalizePhoto(photo.uri, photo);
        if (photo.isTemporary) {
          discardCachedFile(photo.uri);
        }
        // Closed while the photo was prepared: nothing left to describe it.
        if (!isMountedRef.current) {
          discardCachedFile(uri);
          return;
        }
        setDraft({
          key: startedAt,
          photoUri: uri,
          job: startCutout(uri),
          cutoutStatus: 'running',
          startedAt,
        });
      } catch (error) {
        reportError(error);
      } finally {
        setIsBusy(false);
      }
    },
    [setDraft, setIsBusy, startCutout],
  );

  const retake = useCallback(() => {
    const current = draftRef.current;
    if (current && !isBusyRef.current) {
      abandon(current);
      setDraft(null);
    }
  }, [setDraft]);

  // A quarter turn restarts the cutout on the rotated photo. Save, retake and
  // rotate are disabled meanwhile (a tap landing before that is ignored); the
  // draft identity check covers the screen closing. Errors are reported.
  const rotate = useCallback(async () => {
    const current = draftRef.current;
    if (!current || isBusyRef.current) {
      return;
    }
    setIsBusy(true);
    try {
      const uri = await rotatePhoto(current.photoUri);
      if (draftRef.current?.job !== current.job) {
        discardCachedFile(uri);
        return;
      }
      abandon(current);
      setDraft({ ...current, photoUri: uri, job: startCutout(uri), cutoutStatus: 'running' });
    } catch (error) {
      reportError(error);
    } finally {
      setIsBusy(false);
    }
  }, [setDraft, setIsBusy, startCutout]);

  // The garment is created with a pending cutout, then the job is claimed: a
  // failed save leaves the draft and its cutout untouched, ready for a retry.
  const save = useCallback(
    (choice: GarmentChoice) => {
      const current = draftRef.current;
      if (!current || isBusyRef.current) {
        return;
      }
      const id = randomUUID();
      let originalPath: string;
      try {
        originalPath = storeOriginalPhoto(id, current.photoUri);
        insertGarment(
          db,
          {
            ...choice,
            id,
            wardrobeId: activeWardrobeId(db),
            photoOriginalPath: originalPath,
            cutout: { status: 'pending' },
          },
          { now: new Date() },
        );
      } catch (error) {
        reportError(error);
        try {
          deleteGarmentPhotos(id);
        } catch (cleanupError) {
          reportError(cleanupError);
        }
        return;
      }
      cutoutQueue.claim(current.job, id);
      releaseWhenSettled(current);
      if (__DEV__) {
        const seconds = ((Date.now() - current.startedAt) / 1000).toFixed(1);
        console.info(`[burst] garment saved in ${seconds} s (shutter → save)`);
      }
      setAdded(({ count }) => ({ count: count + 1, lastPhotoUri: photoUri(originalPath) }));
      setDraft(null);
    },
    [setDraft],
  );

  return { draft, isBusy, added, capture, retake, rotate, save };
}
