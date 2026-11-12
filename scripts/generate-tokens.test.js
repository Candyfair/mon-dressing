const fs = require('node:fs');
const processBoxShadow = require('react-native/Libraries/StyleSheet/processBoxShadow').default;

const { buildTokens, OUTPUT, readSource, render } = require('./generate-tokens');

function source(colorTokens) {
  const empty = { tokens: [] };
  return {
    version: 'test',
    color: { themes: [{ id: 'matin' }, { id: 'soir' }], tokens: colorTokens },
    shadow: empty,
    spacing: empty,
    radius: empty,
    size: empty,
    blur: empty,
    opacity: empty,
    type: { families: {}, groups: [] },
  };
}

describe('generate-tokens', () => {
  it('keeps the committed tokens.ts in sync with tokens.json', async () => {
    expect(fs.readFileSync(OUTPUT, 'utf8')).toBe(await render(readSource()));
  });

  it('resolves references per theme, through several levels', () => {
    const { themes } = buildTokens(
      source([
        { name: 'forest', value: '#2F4A2B' },
        { name: 'mustard', value: '#D8A93B' },
        { name: 'select', value: { matin: '{forest}', soir: '{mustard}' } },
        { name: 'select-edge', value: '{select}' },
      ]),
    );

    expect(themes.matin.colors.selectEdge).toBe('#2F4A2B');
    expect(themes.soir.colors.selectEdge).toBe('#D8A93B');
  });

  it('rejects an unknown reference', () => {
    expect(() => buildTokens(source([{ name: 'ink', value: '{missing}' }]))).toThrow(
      'Unknown token reference: {missing}',
    );
  });

  it('rejects a circular reference', () => {
    expect(() =>
      buildTokens(
        source([
          { name: 'a', value: '{b}' },
          { name: 'b', value: '{a}' },
        ]),
      ),
    ).toThrow('Circular token reference: a → b → a');
  });

  it('rejects a letter spacing that is not in em', () => {
    const tokens = source([]);
    tokens.type = {
      families: { text: '"Instrument Sans", sans-serif' },
      groups: [
        {
          family: 'text',
          styles: [
            {
              name: 'chip',
              fontSize: '13px',
              lineHeight: 1,
              fontWeight: 600,
              letterSpacing: '1px',
            },
          ],
        },
      ],
    };
    expect(() => buildTokens(tokens)).toThrow('Expected an em value, got "1px"');
  });

  it('converts sizes and typography to points', () => {
    const { size, typography, fontFamilies } = buildTokens(readSource());

    expect(size.sizeTap).toBe(44);
    expect(size.tileWidth).toBe(165.5);
    expect(fontFamilies).toEqual({ display: 'Space Grotesk', text: 'Instrument Sans' });
    // 82px, line-height 0.82, letter-spacing -0.04em.
    expect(typography.temperature).toEqual({
      fontFamily: 'Space Grotesk',
      fontSize: 82,
      lineHeight: 67.24,
      fontWeight: '500',
      letterSpacing: -3.28,
    });
    // Explicit px line height, no letter spacing.
    expect(typography.weatherLine).toEqual({
      fontFamily: 'Instrument Sans',
      fontSize: 13,
      lineHeight: 16,
      fontWeight: '400',
    });
  });

  it('only emits shadows React Native can parse', () => {
    const { themes } = buildTokens(readSource());

    for (const theme of Object.values(themes)) {
      for (const [name, shadow] of Object.entries(theme.shadows)) {
        const parsed = processBoxShadow(shadow);
        expect({ name, parsed: shadow === 'none' || parsed.length > 0 }).toEqual({
          name,
          parsed: true,
        });
      }
    }
  });
});
