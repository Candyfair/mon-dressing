import type { Slot } from '../types';
import {
  type EngineGarment,
  type OutfitSelection,
  ROW_SLOTS,
  type RowSlot,
  slotInRow,
} from './types';

export interface DefaultOutfit {
  outfit: OutfitSelection;
  coordinationBroken: boolean;
}

interface DefaultOutfitInput {
  rows: Record<RowSlot, readonly string[]>;
  garmentsById: ReadonlyMap<string, EngineGarment>;
  proposedRows: Record<RowSlot, boolean>;
  yesterday: OutfitSelection | null;
}

// Rows tried, in order, to avoid repeating yesterday's outfit.
const VARY_ORDER: readonly RowSlot[] = ['top', 'bottom', 'shoes', 'midLayer', 'outerLayer'];

/** The garment chosen in a row, as its position in that row. */
interface RowPick {
  row: RowSlot;
  index: number;
}

/** The ranked rows and how to look their garments up. */
class Ranking {
  constructor(
    readonly rows: Record<RowSlot, readonly string[]>,
    private readonly garmentsById: ReadonlyMap<string, EngineGarment>,
  ) {}

  garment(id: string): EngineGarment {
    const found = this.garmentsById.get(id);
    if (!found) throw new Error(`Ranked garment missing: ${id}`);
    return found;
  }

  idAt({ row, index }: RowPick): string {
    return this.rows[row][index];
  }

  isStatement(id: string): boolean {
    return this.garment(id).statementPiece;
  }

  // Swapping within the top row keeps a top a top and a one-piece a
  // one-piece, so the bottom row is never affected.
  sameKind(row: RowSlot, a: string, b: string): boolean {
    return row !== 'top' || this.garment(a).slot === this.garment(b).slot;
  }

  toOutfit(picks: readonly RowPick[]): OutfitSelection {
    const outfit: OutfitSelection = {};
    for (const pick of picks) {
      const id = this.idAt(pick);
      outfit[slotInRow(pick.row, this.garment(id))] = id;
    }
    return outfit;
  }
}

function replaced(picks: readonly RowPick[], target: RowPick, index: number): RowPick[] {
  return picks.map((pick) => (pick === target ? { row: pick.row, index } : pick));
}

/**
 * First garment of each wanted row, in ROW_SLOTS order, keeping at most one
 * statement piece (SPEC §4.5): a later row takes its first plain garment; a
 * row with statement pieces only takes over the statement if the earlier row
 * has a plain garment of the same kind, else the outfit is flagged.
 */
function pickRows(
  ranking: Ranking,
  wanted: (row: RowSlot) => boolean,
): { picks: RowPick[]; coordinationBroken: boolean } {
  let picks: RowPick[] = [];
  let coordinationBroken = false;

  for (const row of ROW_SLOTS) {
    const ids = ranking.rows[row];
    if (ids.length === 0 || !wanted(row)) continue;
    // A one-piece takes the place of the top and the bottom (SPEC §4.1).
    const top = picks.find((pick) => pick.row === 'top');
    if (row === 'bottom' && top && ranking.garment(ranking.idAt(top)).slot === 'onePiece') {
      continue;
    }

    const statement = picks.find((pick) => ranking.isStatement(ranking.idAt(pick)));
    const plain = ids.findIndex((id) => !ranking.isStatement(id));
    if (!statement || plain !== -1) {
      picks = [...picks, { row, index: statement ? plain : 0 }];
      continue;
    }
    const current = ranking.idAt(statement);
    const handOver = ranking.rows[statement.row].findIndex(
      (id) => !ranking.isStatement(id) && ranking.sameKind(statement.row, id, current),
    );
    if (handOver === -1) {
      coordinationBroken = true;
    } else {
      picks = replaced(picks, statement, handOver);
    }
    picks = [...picks, { row, index: 0 }];
  }
  return { picks, coordinationBroken };
}

/** Moves one row to another acceptable garment; null when no row can move. */
function varied(ranking: Ranking, picks: readonly RowPick[]): RowPick[] | null {
  for (const row of VARY_ORDER) {
    const pick = picks.find((candidate) => candidate.row === row);
    if (!pick) continue;
    const current = ranking.idAt(pick);
    const othersHaveStatement = picks.some(
      (other) => other !== pick && ranking.isStatement(ranking.idAt(other)),
    );
    const next = ranking.rows[row].findIndex(
      (id, index) =>
        index !== pick.index &&
        ranking.sameKind(row, id, current) &&
        !(othersHaveStatement && ranking.isStatement(id)),
    );
    if (next !== -1) return replaced(picks, pick, next);
  }
  return null;
}

/**
 * SPEC §7 step 5: first garment of each row that applies, at most one
 * statement piece (§4.5), and never exactly yesterday's outfit when another
 * choice exists.
 */
export function defaultOutfit({
  rows,
  garmentsById,
  proposedRows,
  yesterday,
}: DefaultOutfitInput): DefaultOutfit {
  const ranking = new Ranking(rows, garmentsById);

  const { picks, coordinationBroken } = pickRows(ranking, (row) => proposedRows[row]);
  const outfit = ranking.toOutfit(picks);
  if (yesterday && sameOutfit(outfit, yesterday)) {
    const alternative = varied(ranking, picks);
    if (alternative) return { outfit: ranking.toOutfit(alternative), coordinationBroken };
  }
  return { outfit, coordinationBroken };
}

/** Same garment in every slot, and no slot more or less. */
export function sameOutfit(a: OutfitSelection, b: OutfitSelection): boolean {
  const keysA = Object.keys(a) as Slot[];
  const keysB = Object.keys(b) as Slot[];
  return keysA.length === keysB.length && keysA.every((slot) => a[slot] === b[slot]);
}
