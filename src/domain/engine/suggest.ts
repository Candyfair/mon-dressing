import { defaultOutfit } from './defaultOutfit';
import { isAvailable, isWithinWearLimit } from './eligibility';
import { suggestedLayers } from './layers';
import { compareRanked, type RankedGarment, rotationScore, wasWornYesterday } from './rotation';
import {
  type EngineGarment,
  type OutfitSelection,
  ROW_SLOTS,
  type RowSlot,
  type SuggestInput,
  type Suggestion,
} from './types';
import { matchUsages } from './usageFilter';

function rowOf(garment: EngineGarment): RowSlot {
  return garment.slot === 'onePiece' ? 'top' : garment.slot;
}

/**
 * The suggestion engine (SPEC §7). Pure and deterministic: everything comes
 * from the input, nothing from the clock or the database. It filters and
 * orders; it never hides an eligible garment.
 */
export function suggest(input: SuggestInput): Suggestion {
  const { date, timeZone, garments, context, weather, settings, yesterday } = input;
  const yesterdayIds = new Set(Object.values(yesterday ?? {}));
  const conditions = weather?.conditions ?? null;

  const ranked: Record<RowSlot, RankedGarment[]> = {
    top: [],
    bottom: [],
    midLayer: [],
    outerLayer: [],
    shoes: [],
  };
  for (const garment of garments) {
    // Step 1: eligible garments. The caller passes the active wardrobe only.
    if (!isAvailable(garment, date, timeZone, settings) || !isWithinWearLimit(garment)) continue;
    // Step 2: usage filter.
    const match = matchUsages(garment.usages, context, conditions);
    if (!match.passes) continue;
    ranked[rowOf(garment)].push({
      garment,
      explicitMatches: match.explicitMatches,
      wornYesterday: wasWornYesterday(garment, date, timeZone, yesterdayIds),
      score: rotationScore(garment, date, timeZone, settings.rotationPace),
    });
  }

  // Step 4: rotation order.
  const rows = {} as Record<RowSlot, readonly string[]>;
  for (const slot of ROW_SLOTS) {
    rows[slot] = ranked[slot].sort(compareRanked).map((entry) => entry.garment.id);
  }

  // Steps 3 and 5: layers, then the default outfit.
  const layers = suggestedLayers(weather);
  const { outfit, coordinationBroken } = defaultOutfit({
    rows,
    garmentsById: new Map(garments.map((garment) => [garment.id, garment])),
    suggestedLayers: layers,
    yesterday,
  });
  return { rows, suggestedLayers: layers, outfit, coordinationBroken };
}

/** More than one statement piece in an outfit: the discreet indicator (SPEC §4.5). */
export function statementConflict(
  outfit: OutfitSelection,
  garmentsById: ReadonlyMap<string, Pick<EngineGarment, 'statementPiece'>>,
): boolean {
  const ids = Object.values(outfit);
  return ids.filter((id) => garmentsById.get(id)?.statementPiece === true).length > 1;
}
