import { withAlpha } from './color';

describe('withAlpha', () => {
  it('replaces the alpha of an rgba colour', () => {
    expect(withAlpha('rgba(250,247,240,0.55)', 0.9)).toBe('rgba(250,247,240,0.9)');
  });

  it('adds an alpha to a hex colour', () => {
    expect(withAlpha('#1E3120', 0.5)).toBe('rgba(30,49,32,0.5)');
  });

  it('refuses a colour it cannot read', () => {
    expect(() => withAlpha('forest', 0.5)).toThrow('Unsupported colour');
  });
});
