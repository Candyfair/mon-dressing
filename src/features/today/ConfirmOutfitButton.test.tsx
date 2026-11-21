import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { AccessibilityInfo } from 'react-native';

import '../../i18n';
import { ConfirmOutfitButton } from './ConfirmOutfitButton';

jest.mock(
  'react-native-reanimated',
  () => jest.requireActual('../../test/animationMocks').reanimated,
);
jest.mock('react-native-worklets', () => jest.requireActual('../../test/animationMocks').worklets);

describe('ConfirmOutfitButton', () => {
  it('validates a complete outfit', async () => {
    const onPress = jest.fn(() => true);
    await render(
      <ConfirmOutfitButton
        missing={[]}
        empty={false}
        frozen={false}
        onPress={onPress}
        lift={0}
        centre={0}
        room={300}
        onRefused={() => undefined}
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Je porte cette tenue' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('asks first on an incomplete outfit, then validates on a second tap', async () => {
    const onPress = jest.fn(() => true);
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    await render(
      <ConfirmOutfitButton
        missing={['top', 'bottom']}
        empty={false}
        frozen={false}
        onPress={onPress}
        lift={0}
        centre={0}
        room={300}
        onRefused={() => undefined}
      />,
    );
    const button = screen.getByRole('button', {
      name: 'Je porte cette tenue, il manque un haut et un bas',
    });
    expect(button).toBeEnabled();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
    const question = 'Il manque un haut et un bas · Valider quand même ?';
    expect(announce).toHaveBeenCalledWith(question);
    await fireEvent.press(screen.getByRole('button', { name: question }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('folds the question back without a second tap', async () => {
    const onPress = jest.fn(() => true);
    jest.useFakeTimers();
    await render(
      <ConfirmOutfitButton
        missing={['bottom']}
        empty={false}
        frozen={false}
        onPress={onPress}
        lift={0}
        centre={0}
        room={300}
        onRefused={() => undefined}
      />,
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Je porte cette tenue, il manque un bas' }),
    );
    expect(
      screen.getByRole('button', { name: 'Il manque un bas · Valider quand même ?' }),
    ).toBeTruthy();
    await act(() => jest.advanceTimersByTime(4000));
    jest.useRealTimers();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Je porte cette tenue, il manque un bas' }),
    );
    expect(onPress).not.toHaveBeenCalled();
  });

  it('stays findable and only points at what is missing without any piece', async () => {
    const onPress = jest.fn(() => true);
    const onRefused = jest.fn();
    await render(
      <ConfirmOutfitButton
        missing={['top', 'bottom']}
        empty
        frozen={false}
        onPress={onPress}
        lift={0}
        centre={0}
        room={300}
        onRefused={onRefused}
      />,
    );
    const button = screen.getByRole('button', {
      name: 'Validation de la tenue impossible, aucune pièce sélectionnée',
    });
    expect(button).toBeDisabled();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(onRefused).toHaveBeenCalledTimes(1);
  });

  it('is a selected « Portée aujourd’hui » pill that undoes once validated, and back after the undo', async () => {
    const onPress = jest.fn(() => true);
    jest.useFakeTimers();
    const { rerender } = await render(
      <ConfirmOutfitButton
        missing={[]}
        empty={false}
        frozen={false}
        onPress={onPress}
        lift={0}
        centre={0}
        room={300}
        onRefused={() => undefined}
      />,
    );
    await rerender(
      <ConfirmOutfitButton
        missing={[]}
        empty={false}
        frozen
        onPress={onPress}
        lift={0}
        centre={0}
        room={300}
        onRefused={() => undefined}
      />,
    );
    const pill = screen.getByRole('button', { name: 'Portée aujourd’hui, toucher pour annuler' });
    expect(pill).toBeSelected();
    // Until the pill is in place, a tap does nothing.
    await fireEvent.press(pill);
    await act(() => jest.runAllTimers());
    expect(onPress).not.toHaveBeenCalled();
    // The pill shrinks back first, then the validation is undone.
    await fireEvent.press(pill);
    await fireEvent.press(pill);
    expect(onPress).not.toHaveBeenCalled();
    await act(() => jest.runAllTimers());
    jest.useRealTimers();
    expect(onPress).toHaveBeenCalledTimes(1);

    await rerender(
      <ConfirmOutfitButton
        missing={[]}
        empty={false}
        frozen={false}
        onPress={onPress}
        lift={0}
        centre={0}
        room={300}
        onRefused={() => undefined}
      />,
    );
    expect(screen.getByRole('button', { name: 'Je porte cette tenue' })).not.toBeSelected();
  });

  it('stays the pill when the undo is refused', async () => {
    const onPress = jest.fn(() => false);
    await render(
      <ConfirmOutfitButton
        missing={[]}
        empty={false}
        frozen
        onPress={onPress}
        lift={0}
        centre={0}
        room={300}
        onRefused={() => undefined}
      />,
    );
    jest.useFakeTimers();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Portée aujourd’hui, toucher pour annuler' }),
    );
    await act(() => jest.runAllTimers());
    // A second tap tries again.
    await fireEvent.press(
      screen.getByRole('button', { name: 'Portée aujourd’hui, toucher pour annuler' }),
    );
    await act(() => jest.runAllTimers());
    jest.useRealTimers();
    expect(onPress).toHaveBeenCalledTimes(2);
  });
});
