#!/usr/bin/env bash
# Require test files in staged changes before allowing a commit.
# Exit 0 = allow, Exit 2 = block (Claude Code's blocking exit code; stderr is
# returned to the model. Any other non-zero exit is a non-blocking hook error).

set -euo pipefail

STDIN_JSON="$(cat 2>/dev/null || true)"
CMD=""
if [ -n "$STDIN_JSON" ] && command -v jq >/dev/null 2>&1; then
    CMD="$(printf '%s' "$STDIN_JSON" | jq -r '.tool_input.command // empty' 2>/dev/null || true)"
elif [ -n "$STDIN_JSON" ] && command -v python3 >/dev/null 2>&1; then
    CMD="$(printf '%s' "$STDIN_JSON" | python3 -I -c 'import json,sys
try:
    print((json.load(sys.stdin).get("tool_input") or {}).get("command") or "")
except Exception:
    pass' 2>/dev/null || true)"
elif [ -n "$STDIN_JSON" ]; then
    CMD="$STDIN_JSON"  # no JSON parser: scan the raw payload so the gate still applies
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

# Files the commit will record, following git's semantics (staged files,
# chained `git add`, `commit -a`, and `git commit <pathspec>` which commits only
# those paths). git_intent.py splits the command with shlex and never runs it
# through a shell. If the contents cannot be determined, block (fail closed).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Cheap prefilter on the word `git` (aliases can hide `commit`); git_intent.py
# makes the real decision (handles aliases, `git -C`,
# `cd dir &&`, global options, env prefixes).
printf '%s' "$CMD" | grep -qE '(^|[^[:alnum:]_-])git([^[:alnum:]_-]|$)' || exit 0
if [ -n "$CMD" ] && command -v python3 >/dev/null 2>&1; then
    STAGED_FILES="$(python3 -I "$SCRIPT_DIR/git_intent.py" commit-set "$CMD" 2>/dev/null || echo UNKNOWN)"
    [ "$STAGED_FILES" = "NOCOMMIT" ] && exit 0
else
    # Without python3 the commit set (commit -a, chained adds, pathspecs) cannot
    # be computed; the staged index alone would under-count it, so fail closed.
    echo "CIRCUIT BREAKER: python3 is required to check what this commit records." >&2
    echo "Install python3, or disable this breaker with /configure disable require-tests" >&2
    exit 2
fi
if [ "$STAGED_FILES" = "UNKNOWN" ]; then
    echo "CIRCUIT BREAKER: Could not determine which files this commit records" >&2
    echo "(interactive add, pathspec from stdin, git -C, or unparseable quoting). Stage files and run a plain 'git commit'." >&2
    echo "Override: disable this breaker with /configure disable require-tests" >&2
    exit 2
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
