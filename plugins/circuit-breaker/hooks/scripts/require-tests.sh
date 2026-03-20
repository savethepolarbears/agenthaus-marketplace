#!/usr/bin/env bash
# Require test files in staged changes before allowing a commit.
# Exit 0 = allow, Exit 1 = block.

set -euo pipefail

# Check if this breaker is disabled
CONFIG_FILE=".circuit-breaker-config.json"
# Validate CONFIG_FILE contains only safe characters (prevent path traversal)
[[ "$CONFIG_FILE" =~ ^[a-zA-Z0-9._-]+$ ]] || exit 0
if [ -f "$CONFIG_FILE" ]; then
    ENABLED=$(python3 -c "
import json, sys
try:
    cfg = json.load(open('$CONFIG_FILE'))
    print(cfg.get('breakers', {}).get('require-tests', {}).get('enabled', True))
except: print('True')
" 2>/dev/null || echo "True")
    if [ "$ENABLED" = "False" ]; then
        exit 0
    fi
fi

# Check for test files in staged changes
STAGED_FILES=$(git diff --cached --name-only 2>/dev/null || echo "")

if [ -z "$STAGED_FILES" ]; then
    # No staged files -- nothing to check
    exit 0
fi

TEST_FILES=$(echo "$STAGED_FILES" | grep -E '\.(test|spec)\.(ts|tsx|js|jsx|py|rb|go)$' || true)

if [ -z "$TEST_FILES" ]; then
    echo "CIRCUIT BREAKER: No test files found in staged changes."
    echo "Staged files:"
    echo "$STAGED_FILES" | head -10
    echo ""
    echo "Add test files (*.test.* or *.spec.*) to your commit."
    echo "Override: disable this breaker with /configure disable require-tests"
    exit 1
fi

echo "Test files found in staged changes: $(echo "$TEST_FILES" | wc -l | tr -d ' ')"
exit 0
