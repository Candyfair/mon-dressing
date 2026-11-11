import { themeNameFor } from './theme';

describe('themeNameFor', () => {
  it.each([
    ['dark', 'soir'],
    ['light', 'matin'],
    [null, 'matin'],
  ] as const)('maps the %s system scheme to %s', (scheme, theme) => {
    expect(themeNameFor(scheme)).toBe(theme);
  });
});
