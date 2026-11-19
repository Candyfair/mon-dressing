import { act, renderHook } from '@testing-library/react-native';

import '../../i18n';
import { referenceWardrobe } from '../../domain/engine/__fixtures__/wardrobe';
import { loadEngineGarments } from '../../db/repositories/engineInputs';
import { garmentThumbnails } from '../../db/repositories/garments';
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
});
