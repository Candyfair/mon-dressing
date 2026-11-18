import {
  type EngineGarment,
  type LayerSlot,
  type OutfitSelection,
  ROW_SLOTS,
  type RowSlot,
  slotInRow,
  type Suggestion,
} from '../../domain/engine';

/**
 * What the user has chosen on Today, on top of the engine's suggestion: the
 * garment shown in each row and the rows that are part of the outfit. The
 * user's choice wins over the engine (SPEC §7); a row keeps its position
 * while hidden, so the bottom comes back after a dress.
 */
export interface OutfitChoice {
  // Position in `suggestion.rows[row]`.
  index: Readonly<Record<RowSlot, number>>;
  shown: Readonly<Record<RowSlot, boolean>>;
  // Rows opened to the closest pieces ("Voir les autres ?").
  widened: Readonly<Record<RowSlot, boolean>>;
}

export type GarmentSlots = ReadonlyMap<string, Pick<EngineGarment, 'slot'>>;

const LAYERS: readonly LayerSlot[] = ['midLayer', 'outerLayer'];

function mapRows<T>(make: (row: RowSlot) => T): Record<RowSlot, T> {
  return Object.fromEntries(ROW_SLOTS.map((row) => [row, make(row)])) as Record<RowSlot, T>;
}

/** The engine's default outfit as a starting choice. */
export function initialChoice(suggestion: Suggestion): OutfitChoice {
  const { rows, outfit, proposedRows } = suggestion;
  return {
    index: mapRows((row) => {
      const id = row === 'top' ? (outfit.top ?? outfit.onePiece) : outfit[row];
      return Math.max(0, id === undefined ? 0 : rows[row].indexOf(id));
    }),
    shown: mapRows((row) => proposedRows[row] && rows[row].length > 0),
    widened: mapRows(() => false),
  };
}

/** The garments a row offers: the eligible ones, else the closest once asked for. */
export function rowGarments(
  choice: OutfitChoice,
  suggestion: Suggestion,
  row: RowSlot,
): readonly string[] {
  const eligible = suggestion.rows[row];
  return eligible.length === 0 && choice.widened[row] ? suggestion.closest[row] : eligible;
}

/** The garment a row currently shows, whether or not a dress hides it. */
function garmentAt(choice: OutfitChoice, suggestion: Suggestion, row: RowSlot): string | null {
  const ids = rowGarments(choice, suggestion, row);
  return choice.shown[row] && ids.length > 0 ? (ids[choice.index[row] % ids.length] ?? null) : null;
}

/** A one-piece in the top row takes the bottom's place. */
export function wearsOnePiece(
  choice: OutfitChoice,
  suggestion: Suggestion,
  slots: GarmentSlots,
): boolean {
  const top = garmentAt(choice, suggestion, 'top');
  return top !== null && slots.get(top)?.slot === 'onePiece';
}

/**
 * How much of a one-piece a looping row shows at a position between two
 * pieces, from 0 to 1: the bottom fades out as a dress arrives. Worklet.
 */
export function onePieceShare(position: number, onePieces: readonly boolean[]): number {
  'worklet';
  const count = onePieces.length;
  if (count === 0) return 0;
  const at = (index: number) => (onePieces[((index % count) + count) % count] ? 1 : 0);
  const before = Math.floor(position);
  const progress = position - before;
  return at(before) * (1 - progress) + at(before + 1) * progress;
}

/** The garment of a row as part of the outfit: none for a bottom under a dress. */
export function chosenGarment(
  choice: OutfitChoice,
  suggestion: Suggestion,
  slots: GarmentSlots,
  row: RowSlot,
): string | null {
  if (row === 'bottom' && wearsOnePiece(choice, suggestion, slots)) {
    return null;
  }
  return garmentAt(choice, suggestion, row);
}

/** The outfit as the engine and the database name it, slot by slot. */
export function chosenOutfit(
  choice: OutfitChoice,
  suggestion: Suggestion,
  slots: GarmentSlots,
): OutfitSelection {
  const outfit: OutfitSelection = {};
  for (const row of ROW_SLOTS) {
    const id = chosenGarment(choice, suggestion, slots, row);
    const garment = id === null ? undefined : slots.get(id);
    if (id !== null && garment) {
      outfit[slotInRow(row, garment)] = id;
    }
  }
  return outfit;
}

/** What "Je porte cette tenue" waits for: a top and a bottom, or a one-piece. */
export function missingPiece(outfit: OutfitSelection): 'top' | 'bottom' | null {
  if (outfit.onePiece !== undefined) return null;
  if (outfit.top === undefined) return 'top';
  if (outfit.bottom === undefined) return 'bottom';
  return null;
}

/** Layers in the outfit, in the order of the left column (Couche 1, Couche 2). */
export function shownLayers(choice: OutfitChoice): LayerSlot[] {
  return LAYERS.filter((row) => choice.shown[row]);
}

/** A layer the user can still add: it has eligible pieces, or else close ones. */
export function nextLayer(choice: OutfitChoice, suggestion: Suggestion): LayerSlot | null {
  return (
    LAYERS.find(
      (row) =>
        !choice.shown[row] &&
        (suggestion.rows[row].length > 0 || suggestion.closest[row].length > 0),
    ) ?? null
  );
}

/** Adds a layer the user asked for, on its closest pieces if none is eligible. */
export function addLayer(
  choice: OutfitChoice,
  suggestion: Suggestion,
  row: LayerSlot,
): OutfitChoice {
  return {
    ...showRow(choice, row, true),
    widened: { ...choice.widened, [row]: suggestion.rows[row].length === 0 },
  };
}

const OUTFIT_ROWS = ['top', 'bottom', 'shoes'] as const;
export type OutfitRow = (typeof OUTFIT_ROWS)[number];

/** Rows of the default outfit with nothing to show: drawn as empty slots. */
export function emptyRows(
  choice: OutfitChoice,
  suggestion: Suggestion,
  slots: GarmentSlots,
): OutfitRow[] {
  return OUTFIT_ROWS.filter(
    (row) =>
      suggestion.proposedRows[row] &&
      rowGarments(choice, suggestion, row).length === 0 &&
      !(row === 'bottom' && wearsOnePiece(choice, suggestion, slots)),
  );
}

/** Empty rows that have pieces to offer through "Voir les autres ?". */
export function widenableRows(
  choice: OutfitChoice,
  suggestion: Suggestion,
  slots: GarmentSlots,
): OutfitRow[] {
  return emptyRows(choice, suggestion, slots).filter((row) => suggestion.closest[row].length > 0);
}

/** Opens rows to their closest pieces, starting from the nearest one. */
export function widenRows(choice: OutfitChoice, rows: readonly OutfitRow[]): OutfitChoice {
  return rows.reduce(
    (current, row) => ({
      index: { ...current.index, [row]: 0 },
      shown: { ...current.shown, [row]: true },
      widened: { ...current.widened, [row]: true },
    }),
    choice,
  );
}

export function showRow(choice: OutfitChoice, row: RowSlot, shown: boolean): OutfitChoice {
  return { ...choice, shown: { ...choice.shown, [row]: shown } };
}

export function moveTo(choice: OutfitChoice, row: RowSlot, index: number): OutfitChoice {
  return { ...choice, index: { ...choice.index, [row]: index } };
}
