import { render, screen } from '@testing-library/react-native';

import '../../i18n';
import type { DayContext } from '../../domain/types';
import { ProgramChip } from './ProgramChip';

function chip(commuteModes: DayContext['commuteModes'], label = 'Bureau') {
  const context = { activity: 'office', commuteModes, occasion: 'everyday' } as DayContext;
  return <ProgramChip context={context} label={label} labelScale={1} onPress={() => {}} />;
}

describe('ProgramChip', () => {
  it('is one button naming the activity and every commute mode', async () => {
    await render(chip(['walking', 'bike']));
    const button = screen.getByRole('button', {
      name: 'Programme du jour : bureau, à pied et à vélo',
    });
    expect(button.props.accessibilityHint).toBe('Changer le programme');
  });

  it('lists three modes with commas, and the activity alone without commute', async () => {
    const { rerender } = await render(chip(['car', 'publicTransport', 'scooter']));
    expect(
      screen.getByRole('button', {
        name: 'Programme du jour : bureau, en voiture, en transports en commun et en trottinette',
      }),
    ).toBeTruthy();
    await rerender(chip([], 'Télétravail'));
    expect(screen.getByRole('button', { name: 'Programme du jour : télétravail' })).toBeTruthy();
  });
});
