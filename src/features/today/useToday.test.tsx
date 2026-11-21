import { act, renderHook } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';

import '../../i18n';
import { referenceWardrobe } from '../../domain/engine/__fixtures__/wardrobe';
import { loadEngineGarments } from '../../db/repositories/engineInputs';
import { garmentThumbnails } from '../../db/repositories/garments';
import { saveProbableOutfit, undoValidation, validateOutfit } from '../../db/repositories/outfits';
import type { OutfitSelection } from '../../domain/engine';
import { moveTo } from './outfitChoice';
import { useToday } from './useToday';

let mockRefocus: () => void = () => undefined;

jest.mock('expo-router', () => ({
  useFocusEffect: (effect: () => void) => {
    mockRefocus = effect;
  },
}));
jest.mock('../../db/client', () => ({ db: {} }));
jest.mock('../../db/repositories/engineInputs', () => ({
  loadEngineGarments: jest.fn(),
  yesterdayOutfit: () => null,
}));
jest.mock('../../db/repositories/garments', () => ({ garmentThumbnails: jest.fn() }));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'id' }));
// The day's validated outfit, as the repository would store it.
let mockValidated: OutfitSelection | null = null;
jest.mock('../../db/repositories/outfits', () => ({
  todayOutfit: () =>
    mockValidated
      ? { status: 'validated', id: 'outfit', selection: mockValidated }
      : { status: 'none' },
  validateOutfit: jest.fn((_db: unknown, { selection }: { selection: OutfitSelection }) => {
    mockValidated = selection;
    return { ok: true };
  }),
  undoValidation: jest.fn(() => {
    mockValidated = null;
    return { ok: true };
  }),
  saveProbableOutfit: jest.fn(),
}));
jest.mock('./useDayWeather', () => {
  const { SCENARIO_SETTINGS: settings } = jest.requireActual<
    typeof import('../../domain/engine/__fixtures__/scenarios')
  >('../../domain/engine/__fixtures__/scenarios');
  const day = {
    date: '2026-11-17',
    wardrobe: { id: 'wardrobe', timeZone: 'Europe/Paris' },
    context: { activity: 'office', commuteModes: ['walking'], occasion: 'everyday' },
    settings: { ...settings, lunchOutingEnabled: false },
    forecast: null,
    weather: { weather: null, lines: null, ambience: null, indoorDay: false },
  };
  return { useDayWeather: () => day };
});

const garments = referenceWardrobe();
const first = garments[0]?.id ?? '';
const thumbnail = (photoPath: string) => ({
  id: first,
  name: 'Pull',
  subtype: 'sweater',
  photoPath,
});

async function renderToday() {
  const { result } = await renderHook(() => useToday());
  return result;
}

