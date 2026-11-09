// Single writer of the lifecycle columns (CLAUDE.md §3.6): the values come
// from src/domain/lifecycle/ as branded patches and are written together with
// their garmentEvents rows in one transaction.
import { eq, inArray } from 'drizzle-orm';

import {
  type LifecycleCommand,
  type LifecycleEventDraft,
  type LifecycleGarment,
  type LifecyclePatch,
  transition,
} from '../../domain/lifecycle';
import { garmentEvents, garments } from '../schema';
import type { SyncDatabase } from '../types';

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
  { now, newId }: LifecycleDeps,
): ApplyLifecycleResult {
  return db.transaction((tx) => {
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
    const writes: { garmentId: string; patch: LifecyclePatch; events: LifecycleEventDraft[] }[] =
      [];
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
  });
}
