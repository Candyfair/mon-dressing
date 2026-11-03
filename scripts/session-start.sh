#!/bin/sh
# Claude Code SessionStart hook: project state at session start (CLAUDE.md §4.5).
cd "$(dirname "$0")/.." || exit 0

echo "Branch: $(git branch --show-current)"
echo
echo "Recent commits:"
git log --oneline -10
echo
awk '/^### §14\.1/ { found = 1 } /^### §14\.2/ { found = 0 } found' SPEC.md
