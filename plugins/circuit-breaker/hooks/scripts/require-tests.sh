#!/usr/bin/env bash
# Require test files in staged changes before allowing a commit.
# Exit 0 = allow, Exit 2 = block (Claude Code's blocking exit code; stderr is
# returned to the model. Any other non-zero exit is a non-blocking hook error).

set -euo pipefail

STDIN_JSON="$(cat 2>/dev/null || true)"
CMD=""
if [ -n "$STDIN_JSON" ] && command -v jq >/dev/null 2>&1; then
    CMD="$(printf '%s' "$STDIN_JSON" | jq -r '.tool_input.command // empty' 2>/dev/null || true)"
fi

# Check if this breaker is disabled
CONFIG_FILE=".circuit-breaker-config.json"
# Validate CONFIG_FILE contains only safe characters (prevent path traversal)
[[ "$CONFIG_FILE" =~ ^[a-zA-Z0-9._-]+$ ]] || exit 0
if [ -f "$CONFIG_FILE" ]; then
    ENABLED=$(jq -r 'if .breakers?."require-tests"?.enabled? == false then "False" else "True" end' "$CONFIG_FILE" 2>/dev/null || echo "True")
    if [ "$ENABLED" = "False" ]; then
        exit 0
    fi
fi

# Check for test files in staged changes
STAGED_FILES=$(git diff --cached --name-only 2>/dev/null || echo "")
# A chained `git add ... && git commit` or `git commit -a` stages files only
# after this hook runs, so also consider tracked/untracked working-tree changes.
if printf '%s' "$CMD" | grep -qE 'git[[:space:]]+add|git[[:space:]]+commit[[:space:]].*-[a-zA-Z]*a'; then
    WORKTREE_FILES=$( { git diff --name-only 2>/dev/null; git ls-files --others --exclude-standard 2>/dev/null; } || true)
    STAGED_FILES=$(printf '%s\n%s\n' "$STAGED_FILES" "$WORKTREE_FILES" | sed '/^$/d' | sort -u)
fi

if [ -z "$STAGED_FILES" ]; then
    # No staged files -- nothing to check
    exit 0
fi

TEST_FILES=$(echo "$STAGED_FILES" | grep -E '\.(test|spec)\.(ts|tsx|js|jsx|py|rb|go)$' || true)

if [ -z "$TEST_FILES" ]; then
    echo "CIRCUIT BREAKER: No test files found in staged changes." >&2
    echo "Staged files:" >&2
    echo "$STAGED_FILES" | head -10 >&2
    echo "" >&2
    echo "Add test files (*.test.* or *.spec.*) to your commit." >&2
    echo "Override: disable this breaker with /configure disable require-tests" >&2
    exit 2
fi

exit 0
