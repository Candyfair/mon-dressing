// Pre-commit check: lifecycle columns are written only by src/domain/lifecycle/
// (DATA_MODEL.md §4). Pattern-based, so it reads added lines of the staged diff.
const { execFileSync } = require('node:child_process');

const COLUMNS = 'location|locationSince|toIron|wearCount';
const ASSIGNMENT = new RegExp(`\\b(${COLUMNS})\\b\\s*(:|=(?![=>])|\\+\\+|--|\\+=|-=)`);
const SHORTHAND = new RegExp(`\\.set\\(\\s*\\{[^}]*\\b(${COLUMNS})\\b`);
const ALLOWED_PATH =
  /^src\/(domain\/lifecycle\/|db\/schema\.ts$|db\/migrations\/)|\.test\.tsx?$|__fixtures__\//;

function findViolations(diff) {
  const violations = [];
  let path = null;
  for (const line of diff.split('\n')) {
    if (line.startsWith('+++ ')) {
      path = line.replace(/^\+\+\+ (b\/)?/, '');
    } else if (line.startsWith('+') && path && !ALLOWED_PATH.test(path)) {
      const code = line.slice(1);
      if (ASSIGNMENT.test(code) || SHORTHAND.test(code)) {
        violations.push({ path, code: code.trim() });
      }
    }
  }
  return violations;
}

if (require.main === module) {
  const diff = execFileSync(
    'git',
    ['diff', '--cached', '--unified=0', '--diff-filter=ACMR', '--', 'src'],
    { encoding: 'utf8' },
  );
  const violations = findViolations(diff);
  if (violations.length > 0) {
    console.error('Commit rejected: lifecycle columns are written only by src/domain/lifecycle/.');
    for (const { path, code } of violations) {
      console.error(`  ${path}: ${code}`);
    }
    process.exit(1);
  }
}

module.exports = { findViolations };
