import { fireEvent, render, screen } from '@testing-library/react-native';

import '../../i18n';
import { ConfirmOutfitButton } from './ConfirmOutfitButton';

jest.mock(
  'react-native-reanimated',
  () => jest.requireActual('../../test/animationMocks').reanimated,
);
jest.mock('react-native-worklets', () => jest.requireActual('../../test/animationMocks').worklets);

describe('ConfirmOutfitButton', () => {
  it('validates a complete outfit', async () => {
    const onPress = jest.fn();
    await render(<ConfirmOutfitButton missing={null} frozen={false} onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Je porte cette tenue' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('stays findable but does nothing while a piece is missing', async () => {
    const onPress = jest.fn();
    await render(<ConfirmOutfitButton missing="bottom" frozen={false} onPress={onPress} />);
    const button = screen.getByRole('button', {
      name: 'Je porte cette tenue, indisponible : il manque un bas',
    });
    expect(button).toBeDisabled();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('is a selected lock that undoes once validated, and back after the undo', async () => {
    const onPress = jest.fn();
    const { rerender } = await render(
      <ConfirmOutfitButton missing={null} frozen={false} onPress={onPress} />,
    );
    await rerender(<ConfirmOutfitButton missing={null} frozen onPress={onPress} />);
    const lock = screen.getByRole('button', { name: 'Tenue validée, toucher pour annuler' });
    expect(lock).toBeSelected();
    await fireEvent.press(lock);
    expect(onPress).toHaveBeenCalledTimes(1);

    await rerender(<ConfirmOutfitButton missing={null} frozen={false} onPress={onPress} />);
    expect(screen.getByRole('button', { name: 'Je porte cette tenue' })).not.toBeSelected();
  });
});
