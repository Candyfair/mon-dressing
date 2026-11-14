import { act, renderHook } from '@testing-library/react-native';

import { insertGarment } from '../../db/repositories/garmentLifecycle';
import { CutoutQueue, type CutoutQueueDeps } from './cutout/cutoutQueue';
import {
  deleteGarmentPhotos,
  discardCachedFile,
  normalizePhoto,
  rotatePhoto,
} from './photos/photoStore';
import { reportError } from './reportError';
import { type CapturedPhoto, type GarmentChoice, useBurstSession } from './useBurstSession';

// A promise the test settles by hand.
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// A fresh queue per test, read through a getter so the hook always sees it.
const mockCutout = {
  queue: null as unknown as CutoutQueue,
  calls: [] as { sourceUri: string; finish: () => void }[],
  deps: null as unknown as jest.Mocked<Omit<CutoutQueueDeps, 'cutOut'>>,
};
jest.mock('./cutout', () => ({
  get cutoutQueue() {
    return mockCutout.queue;
  },
}));

let mockNextId = 0;
jest.mock('expo-crypto', () => ({ randomUUID: () => `g${++mockNextId}` }));
jest.mock('../../db/client', () => ({ db: {} }));
jest.mock('../../db/repositories/settings', () => ({ activeWardrobeId: () => 'w1' }));
jest.mock('../../db/repositories/garmentLifecycle', () => ({ insertGarment: jest.fn() }));
jest.mock('./reportError', () => ({ reportError: jest.fn() }));
jest.mock('./photos/photoStore', () => ({
  normalizePhoto: jest.fn(),
  rotatePhoto: jest.fn(),
  storeOriginalPhoto: jest.fn((id: string) => `photos/${id}/original.jpg`),
  deleteGarmentPhotos: jest.fn(),
  discardCachedFile: jest.fn(),
  photoUri: (path: string) => `file:///doc/${path}`,
}));

const CAMERA_PHOTO: CapturedPhoto = {
  uri: 'cache/camera.jpg',
  width: 3000,
  height: 4000,
  isTemporary: true,
};
const CHOICE: GarmentChoice = {
  subtype: 'tshirt',
  isFavorite: false,
  statementPiece: false,
  needsIroning: false,
  usages: [],
};

// Lets pending promise callbacks run, inside act() for the state updates.
const flush = () => act(() => new Promise((resolve) => setImmediate(resolve)));

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'info').mockImplementation(() => {});
  mockNextId = 0;
  mockCutout.calls = [];
  mockCutout.deps = {
    storeCutout: jest.fn(
      (garmentId: string, _cacheUri: string) => `photos/${garmentId}/cutout.png`,
    ),
    discard: jest.fn(),
    record: jest.fn(),
    reportError: jest.fn(),
  };
  mockCutout.queue = new CutoutQueue({
    ...mockCutout.deps,
    cutOut: (sourceUri) =>
      new Promise((resolve) => {
        mockCutout.calls.push({ sourceUri, finish: () => resolve({ uri: `${sourceUri}.png` }) });
      }),
  });
  jest.mocked(normalizePhoto).mockResolvedValue('cache/normalized.jpg');
  jest.mocked(rotatePhoto).mockResolvedValue('cache/rotated.jpg');
});

// Renders the hook and opens a draft from the camera photo.
async function withDraft() {
  const hook = await renderHook(() => useBurstSession());
  await act(() => hook.result.current.capture(async () => CAMERA_PHOTO));
  return hook;
}

