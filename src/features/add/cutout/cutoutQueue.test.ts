import { CutoutQueue, type CutoutQueueDeps } from './cutoutQueue';

// A cutout the test ends by hand.
function deferredCutouts() {
  const calls: { sourceUri: string; finish: () => void; fail: () => void }[] = [];
  const cutOut: CutoutQueueDeps['cutOut'] = (sourceUri) =>
    new Promise((resolve, reject) => {
      calls.push({
        sourceUri,
        finish: () => resolve({ uri: `cache/${sourceUri}.png` }),
        fail: () => reject(Object.assign(new Error('no subject'), { code: 'ERR_NO_SUBJECT' })),
      });
    });
  return { calls, cutOut };
}

function setup() {
  const { calls, cutOut } = deferredCutouts();
  const deps = {
    cutOut,
    storeCutout: jest.fn((garmentId: string) => `photos/${garmentId}/cutout.png`),
    discard: jest.fn(),
    record: jest.fn(),
    reportError: jest.fn(),
  } satisfies CutoutQueueDeps;
  return { calls, deps, queue: new CutoutQueue(deps) };
}

// Lets pending promise callbacks run.
const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('CutoutQueue', () => {
  it('runs one cutout at a time, in order', async () => {
    const { calls, queue } = setup();
    queue.start('a');
    queue.start('b');
    await flush();
    expect(calls.map((call) => call.sourceUri)).toEqual(['a']);
    calls[0]?.finish();
    await flush();
    expect(calls.map((call) => call.sourceUri)).toEqual(['a', 'b']);
  });

  it('hands a finished cutout to the garment at save time', async () => {
    const { calls, deps, queue } = setup();
    const job = queue.start('a');
    await flush();
    calls[0]?.finish();
    expect(await job.settled).toBe('done');
    expect(job.status).toBe('done');

    expect(queue.claim(job, 'g1')).toEqual({ status: 'done', path: 'photos/g1/cutout.png' });
    expect(deps.storeCutout).toHaveBeenCalledWith('g1', 'cache/a.png');
    expect(deps.record).not.toHaveBeenCalled();
  });

  it('records the outcome later when the garment is saved first', async () => {
    const { calls, deps, queue } = setup();
    const job = queue.start('a');
    expect(queue.claim(job, 'g1')).toEqual({ status: 'pending' });
    await flush();
    calls[0]?.finish();
    await queue.idle();
    expect(deps.record).toHaveBeenCalledWith('g1', {
      status: 'done',
      path: 'photos/g1/cutout.png',
    });
  });

  it('records a failure, whatever the save order', async () => {
    const { calls, deps, queue } = setup();
    const savedFirst = queue.start('a');
    queue.claim(savedFirst, 'g1');
    const savedAfter = queue.start('b');
    await flush();
    calls[0]?.fail();
    await flush();
    calls[1]?.fail();
    expect(await savedAfter.settled).toBe('failed');

    expect(deps.record).toHaveBeenCalledWith('g1', { status: 'failed' });
    expect(queue.claim(savedAfter, 'g2')).toEqual({ status: 'failed' });
    expect(deps.storeCutout).not.toHaveBeenCalled();
  });

  it('deletes the cutout of a discarded photo, before or after it ends', async () => {
    const { calls, deps, queue } = setup();
    const endsFirst = queue.start('a');
    const discardedFirst = queue.start('b');
    await flush();
    calls[0]?.finish();
    await endsFirst.settled;
    queue.discard(endsFirst);
    queue.discard(discardedFirst);
    await queue.idle();

    expect(deps.discard).toHaveBeenCalledWith('cache/a.png');
    // A photo discarded while waiting is never cut out.
    expect(calls.map((call) => call.sourceUri)).toEqual(['a']);
    expect(await discardedFirst.settled).toBe('failed');
    expect(deps.record).not.toHaveBeenCalled();
  });

  it('refuses to give a job to a second garment', () => {
    const { queue } = setup();
    const job = queue.start('a');
    queue.claim(job, 'g1');
    expect(() => queue.claim(job, 'g2')).toThrow('already belongs');
  });

  it('resumes the cutouts left pending by a previous run', async () => {
    const { calls, deps, queue } = setup();
    queue.resume([
      { garmentId: 'g1', sourceUri: 'file:///doc/photos/g1/original.jpg' },
      { garmentId: 'g2', sourceUri: 'file:///doc/photos/g2/original.jpg' },
    ]);
    await flush();
    calls[0]?.finish();
    await flush();
    calls[1]?.fail();
    await queue.idle();
    expect(deps.record.mock.calls).toEqual([
      ['g1', { status: 'done', path: 'photos/g1/cutout.png' }],
      ['g2', { status: 'failed' }],
    ]);
  });

  it('reports a file error and records a failure instead', async () => {
    const { calls, deps, queue } = setup();
    deps.storeCutout.mockImplementation(() => {
      throw new Error('disk full');
    });
    const job = queue.start('a');
    queue.claim(job, 'g1');
    await flush();
    calls[0]?.finish();
    await queue.idle();
    expect(deps.reportError).toHaveBeenCalledWith(new Error('disk full'));
    expect(deps.record).toHaveBeenCalledWith('g1', { status: 'failed' });
  });
});
