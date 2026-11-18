import { fireEvent, render, screen } from '@testing-library/react-native';

import '../../i18n';
import { LayerSheet } from './LayerSheet';
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

const piece = (id: string, label: string) => [id, { id, label } as TodayPiece] as const;
const PIECES = new Map([piece('a', 'Pull écru'), piece('b', 'Gilet gris')]);

function renderSheet(onRemove = jest.fn(), onIndexChange = jest.fn()) {
  return render(
    <LayerSheet
      layerNumber={1}
      garments={['a', 'b']}
      pieces={PIECES}
      index={1}
      onIndexChange={onIndexChange}
      onRemove={onRemove}
      onClose={jest.fn()}
    />,
  );
}

describe('LayerSheet', () => {
  it('names the current piece and its position in the cycle', async () => {
    await renderSheet();
    expect(screen.getByLabelText('Gilet gris, 2 sur 2')).toBeTruthy();
    expect(screen.getByLabelText('Couche 2 sur 2')).toBeTruthy();
    expect(screen.getByLabelText('Couche 1, choisir parmi les couches compatibles')).toBeTruthy();
  });

  it('removes the layer from its button', async () => {
    const onRemove = jest.fn();
    await renderSheet(onRemove);
    await fireEvent.press(screen.getByRole('button', { name: 'Retirer cette couche' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
