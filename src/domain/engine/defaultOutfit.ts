import type { Slot } from '../types';
import type { EngineGarment, LayerSlot, OutfitSelection, RowSlot } from './types';

export interface DefaultOutfit {
  outfit: OutfitSelection;
  coordinationBroken: boolean;
}

interface DefaultOutfitInput {
  rows: Record<RowSlot, readonly string[]>;
  garmentsById: ReadonlyMap<string, EngineGarment>;
  suggestedLayers: Record<LayerSlot, boolean>;
  shoesSuggested: boolean;
  yesterday: OutfitSelection | null;
}

// Order in which rows pick, which also decides who keeps the statement piece.
const PICK_ORDER: readonly RowSlot[] = ['top', 'bottom', 'midLayer', 'outerLayer', 'shoes'];
// Rows tried, in order, to avoid repeating yesterday's outfit.
const VARY_ORDER: readonly RowSlot[] = ['top', 'bottom', 'shoes', 'midLayer', 'outerLayer'];

interface Pick {
  row: RowSlot;
  index: number;
}

function slotOf(row: RowSlot, garment: EngineGarment): Slot {
  // The top row also holds one-pieces (SPEC §4.1).
  return row === 'top' ? garment.slot : row;
}

/**
 * SPEC §7 step 5: first garment of each row that applies, at most one
 * statement piece (§4.5), and never exactly yesterday's outfit when another
 * choice exists.
 */
export function defaultOutfit({
  rows,
  garmentsById,
  suggestedLayers,
  shoesSuggested,
  yesterday,
}: DefaultOutfitInput): DefaultOutfit {
  const garment = (id: string): EngineGarment => {
    const found = garmentsById.get(id);
    if (!found) throw new Error(`Ranked garment missing: ${id}`);
    return found;
  };
  const isStatement = (id: string) => garment(id).statementPiece;
  // Same kind of piece in the top row: a top never becomes a one-piece, so the
  // bottom row stays as it is.
  const sameKind = (row: RowSlot, a: string, b: string) =>
    row !== 'top' || garment(a).slot === garment(b).slot;

  const picks: Pick[] = [];
  let coordinationBroken = false;

  for (const row of PICK_ORDER) {
    const ids = rows[row];
    if (ids.length === 0) continue;
    // A one-piece takes the place of the top and the bottom.
    const topPick = picks.find((pick) => pick.row === 'top');
    if (row === 'bottom' && topPick && garment(rows.top[topPick.index]).slot === 'onePiece') {
      continue;
    }
    if ((row === 'midLayer' || row === 'outerLayer') && !suggestedLayers[row]) continue;
    if (row === 'shoes' && !shoesSuggested) continue;

    const statementPick = picks.find((pick) => isStatement(rows[pick.row][pick.index]));
    if (!statementPick) {
      picks.push({ row, index: 0 });
      continue;
    }
    const plain = ids.findIndex((id) => !isStatement(id));
    if (plain !== -1) {
      picks.push({ row, index: plain });
      continue;
    }
    // Only statement pieces here: hand the earlier statement over if its row
    // has a plain alternative of the same kind.
    const earlierIds = rows[statementPick.row];
    const current = earlierIds[statementPick.index];
    const swap = earlierIds.findIndex(
      (id) => !isStatement(id) && sameKind(statementPick.row, id, current),
    );
    if (swap !== -1) {
      statementPick.index = swap;
    } else {
      coordinationBroken = true;
    }
    picks.push({ row, index: 0 });
  }

  const toOutfit = (list: readonly Pick[]): OutfitSelection => {
    const outfit: OutfitSelection = {};
    for (const { row, index } of list) {
      const id = rows[row][index];
      outfit[slotOf(row, garment(id))] = id;
    }
    return outfit;
  };

  let outfit = toOutfit(picks);
  if (yesterday && sameOutfit(outfit, yesterday)) {
    outfit = vary(picks, rows, isStatement, sameKind, toOutfit) ?? outfit;
  }
  return { outfit, coordinationBroken };
}

// Moves one row to its next acceptable garment; null when none can move.
function vary(
  picks: readonly Pick[],
  rows: Record<RowSlot, readonly string[]>,
  isStatement: (id: string) => boolean,
  sameKind: (row: RowSlot, a: string, b: string) => boolean,
  toOutfit: (list: readonly Pick[]) => OutfitSelection,
): OutfitSelection | null {
  for (const row of VARY_ORDER) {
    const pick = picks.find((candidate) => candidate.row === row);
    if (!pick) continue;
    const ids = rows[row];
    const current = ids[pick.index];
    const othersHaveStatement = picks.some(
      (other) => other !== pick && isStatement(rows[other.row][other.index]),
    );
    const next = ids.findIndex(
      (id, index) =>
        index !== pick.index &&
        sameKind(row, id, current) &&
        !(othersHaveStatement && isStatement(id)),
    );
    if (next !== -1) {
      return toOutfit(picks.map((other) => (other === pick ? { row, index: next } : other)));
    }
  }
  return null;
}

/** Same garment in every slot, and no slot more or less. */
export function sameOutfit(a: OutfitSelection, b: OutfitSelection): boolean {
  const keysA = Object.keys(a) as Slot[];
  const keysB = Object.keys(b) as Slot[];
  return keysA.length === keysB.length && keysA.every((slot) => a[slot] === b[slot]);
}
