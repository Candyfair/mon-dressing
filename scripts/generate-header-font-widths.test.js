const fs = require('node:fs');

const { OUTPUT, render } = require('./generate-header-font-widths');

describe('generate-header-font-widths', () => {
  it('keeps the committed widths in sync with the bundled fonts', async () => {
    expect(fs.readFileSync(OUTPUT, 'utf8')).toBe(await render());
  });
});
