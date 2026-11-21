import { SUBTYPES, type SubtypeKey } from '../../domain/catalogue/subtypes';
import type { Slot } from '../../domain/types';

export type TypeSectionKey = 'tops' | 'bottoms' | 'onePieces' | 'outerwear' | 'shoes';

// The type sheet's sections, in this order (Candice, 21 Nov.): the most
// photographed first. A display grouping only: the slots stay as they are.
const SHEET_SECTIONS: readonly { key: TypeSectionKey; slots: readonly Slot[] }[] = [
  { key: 'tops', slots: ['top', 'midLayer'] },
  { key: 'bottoms', slots: ['bottom'] },
  { key: 'onePieces', slots: ['onePiece'] },
  { key: 'outerwear', slots: ['outerLayer'] },
  { key: 'shoes', slots: ['shoes'] },
];

export interface TypeSection {
  key: TypeSectionKey;
  subtypes: SubtypeKey[];
}

/**
 * Every type in its section of the type sheet, under the recent types.
 * Nothing is chosen for the user.
 */
export function typeSections(): TypeSection[] {
  return SHEET_SECTIONS.map(({ key, slots }) => ({
    key,
    subtypes: SUBTYPES.filter((s) => slots.includes(s.slot)).map((s) => s.key),
  }));
}
