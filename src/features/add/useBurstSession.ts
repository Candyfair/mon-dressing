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
  void draft.job.settled.then(() => discardCachedFile(draft.photoUri));
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
  const [draft, setDraft] = useState<Draft | null>(null);
  // Last outcome seen per job; the status of a running job is read from it.
  const [settled, setSettled] = useState<{ job: CutoutJob; status: CutoutJobStatus } | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [added, setAdded] = useState<{ count: number; lastPhotoUri: string | null }>({
    count: 0,
    lastPhotoUri: null,
  });

  // Abandons the draft left open when the screen closes.
  const draftRef = useRef<Draft | null>(null);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);
  useEffect(
    () => () => {
      if (draftRef.current) {
        abandon(draftRef.current);
      }
    },
    [],
  );

  const job = draft?.job;
  useEffect(() => {
    if (!job) {
      return;
    }
    let isCurrent = true;
    void job.settled.then((status) => {
      if (isCurrent) {
        setSettled({ job, status });
      }
    });
    return () => {
      isCurrent = false;
    };
  }, [job]);

  const begin = useCallback(async (photo: CapturedPhoto, startedAt: number) => {
    setIsBusy(true);
    try {
      const uri = await normalizePhoto(photo.uri, photo);
      if (photo.isTemporary) {
        discardCachedFile(photo.uri);
      }
      setDraft({ key: startedAt, photoUri: uri, job: cutoutQueue.start(uri), startedAt });
    } finally {
      setIsBusy(false);
    }
  }, []);

  const retake = useCallback(() => {
    if (draft) {
      abandon(draft);
      setDraft(null);
    }
  }, [draft]);

  // A quarter turn restarts the cutout on the rotated photo; quick taps
  // only cut out the last one (abandoned jobs that have not started are skipped).
  const rotate = useCallback(async () => {
    if (!draft) {
      return;
    }
    setIsBusy(true);
    try {
      const uri = await rotatePhoto(draft.photoUri);
      abandon(draft);
      setDraft({ ...draft, photoUri: uri, job: cutoutQueue.start(uri) });
    } finally {
      setIsBusy(false);
    }
  }, [draft]);

  const save = useCallback(
    (choice: GarmentChoice) => {
      if (!draft) {
        return;
      }
      const id = randomUUID();
      const originalPath = storeOriginalPhoto(id, draft.photoUri);
      // claim() and the insert stay in the same synchronous block: a cutout
      // outcome is recorded in a later task, once the row exists.
      const cutout = cutoutQueue.claim(draft.job, id);
      try {
        insertGarment(
          db,
          {
            ...choice,
            id,
            wardrobeId: activeWardrobeId(db),
            photoOriginalPath: originalPath,
            cutout,
          },
          { now: new Date() },
        );
      } catch (error) {
        deleteGarmentPhotos(id);
        throw error;
      }
      releaseWhenSettled(draft);
      if (__DEV__) {
        const seconds = ((Date.now() - draft.startedAt) / 1000).toFixed(1);
        console.info(`[burst] garment saved in ${seconds} s (shutter → save)`);
      }
      setAdded(({ count }) => ({ count: count + 1, lastPhotoUri: photoUri(originalPath) }));
      setDraft(null);
    },
    [draft],
  );

  const cutoutStatus: CutoutJobStatus =
    settled && settled.job === job ? settled.status : (job?.status ?? 'running');

  return { draft, cutoutStatus, isBusy, added, begin, retake, rotate, save };
}
