import { act, fireEvent, render, screen } from '@testing-library/react-native';

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
    await render(<ConfirmOutfitButton missing={null} frozen={false} onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Je porte cette tenue' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('stays findable but does nothing while a piece is missing', async () => {
    const onPress = jest.fn(() => true);
    await render(<ConfirmOutfitButton missing="bottom" frozen={false} onPress={onPress} />);
    const button = screen.getByRole('button', {
      name: 'Je porte cette tenue, indisponible : il manque un bas',
    });
    expect(button).toBeDisabled();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('is a selected « Portée aujourd’hui » pill that undoes once validated, and back after the undo', async () => {
    const onPress = jest.fn(() => true);
    const { rerender } = await render(
      <ConfirmOutfitButton missing={null} frozen={false} onPress={onPress} />,
    );
    await rerender(<ConfirmOutfitButton missing={null} frozen onPress={onPress} />);
    const pill = screen.getByRole('button', { name: 'Portée aujourd’hui, toucher pour annuler' });
    expect(pill).toBeSelected();
    // The pill shrinks back first, then the validation is undone.
    jest.useFakeTimers();
    await fireEvent.press(pill);
    await fireEvent.press(pill);
    expect(onPress).not.toHaveBeenCalled();
    await act(() => jest.runAllTimers());
    jest.useRealTimers();
    expect(onPress).toHaveBeenCalledTimes(1);

    await rerender(<ConfirmOutfitButton missing={null} frozen={false} onPress={onPress} />);
    expect(screen.getByRole('button', { name: 'Je porte cette tenue' })).not.toBeSelected();
  });

  it('stays the pill when the undo is refused', async () => {
    const onPress = jest.fn(() => false);
    await render(<ConfirmOutfitButton missing={null} frozen onPress={onPress} />);
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
