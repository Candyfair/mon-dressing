// Background cutout queue (SPEC §10.2). A cutout starts at capture time, while
// the type sheet is open, and the garment may be saved before or after it
// ends. Cutouts run one at a time to keep low-end Android phones responsive.
//
// Pure TypeScript with injected effects, so it is tested without native code.
import type { CutoutOutcome, NewGarmentCutout } from '../../../db/repositories/garmentLifecycle';

export type CutoutJobStatus = 'running' | 'done' | 'failed';

export interface CutoutQueueDeps {
  /** Native cutout: source file URI → PNG in the cache directory. */
  cutOut: (sourceUri: string) => Promise<{ uri: string }>;
  /** Moves a cutout out of the cache into the garment folder; returns its relative path. */
  storeCutout: (garmentId: string, cacheUri: string) => string;
  /** Deletes a cutout nobody will use (retaken photo). */
  discard: (cacheUri: string) => void;
  /** Writes the outcome on a saved garment. */
  record: (garmentId: string, outcome: CutoutOutcome) => void;
  /** Reports unexpected errors (file or database), which are not cutout failures. */
  reportError: (error: unknown) => void;
}

type Owner =
  | { kind: 'draft' } // photo taken, garment not saved yet
  | { kind: 'garment'; garmentId: string }
  | { kind: 'discarded' };

type Result = { status: 'done'; cacheUri: string } | { status: 'failed' };

/** One cutout, seen from the add flow. */
export interface CutoutJob {
  readonly status: CutoutJobStatus;
  /** Resolves when the cutout ends; never rejects. */
  readonly settled: Promise<Exclude<CutoutJobStatus, 'running'>>;
}

class Job implements CutoutJob {
  owner: Owner;
  result: Result | null = null;
  readonly settled: Promise<'done' | 'failed'>;
  resolveSettled!: (status: 'done' | 'failed') => void;

  constructor(
    readonly sourceUri: string,
    owner: Owner,
  ) {
    this.owner = owner;
    this.settled = new Promise((resolve) => {
      this.resolveSettled = resolve;
    });
  }

  get status(): CutoutJobStatus {
    return this.result?.status ?? 'running';
  }
}

export class CutoutQueue {
  private tail: Promise<void> = Promise.resolve();

  constructor(private readonly deps: CutoutQueueDeps) {}

  /** Starts the cutout of a photo that has no garment yet. */
  start(sourceUri: string): CutoutJob {
    return this.enqueue(new Job(sourceUri, { kind: 'draft' }));
  }

  /**
   * Gives a draft job its garment, at save time. Returns what to insert:
   * the finished outcome, or `pending` if the cutout is still running (its
   * outcome is then recorded when it ends).
   *
   * Call it right before the synchronous insert, without awaiting in
   * between: an outcome is recorded in a later task, after the row exists.
   */
  claim(job: CutoutJob, garmentId: string): NewGarmentCutout {
    const own = this.own(job);
    if (own.owner.kind !== 'draft') {
      throw new Error('This cutout already belongs to a garment or was discarded');
    }
    own.owner = { kind: 'garment', garmentId };
    if (own.result === null) {
      return { status: 'pending' };
    }
    return this.outcomeFor(garmentId, own.result);
  }

  /** Drops a draft job (photo retaken, add flow closed). */
  discard(job: CutoutJob): void {
    const own = this.own(job);
    if (own.owner.kind !== 'draft') {
      return;
    }
    own.owner = { kind: 'discarded' };
    if (own.result?.status === 'done') {
      this.deps.discard(own.result.cacheUri);
    }
  }

  /** Restarts cutouts left pending by a previous run (app closed meanwhile). */
  resume(garments: readonly { garmentId: string; sourceUri: string }[]): void {
    for (const { garmentId, sourceUri } of garments) {
      this.enqueue(new Job(sourceUri, { kind: 'garment', garmentId }));
    }
  }

  /** Resolves once every queued cutout has ended. */
  idle(): Promise<void> {
    return this.tail;
  }

  private own(job: CutoutJob): Job {
    if (!(job instanceof Job)) {
      throw new Error('Unknown cutout job');
    }
    return job;
  }

  private enqueue(job: Job): Job {
    this.tail = this.tail.then(() => this.run(job));
    return job;
  }

  private async run(job: Job): Promise<void> {
    if (job.owner.kind === 'discarded') {
      job.result = { status: 'failed' };
      job.resolveSettled('failed');
      return;
    }
    try {
      const { uri } = await this.deps.cutOut(job.sourceUri);
      job.result = { status: 'done', cacheUri: uri };
    } catch {
      // No subject, model unavailable…: the original photo is used (SPEC §10.3).
      job.result = { status: 'failed' };
    }
    this.settle(job, job.result);
    job.resolveSettled(job.result.status);
  }

  private settle(job: Job, result: Result): void {
    switch (job.owner.kind) {
      case 'draft':
        // Kept until claim() or discard().
        return;
      case 'discarded':
        if (result.status === 'done') {
          this.deps.discard(result.cacheUri);
        }
        return;
      case 'garment': {
        const { garmentId } = job.owner;
        try {
          this.deps.record(garmentId, this.outcomeFor(garmentId, result));
        } catch (error) {
          this.deps.reportError(error);
        }
        return;
      }
      default: {
        const unreachable: never = job.owner;
        throw new Error(`Unexpected owner ${JSON.stringify(unreachable)}`);
      }
    }
  }

  private outcomeFor(garmentId: string, result: Result): CutoutOutcome {
    if (result.status === 'failed') {
      return { status: 'failed' };
    }
    try {
      return { status: 'done', path: this.deps.storeCutout(garmentId, result.cacheUri) };
    } catch (error) {
      this.deps.reportError(error);
      return { status: 'failed' };
    }
  }
}
