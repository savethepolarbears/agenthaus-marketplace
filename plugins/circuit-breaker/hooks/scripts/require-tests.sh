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

# Files the commit will contain: what is already staged, plus (a) tracked changes
# for `git commit -a/--all`, and (b) exactly the paths each chained `git add`
# would stage, found with `git add --dry-run` on shlex-split arguments (never
# shell-evaluated). Untracked files outside those adds never count. If parsing
# fails we fall back to the staged set, which fails closed.
STAGED_FILES=$(git diff --cached --name-only 2>/dev/null || echo "")
if [ -n "$CMD" ] && command -v python3 >/dev/null 2>&1; then
    EXTRA_FILES="$(CMD="$CMD" python3 - <<'PYSEL' 2>/dev/null || true
import os, shlex, subprocess
cmd = os.environ.get("CMD", "")
try:
    lexer = shlex.shlex(cmd, posix=True, punctuation_chars=";&|")
    lexer.whitespace_split = True
    tokens = list(lexer)
except ValueError:
    raise SystemExit(0)
segments, cur = [], []
for tok in tokens:
    if tok and set(tok) <= set(";&|"):
        if cur:
            segments.append(cur)
        cur = []
    else:
        cur.append(tok)
if cur:
    segments.append(cur)
def git_sub(seg):
    if len(seg) >= 2 and seg[0] == "git":
        i = 1
        while i < len(seg) and seg[i].startswith("-"):
            i += 2 if seg[i] in ("-C", "-c") else 1
        if i < len(seg):
            return seg[i], seg[i + 1:]
    return None, []
out = set()
for seg in segments:
    sub, args = git_sub(seg)
    if sub == "add":
        flags = [a for a in args if a.startswith("-") and a != "--"]
        paths = [a for a in args if not a.startswith("-") or a == "--"]
        paths = [a for a in paths if a != "--"]
        r = subprocess.run(["git", "add", "--dry-run", *flags, "--", *paths] if paths else ["git", "add", "--dry-run", *flags],
                           capture_output=True, text=True, timeout=10)
        if r.returncode == 0:
            for line in r.stdout.splitlines():
                if line.startswith("add '") and line.endswith("'"):
                    out.add(line[5:-1])
    elif sub == "commit":
        if any(a in ("-a", "--all") or (a.startswith("-") and not a.startswith("--") and "a" in a[1:].split("m")[0]) for a in args):
            r = subprocess.run(["git", "diff", "--name-only"], capture_output=True, text=True, timeout=10)
            if r.returncode == 0:
                out.update(l for l in r.stdout.splitlines() if l)
        break
for f in sorted(out):
    print(f)
PYSEL
)"
    if [ -n "$EXTRA_FILES" ]; then
        STAGED_FILES=$(printf '%s\n%s\n' "$STAGED_FILES" "$EXTRA_FILES" | sed '/^$/d' | sort -u)
    fi
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
