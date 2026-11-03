const { findViolations } = require('./check-lifecycle-writes');

function diffOf(path, ...lines) {
  return [`+++ b/${path}`, ...lines.map((line) => `+${line}`)].join('\n');
}

describe('findViolations', () => {
  it.each([
    ['object property', 'wearCount: 0,'],
    ['assignment', 'garment.location = "dirty";'],
    ['increment', 'garment.wearCount++;'],
    ['shorthand in a set call', 'db.update(garments).set({ toIron }).run();'],
    ['locationSince', 'locationSince: now,'],
  ])('flags a %s outside the lifecycle module', (_name, code) => {
    expect(findViolations(diffOf('src/features/laundry/useLaundry.ts', code))).toEqual([
      { path: 'src/features/laundry/useLaundry.ts', code },
    ]);
  });

  it.each([
    'src/domain/lifecycle/transitions.ts',
    'src/db/schema.ts',
    'src/db/migrations/0001_init.ts',
    'src/features/laundry/useLaundry.test.ts',
    'src/domain/engine/__fixtures__/rainy.ts',
  ])('allows writes in %s', (path) => {
    expect(findViolations(diffOf(path, 'wearCount: 0,'))).toEqual([]);
  });

  it.each(['if (garment.wearCount === 0) {', 'const count = garment.wearCount;', 'relocation: x,'])(
    'ignores the read or unrelated code `%s`',
    (code) => {
      expect(findViolations(diffOf('src/features/laundry/useLaundry.ts', code))).toEqual([]);
    },
  );
});
