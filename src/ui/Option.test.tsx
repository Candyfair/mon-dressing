import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from './Button';
import { ToggleOption } from './ToggleOption';
import { TypeTile } from './TypeTile';
import { UsageOption } from './UsageOption';

describe('ToggleOption', () => {
  it('is a switch announcing its state', async () => {
    const onToggle = jest.fn();
    await render(
      <ToggleOption label="Favori" icon="favorite" checked={false} onToggle={onToggle} />,
    );
    const option = screen.getByRole('switch', { name: 'Favori' });
    expect(option).not.toBeChecked();
    await fireEvent.press(option);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('is checked when on', async () => {
    await render(<ToggleOption label="Favori" icon="favorite" checked onToggle={jest.fn()} />);
    expect(screen.getByRole('switch', { name: 'Favori' })).toBeChecked();
  });
});

describe('UsageOption', () => {
  it('is a toggle button announcing its state', async () => {
    const onToggle = jest.fn();
    await render(<UsageOption label="Pluie" selected onToggle={onToggle} />);
    const option = screen.getByRole('button', { name: 'Pluie' });
    expect(option).toBeSelected();
    await fireEvent.press(option);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});

describe('TypeTile', () => {
  it('announces the chosen type', async () => {
    await render(
      <>
        <TypeTile label="T-shirt" selected onPress={jest.fn()} />
        <TypeTile label="Jean" selected={false} onPress={jest.fn()} />
      </>,
    );
    expect(screen.getByRole('button', { name: 'T-shirt' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'Jean' })).not.toBeSelected();
  });
});

describe('Button', () => {
  it('ignores presses while disabled', async () => {
    const onPress = jest.fn();
    await render(<Button label="Enregistrer" onPress={onPress} disabled />);
    const button = screen.getByRole('button', { name: 'Enregistrer' });
    expect(button).toBeDisabled();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});
