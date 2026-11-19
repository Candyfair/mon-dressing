import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';
import { Text } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import '../i18n';
import { animationControls, recordedGestures } from '../test/animationMocks';
import { LoopingCarousel } from './LoopingCarousel';

jest.mock('react-native-reanimated', () => jest.requireActual('../test/animationMocks').reanimated);
jest.mock('react-native-worklets', () => jest.requireActual('../test/animationMocks').worklets);
jest.mock(
  'react-native-gesture-handler',
  () => jest.requireActual('../test/animationMocks').gestureHandler,
);

const PIECES = ['Chemise blanche', 'T-shirt rayé', 'Pull col roulé'];

function Row({
  items = PIECES,
  onPress,
  locked,
}: {
  items?: string[];
  onPress?: () => void;
  locked?: boolean;
}) {
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
      locked={locked}
      accessibilityLabel={`Haut : ${items[index]}`}
    />
  );
}

const action = (actionName: string) => ({ nativeEvent: { actionName } });

interface PanHandlers {
  onStart: () => void;
  onEnd: (event: { translationX: number; velocityX: number }) => void;
}

const pan = () => recordedGestures.Pan as unknown as PanHandlers;

describe('LoopingCarousel', () => {
  const swipe = (translationX: number) =>
    act(async () => {
      pan().onStart();
      pan().onEnd({ translationX, velocityX: 0 });
    });
  const label = () => screen.getByRole('adjustable').props.accessibilityLabel;

  afterEach(() => {
    animationControls.reducedMotion = false;
    animationControls.finishTimings();
  });

  it('reports the new piece when the settle ends', async () => {
    await render(<Row />);
    await swipe(-150);
    await act(async () => animationControls.finishTimings());
    expect(label()).toBe('Haut : T-shirt rayé');
  });

  it('reports the new piece when the cross-fade ends (reduced motion)', async () => {
    animationControls.reducedMotion = true;
    await render(<Row />);
    await swipe(-150);
    await act(async () => animationControls.finishTimings());
    expect(label()).toBe('Haut : T-shirt rayé');
  });

  // Below, the timings do not end: each swipe is interrupted by the next.
  it('keeps the piece reached when a short drag interrupts a settle', async () => {
    await render(<Row />);
    await swipe(-150);
    expect(label()).toBe('Haut : Chemise blanche');
    await swipe(0);
    expect(label()).toBe('Haut : T-shirt rayé');
  });

  it('follows rapid swipes that interrupt each other', async () => {
    await render(<Row />);
    await swipe(-150);
    await swipe(-150);
    await swipe(-150);
    expect(label()).toBe('Haut : Pull col roulé');
  });

  it('puts the pieces back when the parent refuses the new index', async () => {
    let value = 0;
    const position = {
      get: () => value,
      set: (next: number) => {
        value = next;
      },
    } as unknown as SharedValue<number>;
    await render(
      <LoopingCarousel
        items={PIECES}
        index={0}
        onIndexChange={() => undefined}
        renderItem={(item) => <Text>{item}</Text>}
        step={150}
        height={200}
        position={position}
        accessibilityLabel="Haut"
      />,
    );
    await swipe(-150);
    expect(value).toBe(1);
    // The index is refused while the next drag is under way.
    await act(async () => pan().onStart());
    expect(value).toBe(0);
    await act(async () => pan().onEnd({ translationX: 0, velocityX: 0 }));
    expect(value).toBe(0);
  });

  it('keeps the piece of a cross-fade interrupted by a drag (reduced motion)', async () => {
    animationControls.reducedMotion = true;
    await render(<Row />);
    await swipe(-150);
    expect(label()).toBe('Haut : Chemise blanche');
    await swipe(-150);
    expect(label()).toBe('Haut : T-shirt rayé');
    await swipe(0);
    expect(label()).toBe('Haut : Pull col roulé');
  });

  it('wraps an index past the end of the list', async () => {
    const onIndexChange = jest.fn();
    await render(
      <LoopingCarousel
        items={PIECES}
        index={5}
        onIndexChange={onIndexChange}
        renderItem={(item) => <Text>{item}</Text>}
        step={150}
        height={200}
        accessibilityLabel="Haut"
      />,
    );
    await fireEvent(screen.getByRole('adjustable'), 'accessibilityAction', action('next'));
    expect(onIndexChange).toHaveBeenCalledWith(0);
  });

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

  it('offers no swipe action once locked', async () => {
    await render(<Row locked />);
    const row = screen.getByLabelText('Haut : Chemise blanche');
    expect(row.props.accessibilityRole).toBeUndefined();
    expect(row.props.accessibilityActions).toEqual([]);
    await fireEvent(row, 'accessibilityAction', action('next'));
    expect(screen.getByLabelText('Haut : Chemise blanche')).toBeTruthy();
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
