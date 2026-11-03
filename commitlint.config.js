const ATTRIBUTION = /co-authored-by:|generated with \[?claude/i;

module.exports = {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'no-attribution': ({ raw }) => [
          !ATTRIBUTION.test(raw ?? ''),
          'commit messages must not carry an attribution trailer',
        ],
      },
    },
  ],
  rules: { 'no-attribution': [2, 'always'] },
};
