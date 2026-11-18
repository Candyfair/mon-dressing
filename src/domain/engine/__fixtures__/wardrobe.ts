import type { Slot, Usage } from '../../types';
import type { EngineGarment } from '../types';
import { makeGarment } from './makeGarment';

// Reference wardrobe for the 10 scenarios (SPEC §3 R3): about thirty pieces
// with the kinds of usages a real wardrobe gets. Candice adjusts it to look
// like hers; ids double as readable names in the expectations.
interface Piece {
  id: string;
  slot: Slot;
  usages?: Usage[];
  favorite?: boolean;
  statement?: boolean;
}

const PIECES: Piece[] = [
  // Tops
  { id: 'teeWhite', slot: 'top' },
  { id: 'teeStripes', slot: 'top', favorite: true },
  { id: 'teeLinen', slot: 'top', usages: ['weather.hot', 'weather.mild'] },
  { id: 'tankTop', slot: 'top', usages: ['weather.hot'] },
  { id: 'shirtOxford', slot: 'top', usages: ['activity.office'] },
  {
    id: 'blouseSilk',
    slot: 'top',
    statement: true,
    usages: ['occasion.festive'],
  },
  { id: 'woolTop', slot: 'top', usages: ['weather.cool', 'weather.cold'] },
  { id: 'sportTop', slot: 'top', usages: ['activity.sport'] },
  // One-pieces
  { id: 'summerDress', slot: 'onePiece', usages: ['weather.hot', 'weather.mild'] },
  {
    id: 'blackDress',
    slot: 'onePiece',
    statement: true,
    usages: ['occasion.festive', 'occasion.ceremony'],
  },
  { id: 'dungarees', slot: 'onePiece', usages: ['activity.remote', 'activity.relax'] },
  // Bottoms
  { id: 'jeansBlue', slot: 'bottom', favorite: true },
  {
    id: 'woolTrousers',
    slot: 'bottom',
    usages: ['activity.office', 'weather.cool', 'weather.cold'],
  },
  { id: 'chinos', slot: 'bottom' },
  {
    id: 'pleatedSkirt',
    slot: 'bottom',
    statement: true,
    usages: ['commute.walking', 'commute.publicTransport', 'commute.car'],
  },
  { id: 'shorts', slot: 'bottom', usages: ['weather.hot'] },
  { id: 'sportLeggings', slot: 'bottom', usages: ['activity.sport'] },
  // Layer 1
  {
    id: 'merinoSweater',
    slot: 'midLayer',
    favorite: true,
    usages: ['weather.cool', 'weather.cold'],
  },
  { id: 'cardigan', slot: 'midLayer' },
  { id: 'sweatshirt', slot: 'midLayer', usages: ['activity.remote', 'activity.relax'] },
  { id: 'blazer', slot: 'midLayer', usages: ['activity.office', 'occasion.jobInterview'] },
  // Layer 2
  { id: 'raincoat', slot: 'outerLayer', usages: ['weather.rain'] },
  { id: 'woolCoat', slot: 'outerLayer', usages: ['weather.cold'] },
  { id: 'denimJacket', slot: 'outerLayer', usages: ['weather.cool', 'weather.mild'] },
  // Shoes
  { id: 'whiteSneakers', slot: 'shoes', favorite: true },
  { id: 'ankleBoots', slot: 'shoes', usages: ['weather.cool', 'weather.cold', 'weather.rain'] },
  { id: 'runningShoes', slot: 'shoes', usages: ['activity.sport'] },
  { id: 'sandals', slot: 'shoes', usages: ['weather.hot'] },
];

/** The reference wardrobe, every piece stored and never worn. */
export function referenceWardrobe(): EngineGarment[] {
  return PIECES.map((piece, index) =>
    makeGarment({
      id: piece.id,
      slot: piece.slot,
      usages: piece.usages ?? [],
      isFavorite: piece.favorite ?? false,
      statementPiece: piece.statement ?? false,
      // Added in this order, one minute apart: the stable tie-break.
      createdAt: new Date(Date.UTC(2026, 8, 1, 8, index)),
    }),
  );
}
