// Today's outfit: validation (« Je porte cette tenue »), its undo, and the
// probable outfit kept as the evening safety net (SPEC §7, §8.5). The wears
// go through the lifecycle in the same transaction as the outfit rows.
import { and, eq, TransactionRollbackError } from 'drizzle-orm';

import type { OutfitSelection } from '../../domain/engine';
import type { LifecycleCommand } from '../../domain/lifecycle';
import type { LocalDate } from '../../domain/time';
import { type DayContext, type OutfitStatus, SLOTS } from '../../domain/types';
import { outfitItems, outfits } from '../schema';
import type { SyncDatabase } from '../types';
import { type ApplyLifecycleResult, applyLifecycleIn } from './garmentLifecycle';

interface OutfitDeps {
  now: Date;
  newId: () => string;
}

interface DayOutfit {
  wardrobeId: string;
  date: LocalDate;
  context: DayContext;
  selection: OutfitSelection;
}

export type DayValidation =
  { status: 'validated'; id: string; selection: OutfitSelection } | { status: 'none' };

export type ValidateOutfitResult = ApplyLifecycleResult | { ok: false; reason: 'alreadyValidated' };

export type UndoValidationResult =
  ApplyLifecycleResult | { ok: false; reason: 'notValidated' | 'alreadySorted' };

type OutfitRow = typeof outfits.$inferSelect;

function findOutfit(
  db: SyncDatabase,
  wardrobeId: string,
  date: LocalDate,
  status: OutfitStatus,
): OutfitRow | undefined {
  return db
    .select()
    .from(outfits)
    .where(
      and(eq(outfits.wardrobeId, wardrobeId), eq(outfits.date, date), eq(outfits.status, status)),
    )
    .get();
}

/** The pieces of an outfit row, by slot; a deleted garment leaves its slot empty. */
export function selectionOf(db: SyncDatabase, outfitId: string): OutfitSelection {
  const selection: OutfitSelection = {};
  for (const item of db
    .select()
    .from(outfitItems)
    .where(eq(outfitItems.outfitId, outfitId))
    .all()) {
    if (item.garmentId !== null) {
      selection[item.slot] = item.garmentId;
    }
  }
  return selection;
}

function garmentIds(selection: OutfitSelection): string[] {
  return SLOTS.flatMap((slot) => selection[slot] ?? []);
}

/**
 * Creates or updates the day's row of that status with the context snapshot
 * and replaces its items. Returns the row id.
 */
function writeOutfit(
  tx: SyncDatabase,
  { wardrobeId, date, context, selection }: DayOutfit,
  status: OutfitStatus,
  validatedAt: Date | null,
  { now, newId }: OutfitDeps,
): string {
  const snapshot = {
    activity: context.activity,
    commuteModes: [...context.commuteModes],
    occasion: context.occasion,
    validatedAt,
  };
  const existing = findOutfit(tx, wardrobeId, date, status);
  const id = existing?.id ?? newId();
  if (existing) {
    tx.update(outfits).set(snapshot).where(eq(outfits.id, id)).run();
    tx.delete(outfitItems).where(eq(outfitItems.outfitId, id)).run();
  } else {
    tx.insert(outfits)
      .values({ id, wardrobeId, date, status, createdAt: now, ...snapshot })
      .run();
  }
  const items = SLOTS.flatMap((slot) => {
    const garmentId = selection[slot];
    return garmentId === undefined ? [] : [{ outfitId: id, slot, garmentId }];
  });
  if (items.length > 0) {
    tx.insert(outfitItems).values(items).run();
  }
  return id;
}

/**
 * Runs `write` in a transaction and rolls everything back when the lifecycle
 * refuses an operation, so an outfit never exists without its wears.
 */
function withLifecycle<R extends { ok: boolean }>(
  db: SyncDatabase,
  write: (tx: SyncDatabase) => R,
): R {
  let refused: R | null = null;
  try {
    return db.transaction((tx) => {
      const result = write(tx);
      if (!result.ok) {
        refused = result;
        tx.rollback();
      }
      return result;
    });
  } catch (error) {
    if (error instanceof TransactionRollbackError && refused !== null) {
      return refused;
    }
    throw error;
  }
}

/** The day's validated outfit, frozen for the day (SPEC §7). */
export function todayOutfit(db: SyncDatabase, wardrobeId: string, date: LocalDate): DayValidation {
  const row = findOutfit(db, wardrobeId, date, 'validated');
  if (!row || row.validatedAt === null) {
    return { status: 'none' };
  }
  return { status: 'validated', id: row.id, selection: selectionOf(db, row.id) };
}

/**
 * « Je porte cette tenue »: writes the validated outfit and wears each of its
 * pieces (SPEC §8.2), all or nothing. After an undo, the day's row is reused.
 * Refused while the day is already validated, so a piece is never worn twice.
 */
export function validateOutfit(
  db: SyncDatabase,
  outfit: DayOutfit,
  deps: OutfitDeps,
): ValidateOutfitResult {
  return withLifecycle<ValidateOutfitResult>(db, (tx) => {
    if (todayOutfit(tx, outfit.wardrobeId, outfit.date).status === 'validated') {
      return { ok: false, reason: 'alreadyValidated' };
    }
    const id = writeOutfit(tx, outfit, 'validated', deps.now, deps);
    const command: LifecycleCommand = { type: 'wear', outfitId: id, source: 'today' };
    return applyLifecycleIn(
      tx,
      garmentIds(outfit.selection).map((garmentId) => ({ garmentId, command })),
      deps,
    );
  });
}

/**
 * Undoes today's validation (tapping the button again): takes back each wear
 * and clears `validatedAt`; the row and its items stay for the history.
 * Refused once the outfit has been sorted in the evening.
 */
export function undoValidation(
  db: SyncDatabase,
  wardrobeId: string,
  date: LocalDate,
  deps: OutfitDeps,
): UndoValidationResult {
  return withLifecycle<UndoValidationResult>(db, (tx) => {
    const row = findOutfit(tx, wardrobeId, date, 'validated');
    if (!row || row.validatedAt === null) {
      return { ok: false, reason: 'notValidated' };
    }
    if (row.sortedAt !== null) {
      return { ok: false, reason: 'alreadySorted' };
    }
    tx.update(outfits).set({ validatedAt: null }).where(eq(outfits.id, row.id)).run();
    const command: LifecycleCommand = { type: 'unwear', outfitId: row.id };
    return applyLifecycleIn(
      tx,
      garmentIds(selectionOf(tx, row.id)).map((garmentId) => ({ garmentId, command })),
      deps,
    );
  });
}

/**
 * The outfit shown when Today goes to the background (SPEC §8.5 safety net).
 * `selection` is null when the outfit is incomplete: no sort will happen, so
 * the day's probable outfit is removed. Nothing changes once validated.
 */
export function saveProbableOutfit(
  db: SyncDatabase,
  outfit: Omit<DayOutfit, 'selection'> & { selection: OutfitSelection | null },
  deps: OutfitDeps,
): void {
  db.transaction((tx) => {
    if (todayOutfit(tx, outfit.wardrobeId, outfit.date).status === 'validated') {
      return;
    }
    const { selection } = outfit;
    if (selection === null) {
      tx.delete(outfits)
        .where(
          and(
            eq(outfits.wardrobeId, outfit.wardrobeId),
            eq(outfits.date, outfit.date),
            eq(outfits.status, 'probable'),
          ),
        )
        .run();
      return;
    }
    writeOutfit(tx, { ...outfit, selection }, 'probable', null, deps);
  });
}
