import { fireEvent, render, screen } from '@testing-library/react-native';

import '../../i18n';
import type { Suggestion } from '../../domain/engine';
import { initialChoice, type OutfitChoice, showRow } from './outfitChoice';
import { TodayOutfit } from './TodayOutfit';
import type { TodayPiece } from './useToday';

jest.mock(
  'react-native-reanimated',
  () => jest.requireActual('../../test/animationMocks').reanimated,
);
jest.mock('react-native-worklets', () => jest.requireActual('../../test/animationMocks').worklets);
jest.mock('react-native-gesture-handler', () => ({
  ...jest.requireActual('../../test/animationMocks').gestureHandler,
  GestureHandlerRootView: jest.requireActual('react-native').View,
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('./pieceDescription', () => ({
  pieceDescription: (piece: { label: string }) => piece.label,
}));
jest.mock('./OutfitPiece', () => ({ OutfitPiece: () => null }));

const noRows = { top: [], bottom: [], midLayer: [], outerLayer: [], shoes: [] };
const noneProposed = {
  top: false,
  bottom: false,
  midLayer: false,
  outerLayer: false,
  shoes: false,
};
const SUGGESTION: Suggestion = {
  rows: { ...noRows, midLayer: ['sweater'] },
  closest: noRows,
  proposedRows: { ...noneProposed, midLayer: true },
  outfit: {},
  coordinationBroken: false,
};
const PIECES = new Map([['sweater', { id: 'sweater', label: 'Pull écru' } as TodayPiece]]);
const SHEET = 'Couche 1, choisir parmi les couches compatibles';

function outfit(choice: OutfitChoice) {
  return (
    <TodayOutfit
      suggestion={SUGGESTION}
      pieces={PIECES}
      choice={choice}
      onChoiceChange={jest.fn()}
      emptyRows={[]}
      onAddPiece={jest.fn()}
      scale={1}
    />
  );
}

describe('TodayOutfit', () => {
  it('does not reopen the sheet of a layer that was hidden meanwhile', async () => {
    const shown = initialChoice(SUGGESTION);
    const { rerender } = await render(outfit(shown));
    await fireEvent.press(screen.getByRole('button', { name: /Pull écru/ }));
    expect(screen.getByLabelText(SHEET)).toBeTruthy();

    await rerender(outfit(showRow(shown, 'midLayer', false)));
    expect(screen.queryByLabelText(SHEET)).toBeNull();

    await rerender(outfit(shown));
    expect(screen.queryByLabelText(SHEET)).toBeNull();
  });
});
