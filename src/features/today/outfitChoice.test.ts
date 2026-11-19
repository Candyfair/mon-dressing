import type { Suggestion } from '../../domain/engine';
import type { Slot } from '../../domain/types';
import {
  addLayer,
  choiceFromSelection,
  chosenOutfit,
  emptyRows,
  frozenSuggestion,
  initialChoice,
  missingPiece,
  moveTo,
  nextLayer,
  onePieceShare,
  showRow,
  shownLayers,
  wearsOnePiece,
  widenableRows,
  widenRows,
} from './outfitChoice';

const slots = new Map<string, { slot: Slot }>([
  ['tee', { slot: 'top' }],
  ['shirt', { slot: 'top' }],
  ['dress', { slot: 'onePiece' }],
  ['jeans', { slot: 'bottom' }],
  ['skirt', { slot: 'bottom' }],
  ['jumper', { slot: 'midLayer' }],
  ['boots', { slot: 'shoes' }],
]);

function suggestion(overrides: Partial<Suggestion> = {}): Suggestion {
  return {
    rows: {
      top: ['tee', 'dress', 'shirt'],
      bottom: ['jeans', 'skirt'],
      midLayer: ['jumper'],
      outerLayer: [],
      shoes: ['boots'],
    },
    closest: { top: [], bottom: [], midLayer: [], outerLayer: [], shoes: [] },
    proposedRows: { top: true, bottom: true, midLayer: false, outerLayer: false, shoes: true },
    outfit: { top: 'tee', bottom: 'jeans', shoes: 'boots' },
    coordinationBroken: false,
    ...overrides,
  };
}

