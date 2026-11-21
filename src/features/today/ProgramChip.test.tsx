import { render, screen } from '@testing-library/react-native';

import '../../i18n';
import type { DayContext } from '../../domain/types';
import { ProgramChip } from './ProgramChip';

function chip(
  commuteModes: DayContext['commuteModes'],
  activity: DayContext['activity'] = 'office',
) {
  const context: DayContext = { activity, commuteModes, occasion: 'everyday' };
  return <ProgramChip context={context} label="Label" labelScale={1} onPress={() => {}} />;
}

describe('ProgramChip', () => {
  it('is one button naming the activity and every commute mode', async () => {
    await render(chip(['walking', 'bike']));
    const button = screen.getByRole('button', {
      name: 'Programme du jour : bureau, à pied et à vélo',
    });
    expect(button.props.accessibilityHint).toBe('Changer le programme');
  });

  it('lists three modes with commas', async () => {
    await render(chip(['car', 'publicTransport', 'scooter']));
    expect(
      screen.getByRole('button', {
        name: 'Programme du jour : bureau, en voiture, en transports en commun et en trottinette',
      }),
    ).toBeTruthy();
  });

  it('names the activity alone on a day without commute', async () => {
    await render(chip([], 'remote'));
    expect(screen.getByRole('button', { name: 'Programme du jour : télétravail' })).toBeTruthy();
  });
});
