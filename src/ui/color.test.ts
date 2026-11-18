import { splitAlpha, withMinAlpha } from './color';

describe('withMinAlpha', () => {
  it('raises the alpha of a more transparent colour', () => {
    expect(withMinAlpha('rgba(250,247,240,0.55)', 0.9)).toBe('rgba(250,247,240,0.9)');
  });

  it('keeps the alpha of a colour that is already more opaque', () => {
    expect(withMinAlpha('rgba(84,58,42,0.90)', 0.22)).toBe('rgba(84,58,42,0.9)');
  });

  it('keeps an opaque colour as it is', () => {
    expect(withMinAlpha('#1E3120', 0.5)).toBe('#1E3120');
    expect(withMinAlpha('rgb(30,49,32)', 0.5)).toBe('rgba(30,49,32,1)');
  });

  it('refuses a colour it cannot read', () => {
    expect(() => withMinAlpha('forest', 0.5)).toThrow('Unsupported colour');
  });
});

describe('splitAlpha', () => {
  it('separates the alpha of an rgba colour', () => {
    expect(splitAlpha('rgba(30,49,32,0.30)')).toEqual({ color: 'rgb(30,49,32)', opacity: 0.3 });
  });

  it('leaves an opaque colour fully opaque', () => {
    expect(splitAlpha('#1E3120')).toEqual({ color: '#1E3120', opacity: 1 });
  });
});