describe('useToday', () => {
  beforeEach(() => {
    mockValidated = null;
    jest.clearAllMocks();
    jest.mocked(loadEngineGarments).mockReturnValue(garments);
    jest.mocked(garmentThumbnails).mockReturnValue([thumbnail('original.webp')] as never);
  });

  it('keeps the suggestion and the choice when only a photo changes', async () => {
    const today = await renderToday();
    const { suggestion } = today.current;
    await act(async () => today.current.setChoice((choice) => moveTo(choice, 'top', 1)));

    jest.mocked(garmentThumbnails).mockReturnValue([thumbnail('cutout.webp')] as never);
    await act(async () => mockRefocus());

    expect(today.current.pieces.get(first)?.photo).toBe('cutout.webp');
    expect(today.current.suggestion).toBe(suggestion);
    expect(today.current.choice.index.top).toBe(1);
  });

  it('starts the choice again when the garments change', async () => {
    const today = await renderToday();
    const { suggestion } = today.current;
    await act(async () => today.current.setChoice((choice) => moveTo(choice, 'top', 1)));

    jest.mocked(loadEngineGarments).mockReturnValue(garments.slice(1));
    await act(async () => mockRefocus());

    expect(today.current.suggestion).not.toBe(suggestion);
    expect(today.current.choice.index.top).not.toBe(1);
  });

  it('ignores a gesture that belongs to the previous suggestion', async () => {
    const today = await renderToday();
    const { setChoice } = today.current;

    jest.mocked(loadEngineGarments).mockReturnValue(garments.slice(1));
    await act(async () => mockRefocus());
    const { index } = today.current.choice;
    await act(async () => setChoice((choice) => moveTo(choice, 'top', 99)));

    expect(today.current.choice.index).toEqual(index);
  });

  it('freezes the validated outfit, whatever the engine proposes next', async () => {
    const today = await renderToday();
    await act(async () => today.current.setChoice((choice) => moveTo(choice, 'top', 1)));
    const validated = today.current.outfit;

    await act(async () => today.current.validate());

    expect(validateOutfit).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ date: '2026-11-17', selection: validated }),
      expect.anything(),
    );
    expect(today.current.frozen).toBe(true);
    expect(today.current.outfit).toEqual(validated);
    expect(today.current.emptyRows).toEqual([]);
    // Nothing else to swipe to.
    expect(today.current.suggestion.rows.top).toHaveLength(1);

    // The garments change (a later open): the outfit stays.
    jest.mocked(loadEngineGarments).mockReturnValue(garments.slice(1));
    await act(async () => mockRefocus());
    expect(today.current.outfit).toEqual(validated);
  });

  it('goes back to the validated pieces after an undo', async () => {
    const today = await renderToday();
    await act(async () => today.current.setChoice((choice) => moveTo(choice, 'top', 1)));
    const validated = today.current.outfit;
    await act(async () => today.current.validate());

    await act(async () => today.current.undo());

    expect(undoValidation).toHaveBeenCalledTimes(1);
    expect(today.current.frozen).toBe(false);
    expect(today.current.outfit).toEqual(validated);
    expect(today.current.suggestion.rows.top.length).toBeGreaterThan(1);
  });

  it('keeps the bottom under a validated dress and brings it back after an undo', async () => {
    const slotOf = new Map(garments.map((garment) => [garment.id, garment.slot]));
    const today = await renderToday();
    const { rows } = today.current.suggestion;
    const dress = rows.top.findIndex((id) => slotOf.get(id) === 'onePiece');
    const top = rows.top.findIndex((id) => slotOf.get(id) === 'top');
    const bottom = rows.bottom[1];
    expect([dress, top, bottom]).not.toContain(-1);
    await act(async () =>
      today.current.setChoice((choice) => moveTo(moveTo(choice, 'bottom', 1), 'top', dress)),
    );

    await act(async () => today.current.validate());

    // The hidden bottom is drawn under the dress, but not worn.
    expect(today.current.suggestion.rows.bottom).toEqual([bottom]);
    expect(today.current.outfit.bottom).toBeUndefined();
    expect(validateOutfit).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ selection: expect.not.objectContaining({ bottom }) }),
      expect.anything(),
    );

    await act(async () => today.current.undo());
    await act(async () => today.current.setChoice((choice) => moveTo(choice, 'top', top)));
    expect(today.current.outfit.bottom).toBe(bottom);
  });

  it('validates an outfit with a top only, and keeps it as probable before that', async () => {
    const listeners: ((state: AppStateStatus) => void)[] = [];
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
      listeners.push(listener);
      return { remove: () => undefined };
    });
    jest.mocked(loadEngineGarments).mockReturnValue(garments.filter((g) => g.slot === 'top'));
    const today = await renderToday();
    const { outfit } = today.current;
    expect(Object.keys(outfit)).toEqual(['top']);
    expect(today.current.missing).toEqual(['bottom']);
    expect(today.current.noPiece).toBe(false);

    await act(async () => listeners.forEach((listener) => listener('background')));
    expect(saveProbableOutfit).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ selection: outfit }),
      expect.anything(),
    );

    expect(await act(async () => today.current.validate())).toBe(true);
    expect(validateOutfit).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ selection: outfit }),
      expect.anything(),
    );
  });

  it('validates nothing and keeps nothing without any piece', async () => {
    const listeners: ((state: AppStateStatus) => void)[] = [];
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
      listeners.push(listener);
      return { remove: () => undefined };
    });
    jest.mocked(loadEngineGarments).mockReturnValue(garments.filter((g) => g.slot === 'midLayer'));
    const today = await renderToday();
    expect(today.current.noPiece).toBe(true);

    await act(async () => listeners.forEach((listener) => listener('background')));
    expect(saveProbableOutfit).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ selection: null }),
      expect.anything(),
    );
    expect(await act(async () => today.current.validate())).toBe(false);
    expect(validateOutfit).not.toHaveBeenCalled();
  });

  it('keeps the outfit shown when the app goes to the background, unless validated', async () => {
    const listeners: ((state: AppStateStatus) => void)[] = [];
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
      listeners.push(listener);
      return { remove: () => undefined };
    });
    const today = await renderToday();
    const background = () =>
      act(async () => listeners.forEach((listener) => listener('background')));

    await background();
    expect(saveProbableOutfit).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ date: '2026-11-17', selection: today.current.outfit }),
      expect.anything(),
    );

    await act(async () => today.current.validate());
    jest.mocked(saveProbableOutfit).mockClear();
    await background();
    expect(saveProbableOutfit).not.toHaveBeenCalled();
  });
});
