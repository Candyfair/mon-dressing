// Single writer of the lifecycle columns (CLAUDE.md §3.6): the values come
// from src/domain/lifecycle/ as branded patches and are written together with
// their garmentEvents rows in one transaction.
import { eq, inArray } from 'drizzle-orm';

import { getSubtype, type SubtypeKey } from '../../domain/catalogue/subtypes';
import {
  initialLifecycle,
  type LifecycleCommand,
  type LifecycleEventDraft,
  type LifecycleGarment,
  type LifecyclePatch,
  transition,
} from '../../domain/lifecycle';
import type { NewGarmentCutout, Usage } from '../../domain/types';
import { garmentEvents, garments, garmentUsages } from '../schema';
import type { SyncDatabase } from '../types';

/** What the add flow decides. Lifecycle columns are not part of it. */
export interface NewGarmentDraft {
  // Chosen by the caller: the photo paths contain it.
  id: string;
  wardrobeId: string;
  subtype: SubtypeKey;
  isFavorite: boolean;
  statementPiece: boolean;
  needsIroning: boolean;
  usages: readonly Usage[];
  photoOriginalPath: string;
  // The burst flow always inserts `pending` and records the outcome once the
  // row exists. `done` and `failed` are for garments that arrive with their
  // cutout settled (demo wardrobe in S10, import in S11).
  cutout: NewGarmentCutout;
}

/**
 * Creates a garment in its initial lifecycle state, with its usages, in one
 * transaction. No event is written: a creation is not a change of location.
 */
export function insertGarment(
  db: SyncDatabase,
  { cutout, usages, ...draft }: NewGarmentDraft,
  { now }: { now: Date },
): void {
  db.transaction((tx) => {
    tx.insert(garments)
      .values({
        ...draft,
        ...initialLifecycle(now),
        slot: getSubtype(draft.subtype).slot,
        cutoutStatus: cutout.status,
        photoCutoutPath: cutout.status === 'done' ? cutout.path : null,
        createdAt: now,
        updatedAt: now,
      })
      .run();
    const distinctUsages = [...new Set(usages)];
    if (distinctUsages.length > 0) {
      tx.insert(garmentUsages)
        .values(distinctUsages.map((usage) => ({ garmentId: draft.id, usage })))
        .run();
    }
  });
}

export interface LifecycleOperation {
  garmentId: string;
  command: LifecycleCommand;
}

export type ApplyLifecycleResult =
  { ok: true } | { ok: false; reason: 'notAllowed' | 'notFound'; operation: LifecycleOperation };

interface LifecycleDeps {
  now: Date;
  newId: () => string;
}

/**
 * Applies the operations in order, all or nothing: if one is not allowed,
 * nothing is written. A garment can take several commands (wear, then sort).
 * An operation that changes nothing is skipped.
 */
export function applyLifecycle(
  db: SyncDatabase,
  operations: readonly LifecycleOperation[],
  deps: LifecycleDeps,
): ApplyLifecycleResult {
  return db.transaction((tx) => applyLifecycleIn(tx, operations, deps));
}

/**
 * Same as applyLifecycle, inside a transaction the caller already holds (an
 * outfit written together with its wears). On a refusal nothing of the batch
 * is written; rolling back the caller's own writes is up to the caller.
 */
export function applyLifecycleIn(
  tx: SyncDatabase,
  operations: readonly LifecycleOperation[],
  { now, newId }: LifecycleDeps,
): ApplyLifecycleResult {
  const ids = [...new Set(operations.map((operation) => operation.garmentId))];
  const current = new Map<string, LifecycleGarment>(
    tx
      .select()
      .from(garments)
      .where(inArray(garments.id, ids))
      .all()
      .map((row) => [row.id, row]),
  );

  // Compute every transition before writing anything.
  const writes: { garmentId: string; patch: LifecyclePatch; events: LifecycleEventDraft[] }[] = [];
  for (const operation of operations) {
    const garment = current.get(operation.garmentId);
    if (!garment) {
      return { ok: false, reason: 'notFound', operation };
    }
    const result = transition(garment, operation.command, now);
    if (!result.ok) {
      if (result.reason === 'unchanged') {
        continue;
      }
      return { ok: false, reason: result.reason, operation };
    }
    current.set(garment.id, { ...garment, ...result.patch });
    writes.push({ garmentId: garment.id, patch: result.patch, events: result.events });
  }

  for (const { garmentId, patch, events } of writes) {
    tx.update(garments)
      .set({ ...patch, updatedAt: now })
      .where(eq(garments.id, garmentId))
      .run();
    if (events.length > 0) {
      tx.insert(garmentEvents)
        .values(events.map((event) => ({ ...event, id: newId(), garmentId, occurredAt: now })))
        .run();
    }
  }
  return { ok: true };
}
