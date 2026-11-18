import i18n from '../../i18n';
import { pieceDescription } from './pieceDescription';

const t = i18n.t.bind(i18n);
const plain = {
  label: 'Pull mérinos écru',
  statementPiece: false,
  location: 'stored',
  wearCount: 0,
  maxWears: 10,
} as const;

describe('pieceDescription', () => {
  it('names a stored, unworn piece by its name only', () => {
    expect(pieceDescription(plain, t)).toBe('Pull mérinos écru');
  });

  it('adds where it is and how often it was worn, as in the spec', () => {
    expect(pieceDescription({ ...plain, location: 'airing', wearCount: 3 }, t)).toBe(
      'Pull mérinos écru, au balcon, porté 3 fois sur 10',
    );
  });

  it('says a statement piece, and no wear count for shoes', () => {
    expect(
      pieceDescription({ ...plain, statementPiece: true, wearCount: 4, maxWears: null }, t),
    ).toBe('Pull mérinos écru, pièce forte');
  });
});