describe('outfit choice', () => {
  it("starts from the engine's outfit, even when it is not first in its row", () => {
    const engine = suggestion({ outfit: { top: 'shirt', bottom: 'skirt', shoes: 'boots' } });
    const choice = initialChoice(engine);
    expect(choice.index).toMatchObject({ top: 2, bottom: 1, shoes: 0 });
    expect(chosenOutfit(choice, engine, slots)).toEqual({
      top: 'shirt',
      bottom: 'skirt',
      shoes: 'boots',
    });
  });

  it('shows only the proposed rows that have garments', () => {
    const choice = initialChoice(suggestion());
    expect(choice.shown).toEqual({
      top: true,
      bottom: true,
      midLayer: false,
      outerLayer: false,
      shoes: true,
    });
  });

  it('hides the bottom under a dress and brings the same bottom back after it', () => {
    const engine = suggestion();
    const onSkirt = moveTo(initialChoice(engine), 'bottom', 1);
    const onDress = moveTo(onSkirt, 'top', 1);
    expect(wearsOnePiece(onDress, engine, slots)).toBe(true);
    expect(chosenOutfit(onDress, engine, slots)).toEqual({ onePiece: 'dress', shoes: 'boots' });
    const backOnTop = moveTo(onDress, 'top', 2);
    expect(chosenOutfit(backOnTop, engine, slots).bottom).toBe('skirt');
  });

  it('starts without a bottom when the first proposal is a dress', () => {
    const engine = suggestion({ outfit: { onePiece: 'dress', shoes: 'boots' } });
    expect(chosenOutfit(initialChoice(engine), engine, slots)).toEqual({
      onePiece: 'dress',
      shoes: 'boots',
    });
  });

  it('waits for a top and a bottom, or a one-piece', () => {
    expect(missingPiece({ top: 'tee', bottom: 'jeans' })).toBeNull();
    expect(missingPiece({ onePiece: 'dress' })).toBeNull();
    expect(missingPiece({ top: 'tee' })).toBe('bottom');
    expect(missingPiece({ bottom: 'jeans' })).toBe('top');
  });

  it('adds the first layer that has garments, then removes it', () => {
    const engine = suggestion();
    const choice = initialChoice(engine);
    expect(nextLayer(choice, engine)).toBe('midLayer');
    const layered = showRow(choice, 'midLayer', true);
    expect(shownLayers(layered)).toEqual(['midLayer']);
    expect(nextLayer(layered, engine)).toBeNull();
    expect(chosenOutfit(layered, engine, slots).midLayer).toBe('jumper');
    expect(shownLayers(showRow(layered, 'midLayer', false))).toEqual([]);
  });

  it('offers the closest pieces of an empty row, once asked for', () => {
    const base = suggestion();
    const engine = suggestion({
      rows: { ...base.rows, top: [] },
      closest: { ...base.closest, top: ['shirt', 'dress'] },
      outfit: { bottom: 'jeans', shoes: 'boots' },
    });
    const choice = initialChoice(engine);
    expect(emptyRows(choice, engine, slots)).toEqual(['top']);
    expect(widenableRows(choice, engine, slots)).toEqual(['top']);
    expect(missingPiece(chosenOutfit(choice, engine, slots))).toBe('top');

    const widened = widenRows(choice, ['top']);
    expect(emptyRows(widened, engine, slots)).toEqual([]);
    expect(chosenOutfit(widened, engine, slots).top).toBe('shirt');
    expect(chosenOutfit(moveTo(widened, 'top', 1), engine, slots)).toEqual({
      onePiece: 'dress',
      shoes: 'boots',
    });
  });

  it('keeps an empty row without closest pieces as a plain slot', () => {
    const base = suggestion();
    const engine = suggestion({ rows: { ...base.rows, shoes: [] } });
    const choice = initialChoice(engine);
    expect(emptyRows(choice, engine, slots)).toEqual(['shoes']);
    expect(widenableRows(choice, engine, slots)).toEqual([]);
  });

  it('does not count the bottom as empty under a dress', () => {
    const base = suggestion();
    const engine = suggestion({
      rows: { ...base.rows, top: ['dress'], bottom: [] },
      outfit: { onePiece: 'dress', shoes: 'boots' },
    });
    expect(emptyRows(initialChoice(engine), engine, slots)).toEqual([]);
  });

  it('adds a second layer from its closest pieces when none is eligible', () => {
    const base = suggestion();
    const engine = suggestion({ closest: { ...base.closest, outerLayer: ['jumper'] } });
    const layered = showRow(initialChoice(engine), 'midLayer', true);
    expect(nextLayer(layered, engine)).toBe('outerLayer');
    const both = addLayer(layered, engine, 'outerLayer');
    expect(shownLayers(both)).toEqual(['midLayer', 'outerLayer']);
    expect(chosenOutfit(both, engine, slots).midLayer).toBe('jumper');
    expect(nextLayer(both, engine)).toBeNull();
  });

  it('follows the swipe between a top and a one-piece, around the loop', () => {
    const onePieces = [false, true, false];
    expect(onePieceShare(0, onePieces)).toBe(0);
    expect(onePieceShare(0.25, onePieces)).toBe(0.25);
    expect(onePieceShare(1, onePieces)).toBe(1);
    expect(onePieceShare(1.5, onePieces)).toBe(0.5);
    expect(onePieceShare(-2, onePieces)).toBe(1);
    expect(onePieceShare(4, onePieces)).toBe(1);
    expect(onePieceShare(1, [])).toBe(0);
  });
});

describe('frozen outfit', () => {
  it('draws the validated outfit with one piece per row and nothing to add', () => {
    const frozen = frozenSuggestion({ onePiece: 'dress', midLayer: 'jumper', shoes: 'boots' });
    const choice = initialChoice(frozen);

    expect(frozen.rows).toEqual({
      top: ['dress'],
      bottom: [],
      midLayer: ['jumper'],
      outerLayer: [],
      shoes: ['boots'],
    });
    expect(chosenOutfit(choice, frozen, slots)).toEqual({
      onePiece: 'dress',
      midLayer: 'jumper',
      shoes: 'boots',
    });
    expect(nextLayer(choice, frozen)).toBeNull();
    expect(emptyRows(choice, frozen, slots)).toEqual([]);
  });

  it('goes back to the validated pieces on the engine rows after an undo', () => {
    const choice = choiceFromSelection(suggestion(), {
      top: 'shirt',
      bottom: 'skirt',
      midLayer: 'jumper',
    });

    expect(chosenOutfit(choice, suggestion(), slots)).toEqual({
      top: 'shirt',
      bottom: 'skirt',
      midLayer: 'jumper',
    });
  });

  it('falls back to the engine where a validated piece is no longer offered', () => {
    const choice = choiceFromSelection(suggestion(), {
      top: 'gone',
      bottom: 'skirt',
      shoes: 'boots',
    });

    expect(chosenOutfit(choice, suggestion(), slots)).toEqual({
      top: 'tee',
      bottom: 'skirt',
      shoes: 'boots',
    });
  });
});
