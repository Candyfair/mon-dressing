import type { Suggestion } from '../../domain/engine';
import type { Slot } from '../../domain/types';
import {
  addLayer,
  choiceFromSelection,
  chosenOutfit,
  emptyRows,
  frozenSuggestion,
  hasAnyPiece,
  hiddenBottom,
  initialChoice,
  laundryRows,
  missingPieces,
  moveTo,
  neverAddedRows,
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
    expect(missingPieces({ top: 'tee', bottom: 'jeans' })).toEqual([]);
    expect(missingPieces({ onePiece: 'dress' })).toEqual([]);
    expect(missingPieces({ top: 'tee' })).toEqual(['bottom']);
    expect(missingPieces({ bottom: 'jeans' })).toEqual(['top']);
    expect(missingPieces({ shoes: 'boots' })).toEqual(['top', 'bottom']);
  });

  it('counts any piece, a layer alone included, as enough to validate', () => {
    expect(hasAnyPiece({})).toBe(false);
    expect(hasAnyPiece({ top: undefined })).toBe(false);
    expect(hasAnyPiece({ midLayer: 'jumper' })).toBe(true);
  });

  it('names the outfit rows the wardrobe has never had a garment for', () => {
    const engine = suggestion();
    expect(neverAddedRows(engine, [])).toEqual(['top', 'bottom', 'shoes']);
    expect(neverAddedRows(engine, [{ slot: 'top' }])).toEqual(['bottom', 'shoes']);
    expect(neverAddedRows(engine, [{ slot: 'top' }, { slot: 'bottom' }])).toEqual(['shoes']);
    expect(neverAddedRows(engine, slots.values())).toEqual([]);
    // A one-piece is a top and a bottom; layers are not asked for.
    expect(neverAddedRows(engine, [{ slot: 'onePiece' }, { slot: 'midLayer' }])).toEqual(['shoes']);
    // Shoes the day does not propose are not asked for.
    const indoor = suggestion({ proposedRows: { ...engine.proposedRows, shoes: false } });
    expect(neverAddedRows(indoor, [])).toEqual(['top', 'bottom']);
  });

  it('names the empty rows whose garments are all unavailable', () => {
    const garments = [
      { slot: 'top' as const, available: true },
      { slot: 'bottom' as const, available: false },
      { slot: 'bottom' as const, available: false },
    ];
    const available = (garment: { available: boolean }) => garment.available;
    // Shoes were never added: a silhouette, not the laundry.
    expect(laundryRows(['bottom', 'shoes'], garments, available)).toEqual(['bottom']);
    // One clean bottom is enough for the row not to be at the laundry.
    const oneClean = [...garments, { slot: 'bottom' as const, available: true }];
    expect(laundryRows(['bottom'], oneClean, available)).toEqual([]);
    // A dirty dress lives in the top row: no bottom is at the laundry.
    expect(
      laundryRows(['top', 'bottom'], [{ slot: 'onePiece', available: false }], available),
    ).toEqual(['top']);
    // A clean dress does not hide that every bottom is at the laundry.
    const cleanDress = [...garments, { slot: 'onePiece' as const, available: true }];
    expect(laundryRows(['bottom'], cleanDress, available)).toEqual(['bottom']);
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
    expect(missingPieces(chosenOutfit(choice, engine, slots))).toEqual(['top']);

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
    const frozen = frozenSuggestion({
      selection: { onePiece: 'dress', midLayer: 'jumper', shoes: 'boots' },
      hiddenBottom: null,
    });
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
      selection: { top: 'shirt', bottom: 'skirt', midLayer: 'jumper' },
      hiddenBottom: null,
    });

    expect(chosenOutfit(choice, suggestion(), slots)).toEqual({
      top: 'shirt',
      bottom: 'skirt',
      midLayer: 'jumper',
    });
  });

  it('falls back to the engine where a validated piece is no longer offered', () => {
    const choice = choiceFromSelection(suggestion(), {
      selection: { top: 'gone', bottom: 'skirt', shoes: 'boots' },
      hiddenBottom: null,
    });

    expect(chosenOutfit(choice, suggestion(), slots)).toEqual({
      top: 'tee',
      bottom: 'skirt',
      shoes: 'boots',
    });
  });

  it('keeps the bottom under a validated dress, not worn, and brings it back after an undo', () => {
    const engine = suggestion();
    const underDress = moveTo(moveTo(initialChoice(engine), 'bottom', 1), 'top', 1);
    const kept = {
      selection: chosenOutfit(underDress, engine, slots),
      hiddenBottom: hiddenBottom(underDress, engine, slots),
    };
    expect(kept).toEqual({
      selection: { onePiece: 'dress', shoes: 'boots' },
      hiddenBottom: 'skirt',
    });

    const frozen = frozenSuggestion(kept);
    const frozenChoice = initialChoice(frozen);
    expect(frozen.rows.bottom).toEqual(['skirt']);
    expect(wearsOnePiece(frozenChoice, frozen, slots)).toBe(true);
    expect(chosenOutfit(frozenChoice, frozen, slots)).toEqual(kept.selection);

    // After the undo, swiping the dress away shows the skirt again.
    const undone = moveTo(choiceFromSelection(engine, kept), 'top', 2);
    expect(chosenOutfit(undone, engine, slots)).toEqual({
      top: 'shirt',
      bottom: 'skirt',
      shoes: 'boots',
    });
  });

  it('keeps no bottom when the outfit has no dress', () => {
    const engine = suggestion();
    expect(hiddenBottom(initialChoice(engine), engine, slots)).toBeNull();
  });
});
