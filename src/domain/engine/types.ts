import type { LocalDate } from '../time';
import type { LifecycleState } from '../lifecycle';
import type { DayContext, RotationPace, Slot, Usage } from '../types';
import type { DayWeather } from '../weather';

/**
 * What the engine knows about a garment (read from the database by the
 * caller). The lifecycle columns are only read here, never decided.
 */
export interface EngineGarment extends Readonly<LifecycleState> {
  id: string;
  slot: Slot;
  usages: readonly Usage[];
  isFavorite: boolean;
  statementPiece: boolean;
  // Wear limit of its type; null for shoes (no limit).
  maxWears: number | null;
  // Last `worn` event (DATA_MODEL §3), null if never worn.
  lastWornAt: Date | null;
  createdAt: Date;
}

export interface EngineSettings {
  dryingRackCountsAsStorage: boolean;
  rotationPace: RotationPace;
}

/** Garment id per slot; the top row's choice is stored under `top` or `onePiece`. */
export type OutfitSelection = Partial<Record<Slot, string>>;

export interface SuggestInput {
  date: LocalDate;
  timeZone: string;
  garments: readonly EngineGarment[];
  context: DayContext;
  // Null when the weather is unknown: no Weather filter, no layer suggested.
  weather: DayWeather | null;
  // No constraining window today (SPEC §6.3): known from the context and the
  // settings, even without a forecast.
  indoorDay: boolean;
  settings: EngineSettings;
  // Yesterday's outfit (validated, else probable), if any.
  yesterday: OutfitSelection | null;
}

/** The carousels of Today: one-pieces share the top row (SPEC §4.1). */
export type RowSlot = Exclude<Slot, 'onePiece'>;
// Display order, also the order in which the default outfit picks: the
// earlier row keeps the statement piece.
export const ROW_SLOTS: readonly RowSlot[] = ['top', 'bottom', 'midLayer', 'outerLayer', 'shoes'];

/** The row a garment is shown in. */
export function rowOf(garment: Pick<EngineGarment, 'slot'>): RowSlot {
  return garment.slot === 'onePiece' ? 'top' : garment.slot;
}

/** The outfit slot a garment of a row fills: `top` or `onePiece` in the top row. */
export function slotInRow(row: RowSlot, garment: Pick<EngineGarment, 'slot'>): Slot {
  return row === 'top' ? garment.slot : row;
}

export type LayerSlot = 'midLayer' | 'outerLayer';

export interface Suggestion {
  // Eligible garment ids per row, best first. Nothing eligible is hidden.
  rows: Record<RowSlot, readonly string[]>;
  // Available garments left out by the Weather usages alone, nearest weather
  // first: what "Voir les autres ?" offers for a row with nothing eligible.
  closest: Record<RowSlot, readonly string[]>;
  // Rows the default outfit fills (SPEC §6.3, §7 step 3): top and bottom
  // always; layers as the weather calls for them; shoes unless the day is
  // spent indoors. The user can still add any other row.
  proposedRows: Record<RowSlot, boolean>;
  // First garment of each row, coordination rule applied (SPEC §7 step 5).
  outfit: OutfitSelection;
  // The default outfit could not avoid two statement pieces.
  coordinationBroken: boolean;
}
