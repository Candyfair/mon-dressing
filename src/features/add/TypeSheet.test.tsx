import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import '../../i18n';
import { TypeSheet } from './TypeSheet';

// The sheet's gesture and entering animation are not under test here.
jest.mock('../../ui/Sheet', () => ({
  Sheet: ({ children }: { children: ReactNode }) => children,
}));

async function renderSheet(onSave = jest.fn(), { isBusy = false } = {}) {
  await render(
    <TypeSheet
      category={null}
      recentSubtypes={['tshirt', 'shirt', 'jeans']}
      isBusy={isBusy}
      onSave={onSave}
    />,
  );
  return onSave;
}

const saveButton = () => screen.getByRole('button', { name: 'Enregistrer · photo suivante' });

describe('TypeSheet', () => {
  it('shows the recent types first, without repeating them in all types', async () => {
    await renderSheet();
    expect(screen.getAllByRole('button', { name: 'T-shirt' })).toHaveLength(1);
    expect(screen.getByText('Récents')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Haut en coton' })).toBeOnTheScreen();
  });

  it('puts the types of a missing piece first, under their category', async () => {
    await render(
      <TypeSheet category="bottom" recentSubtypes={['jeans']} isBusy={false} onSave={jest.fn()} />,
    );
    expect(screen.getByText('Bas')).toBeOnTheScreen();
    expect(screen.getAllByRole('button', { name: 'Jean' })).toHaveLength(1);
    // The only recent type is a bottom: no recent section is left.
    expect(screen.queryByText('Récents')).not.toBeOnTheScreen();
  });

  it('cannot save before a type is chosen', async () => {
    const onSave = await renderSheet();
    expect(saveButton()).toBeDisabled();
    await fireEvent.press(saveButton());
    expect(onSave).not.toHaveBeenCalled();
  });

  it('cannot save while the photo is being rotated', async () => {
    const onSave = await renderSheet(jest.fn(), { isBusy: true });
    await fireEvent.press(screen.getByRole('button', { name: 'Jean' }));
    expect(saveButton()).toBeDisabled();
    await fireEvent.press(saveButton());
    expect(onSave).not.toHaveBeenCalled();
  });

  it('saves the type alone by default: no toggle, no usage', async () => {
    const onSave = await renderSheet();
    await fireEvent.press(screen.getByRole('button', { name: 'Jean' }));
    expect(screen.getByRole('header', { name: 'Jean' })).toBeOnTheScreen();
    await fireEvent.press(saveButton());
    expect(onSave).toHaveBeenCalledWith({
      subtype: 'jeans',
      isFavorite: false,
      statementPiece: false,
      needsIroning: false,
      usages: [],
    });
  });

  it('saves the chosen toggles and usages', async () => {
    const onSave = await renderSheet();
    await fireEvent.press(screen.getByRole('button', { name: 'Chemise' }));
    await fireEvent.press(screen.getByRole('switch', { name: 'Se repasse' }));
    await fireEvent.press(screen.getByRole('button', { name: /Plus de détails/ }));
    await fireEvent.press(screen.getByRole('button', { name: 'Pluie' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Bureau' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Bureau' }));
    await fireEvent.press(saveButton());
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ subtype: 'shirt', needsIroning: true, usages: ['weather.rain'] }),
    );
  });

  it('lets the type be changed after it was chosen', async () => {
    const onSave = await renderSheet();
    await fireEvent.press(screen.getByRole('button', { name: 'Jean' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Changer de type' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Jupe' }));
    await fireEvent.press(saveButton());
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ subtype: 'skirt' }));
  });
});
