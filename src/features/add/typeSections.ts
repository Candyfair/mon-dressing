import { SUBTYPES, type SubtypeKey } from '../../domain/catalogue/subtypes';
import type { Slot } from '../../domain/types';

// The type sheet's sections, in this order (Candice, 21 Nov.): the most
// photographed first. A display grouping only: the slots stay as they are.
const SHEET_SECTIONS = [
  { key: 'tops', slots: ['top', 'midLayer'] },
  { key: 'bottoms', slots: ['bottom'] },
  { key: 'onePieces', slots: ['onePiece'] },
  { key: 'outerwear', slots: ['outerLayer'] },
  { key: 'shoes', slots: ['shoes'] },
] as const satisfies readonly { key: string; slots: readonly Slot[] }[];

export type TypeSectionKey = (typeof SHEET_SECTIONS)[number]['key'];

export interface TypeSections {
  // The types used last; each one stays in its section too.
  recent: SubtypeKey[];
  sections: { key: TypeSectionKey; subtypes: SubtypeKey[] }[];
}

/**
 * The type sheet's tiles: the recent types, then every type in its section.
 * Nothing is chosen for the user.
 */
export function typeSections(recentSubtypes: readonly SubtypeKey[]): TypeSections {
  return {
    recent: [...recentSubtypes],
    sections: SHEET_SECTIONS.map(({ key, slots }) => ({
      key,
      subtypes: SUBTYPES.filter((s) => (slots as readonly Slot[]).includes(s.slot)).map(
        (s) => s.key,
      ),
    })),
  };
}