describe('useBurstSession', () => {
  it('opens a draft and shows the end of its cutout', async () => {
    const { result } = await withDraft();
    expect(discardCachedFile).toHaveBeenCalledWith('cache/camera.jpg');
    expect(result.current.draft).toMatchObject({
      photoUri: 'cache/normalized.jpg',
      cutoutStatus: 'running',
    });

    await flush();
    mockCutout.calls[0]?.finish();
    await flush();
    expect(result.current.draft?.cutoutStatus).toBe('done');
  });

  it('ignores a second capture while the first one runs (double tap)', async () => {
    const { result } = await renderHook(() => useBurstSession());
    const photo = deferred<CapturedPhoto>();
    const take = jest.fn(() => photo.promise);
    let first!: Promise<void>;
    await act(async () => {
      first = result.current.capture(take);
      void result.current.capture(take);
    });
    photo.resolve(CAMERA_PHOTO);
    await act(() => first);
    expect(take).toHaveBeenCalledTimes(1);
    expect(normalizePhoto).toHaveBeenCalledTimes(1);
  });

  it('keeps the draft after a failed save, and saves on retry', async () => {
    const { result } = await withDraft();
    jest.mocked(insertGarment).mockImplementationOnce(() => {
      throw new Error('disk full');
    });

    await act(async () => result.current.save(CHOICE));
    expect(reportError).toHaveBeenCalledWith(new Error('disk full'));
    expect(deleteGarmentPhotos).toHaveBeenCalledWith('g1');
    expect(result.current.draft).not.toBeNull();
    expect(result.current.added.count).toBe(0);

    await act(async () => result.current.save(CHOICE));
    expect(insertGarment).toHaveBeenLastCalledWith(
      {},
      expect.objectContaining({ id: 'g2', cutout: { status: 'pending' } }),
      expect.anything(),
    );
    expect(result.current.draft).toBeNull();
    expect(result.current.added).toEqual({
      count: 1,
      lastPhotoUri: 'file:///doc/photos/g2/original.jpg',
    });

    // The cutout goes to the garment that exists.
    await flush();
    mockCutout.calls[0]?.finish();
    await flush();
    expect(mockCutout.deps.record).toHaveBeenCalledWith('g2', {
      status: 'done',
      path: 'photos/g2/cutout.png',
    });
    expect(mockCutout.deps.record).toHaveBeenCalledTimes(1);
  });

  it('ignores save and retake while a rotation runs, then shows the rotated photo', async () => {
    const { result } = await withDraft();
    const rotated = deferred<string>();
    jest.mocked(rotatePhoto).mockReturnValueOnce(rotated.promise);

    let rotation!: Promise<void>;
    await act(async () => {
      rotation = result.current.rotate();
    });
    expect(result.current.isBusy).toBe(true);
    await act(async () => {
      result.current.save(CHOICE);
      result.current.retake();
    });
    expect(insertGarment).not.toHaveBeenCalled();

    rotated.resolve('cache/rotated.jpg');
    await act(() => rotation);
    expect(result.current.draft).toMatchObject({
      photoUri: 'cache/rotated.jpg',
      cutoutStatus: 'running',
    });
    expect(result.current.isBusy).toBe(false);

    // The first cutout was already running: its PNG is deleted when it ends,
    // then the rotated photo is cut out and shown.
    mockCutout.calls[0]?.finish();
    await flush();
    expect(mockCutout.deps.discard).toHaveBeenCalledWith('cache/normalized.jpg.png');
    expect(mockCutout.calls.map((call) => call.sourceUri)).toEqual([
      'cache/normalized.jpg',
      'cache/rotated.jpg',
    ]);
    expect(result.current.draft?.cutoutStatus).toBe('running');
    mockCutout.calls[1]?.finish();
    await flush();
    expect(result.current.draft?.cutoutStatus).toBe('done');
  });

  it('deletes a rotated photo that ends after the screen closed', async () => {
    const { result, unmount } = await withDraft();
    const rotated = deferred<string>();
    jest.mocked(rotatePhoto).mockReturnValueOnce(rotated.promise);
    let rotation!: Promise<void>;
    await act(async () => {
      rotation = result.current.rotate();
    });

    await unmount();
    rotated.resolve('cache/rotated.jpg');
    await rotation;
    expect(discardCachedFile).toHaveBeenCalledWith('cache/rotated.jpg');
  });

  it('deletes a photo prepared after the screen closed, without a cutout', async () => {
    const { result, unmount } = await renderHook(() => useBurstSession());
    const normalized = deferred<string>();
    jest.mocked(normalizePhoto).mockReturnValueOnce(normalized.promise);
    let capture!: Promise<void>;
    await act(async () => {
      capture = result.current.capture(async () => CAMERA_PHOTO);
    });

    await unmount();
    normalized.resolve('cache/normalized.jpg');
    await capture;
    await new Promise((resolve) => setImmediate(resolve));
    expect(discardCachedFile).toHaveBeenCalledWith('cache/normalized.jpg');
    expect(mockCutout.calls).toHaveLength(0);
  });

  it('abandons the open draft when the screen closes', async () => {
    const { unmount } = await withDraft();
    await flush();
    await unmount();
    mockCutout.calls[0]?.finish();
    await mockCutout.queue.idle();
    await new Promise((resolve) => setImmediate(resolve));
    expect(mockCutout.deps.discard).toHaveBeenCalledWith('cache/normalized.jpg.png');
    expect(discardCachedFile).toHaveBeenCalledWith('cache/normalized.jpg');
    expect(insertGarment).not.toHaveBeenCalled();
  });
});
