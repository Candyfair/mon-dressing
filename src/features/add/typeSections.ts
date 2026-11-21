import { SUBTYPES, type SubtypeKey } from '../../domain/catalogue/subtypes';
import { OUTFIT_ROW_SLOTS, OUTFIT_ROWS, type OutfitRow } from '../../domain/catalogue/outfitRows';

/** The kind of piece a missing silhouette on Today asks for (design spec 03). */
export type AddCategory = OutfitRow;

/** A route parameter as a category; anything else is none. */
export function addCategoryOf(value: unknown): AddCategory | null {
  return OUTFIT_ROWS.find((category) => category === value) ?? null;
}

export interface TypeSections {
  // The types of the category asked for, first; empty without one.
  category: SubtypeKey[];
  recent: SubtypeKey[];
  others: SubtypeKey[];
}

/**
 * The type sheet's tiles, each type once: the category asked for, then the
 * recent types, then all the others. Nothing is chosen for the user.
 */
export function typeSections(
  category: AddCategory | null,
  recentSubtypes: readonly SubtypeKey[],
): TypeSections {
  const first =
    category === null
      ? []
      : SUBTYPES.filter((s) => OUTFIT_ROW_SLOTS[category].includes(s.slot)).map((s) => s.key);
  const recent = recentSubtypes.filter((key) => !first.includes(key));
  const others = SUBTYPES.map((s) => s.key).filter(
    (key) => !first.includes(key) && !recent.includes(key),
  );
  return { category: first, recent, others };
}
