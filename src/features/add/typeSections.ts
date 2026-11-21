import { SUBTYPES, type SubtypeKey } from '../../domain/catalogue/subtypes';
import type { Slot } from '../../domain/types';

/** The kind of piece a missing silhouette on Today asks for (design spec 03). */
export const ADD_CATEGORIES = ['top', 'bottom', 'shoes'] as const;
export type AddCategory = (typeof ADD_CATEGORIES)[number];

// A one-piece fills the top's place, and the bottom's with it.
const CATEGORY_SLOTS: Record<AddCategory, readonly Slot[]> = {
  top: ['top', 'onePiece'],
  bottom: ['bottom'],
  shoes: ['shoes'],
};

/** A route parameter as a category; anything else is none. */
export function addCategoryOf(value: unknown): AddCategory | null {
  return ADD_CATEGORIES.find((category) => category === value) ?? null;
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
      : SUBTYPES.filter((s) => CATEGORY_SLOTS[category].includes(s.slot)).map((s) => s.key);
  const recent = recentSubtypes.filter((key) => !first.includes(key));
  const others = SUBTYPES.map((s) => s.key).filter(
    (key) => !first.includes(key) && !recent.includes(key),
  );
  return { category: first, recent, others };
}
