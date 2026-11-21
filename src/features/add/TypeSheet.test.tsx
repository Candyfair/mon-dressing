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
    <TypeSheet recentSubtypes={['tshirt', 'shirt', 'jeans']} isBusy={isBusy} onSave={onSave} />,
  );
  return onSave;
}

// A recent type has two tiles, the first one in « Récents ».
const recentTile = (name: string) => screen.getAllByRole('button', { name })[0];
const saveButton = () => screen.getByRole('button', { name: 'Enregistrer · photo suivante' });

describe('TypeSheet', () => {
  it('shows the recent types first, and again in their section', async () => {
    await renderSheet();
    expect(screen.getAllByRole('button', { name: 'T-shirt' })).toHaveLength(2);
    expect(screen.getByText('Récents')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Haut en coton' })).toBeOnTheScreen();
  });

  it('titles every section', async () => {
    await renderSheet();
    const titles = ['Hauts', 'Bas', 'Robes et combinaisons', 'Vestes et manteaux'];
    for (const title of titles) expect(screen.getByText(title)).toBeOnTheScreen();
    // « Chaussures » is the last section and one of its types.
    expect(screen.getAllByText('Chaussures')).toHaveLength(2);
  });

  it('cannot save before a type is chosen', async () => {
    const onSave = await renderSheet();
    expect(saveButton()).toBeDisabled();
    await fireEvent.press(saveButton());
    expect(onSave).not.toHaveBeenCalled();
  });

  it('cannot save while the photo is being rotated', async () => {
    const onSave = await renderSheet(jest.fn(), { isBusy: true });
    await fireEvent.press(recentTile('Jean'));
    expect(saveButton()).toBeDisabled();
    await fireEvent.press(saveButton());
    expect(onSave).not.toHaveBeenCalled();
  });

  it('saves the type alone by default: no toggle, no usage', async () => {
    const onSave = await renderSheet();
    await fireEvent.press(recentTile('Jean'));
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
    await fireEvent.press(recentTile('Chemise'));
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
    await fireEvent.press(recentTile('Jean'));
    await fireEvent.press(screen.getByRole('button', { name: 'Changer de type' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Jupe' }));
    await fireEvent.press(saveButton());
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ subtype: 'skirt' }));
  });
});
