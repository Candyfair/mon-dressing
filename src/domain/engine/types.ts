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
  settings: EngineSettings;
  // Yesterday's outfit (validated, else probable), if any.
  yesterday: OutfitSelection | null;
}

/** The carousels of Today: one-pieces share the top row (SPEC §4.1). */
export type RowSlot = Exclude<Slot, 'onePiece'>;
export const ROW_SLOTS: readonly RowSlot[] = ['top', 'bottom', 'midLayer', 'outerLayer', 'shoes'];

export type LayerSlot = 'midLayer' | 'outerLayer';

export interface Suggestion {
  // Eligible garment ids per row, best first. Nothing eligible is hidden.
  rows: Record<RowSlot, readonly string[]>;
  // Layer slots the weather calls for (SPEC §6.3); the user can add or remove one.
  suggestedLayers: Record<LayerSlot, boolean>;
  // False on an indoor day: no shoes in the default outfit, the row stays
  // available (decided with Candice on 2026-11-15).
  shoesSuggested: boolean;
  // First garment of each row, coordination rule applied (SPEC §7 step 5).
  outfit: OutfitSelection;
  // The default outfit could not avoid two statement pieces.
  coordinationBroken: boolean;
}
