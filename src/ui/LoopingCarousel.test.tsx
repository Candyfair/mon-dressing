import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';
import { Text } from 'react-native';

import '../i18n';
import { LoopingCarousel } from './LoopingCarousel';

jest.mock('react-native-reanimated', () => jest.requireActual('../test/animationMocks').reanimated);
jest.mock('react-native-worklets', () => jest.requireActual('../test/animationMocks').worklets);
jest.mock(
  'react-native-gesture-handler',
  () => jest.requireActual('../test/animationMocks').gestureHandler,
);

const PIECES = ['Chemise blanche', 'T-shirt rayé', 'Pull col roulé'];

function Row({ items = PIECES, onPress }: { items?: string[]; onPress?: () => void }) {
  const [index, setIndex] = useState(0);
  return (
    <LoopingCarousel
      items={items}
      index={index}
      onIndexChange={setIndex}
      renderItem={(item) => <Text>{item}</Text>}
      step={150}
      height={200}
      onPress={onPress}
      accessibilityLabel={`Haut : ${items[index]}`}
    />
  );
}

const action = (actionName: string) => ({ nativeEvent: { actionName } });

describe('LoopingCarousel', () => {
  it('exposes the swipe as "Pièce suivante" and "Pièce précédente"', async () => {
    await render(<Row />);
    const row = screen.getByRole('adjustable', { name: 'Haut : Chemise blanche' });
    expect(row.props.accessibilityActions).toEqual(
      expect.arrayContaining([
        { name: 'next', label: 'Pièce suivante' },
        { name: 'previous', label: 'Pièce précédente' },
      ]),
    );
  });

  it('loops forward past the last piece and backward before the first', async () => {
    await render(<Row />);
    const row = () => screen.getByRole('adjustable');

    await fireEvent(row(), 'accessibilityAction', action('previous'));
    expect(row()).toHaveAccessibleName('Haut : Pull col roulé');

    await fireEvent(row(), 'accessibilityAction', action('next'));
    expect(row()).toHaveAccessibleName('Haut : Chemise blanche');

    // The iOS adjustable gesture (swipe up) goes to the next piece too.
    await fireEvent(row(), 'accessibilityAction', action('increment'));
    expect(row()).toHaveAccessibleName('Haut : T-shirt rayé');
  });

  it('stays on a single piece', async () => {
    await render(<Row items={['Jean brut']} />);
    const row = screen.getByRole('adjustable');
    await fireEvent(row, 'accessibilityAction', action('next'));
    expect(row).toHaveAccessibleName('Haut : Jean brut');
  });

  it('is a button that activates like a tap when it opens something', async () => {
    const onPress = jest.fn();
    await render(<Row onPress={onPress} />);
    const row = screen.getByRole('button', { name: 'Haut : Chemise blanche' });
    await fireEvent(row, 'accessibilityAction', action('activate'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders the current piece and its neighbours, hidden from screen readers', async () => {
    await render(<Row />);
    // Five slots on a three-piece loop: each piece is rendered at least once.
    for (const piece of PIECES) {
      expect(screen.getAllByText(piece, { includeHiddenElements: true }).length).toBeGreaterThan(0);
      expect(screen.queryByText(piece)).toBeNull();
    }
  });
});
