#!/usr/bin/env bash
# Track tool usage per session and ask the user to confirm once the budget is hit.
# PreToolUse hook. Reads the hook payload (JSON) from stdin; the counter is keyed
# by session_id so parallel sessions never share a budget. Never exits non-zero:
# at the threshold (and every 25 calls past it) it emits a structured
# permissionDecision "ask" so a human decides whether the loop continues.

set -euo pipefail

STDIN_JSON="$(cat 2>/dev/null || true)"
SESSION_ID=""
if [ -n "$STDIN_JSON" ]; then
    if command -v jq >/dev/null 2>&1; then
        SESSION_ID="$(printf '%s' "$STDIN_JSON" | jq -r '.session_id // empty' 2>/dev/null || true)"
    elif command -v python3 >/dev/null 2>&1; then
        SESSION_ID="$(printf '%s' "$STDIN_JSON" | python3 -c 'import json,sys
try: print(json.load(sys.stdin).get("session_id",""))
except Exception: pass' 2>/dev/null || true)"
    fi
fi
# Only allow a conservative character set in the file name (no traversal).
SESSION_ID="$(printf '%s' "$SESSION_ID" | tr -cd 'A-Za-z0-9_-' | cut -c1-128)"

# CWE-377 mitigation: Isolate counter inside a verified, owner-only directory.
# Reject symlinks and alien-owned directories or files, exiting 0 gracefully on storage failure.
USER_ID="${UID:-$(id -u 2>/dev/null || echo 0)}"
BASE_TMP="${TMPDIR:-/tmp}"
BASE_TMP="${BASE_TMP%/}"
BASE_TMP="${BASE_TMP:-/tmp}"
STATE_DIR="${BASE_TMP}/circuit-breaker-${USER_ID}"

# Verify or create the state directory
if [ -L "$STATE_DIR" ]; then
    exit 0
fi

if [ -e "$STATE_DIR" ]; then
    # Must be a directory owned by current user with write permission
    if [ ! -d "$STATE_DIR" ] || [ ! -O "$STATE_DIR" ] || [ ! -w "$STATE_DIR" ]; then
        exit 0
    fi
else
    mkdir -p -m 700 "$STATE_DIR" 2>/dev/null || exit 0
    if [ -L "$STATE_DIR" ] || [ ! -d "$STATE_DIR" ] || [ ! -O "$STATE_DIR" ] || [ ! -w "$STATE_DIR" ]; then
        exit 0
    fi
fi

if [ -n "$SESSION_ID" ]; then
    COUNTER_FILE="$STATE_DIR/counter-$SESSION_ID"
else
    COUNTER_FILE="$STATE_DIR/counter"
fi

# Verify counter file integrity if present
if [ -L "$COUNTER_FILE" ]; then
    exit 0
fi

if [ -e "$COUNTER_FILE" ]; then
    if [ ! -f "$COUNTER_FILE" ] || [ ! -O "$COUNTER_FILE" ] || [ ! -w "$COUNTER_FILE" ]; then
        exit 0
    fi
fi

THRESHOLD=100

# Check if this breaker is disabled
CONFIG_FILE=".circuit-breaker-config.json"
# Validate CONFIG_FILE contains only safe characters (prevent path traversal)
[[ "$CONFIG_FILE" =~ ^[a-zA-Z0-9._-]+$ ]] || exit 0
if [ -f "$CONFIG_FILE" ]; then
    ENABLED=$(jq -r 'if .breakers?."budget-guard"?.enabled? == false then "False" else "True" end' "$CONFIG_FILE" 2>/dev/null || echo "True")
    if [ "$ENABLED" = "False" ]; then
        exit 0
    fi

    # Read custom threshold
    CUSTOM_THRESHOLD=$(jq -r '.breakers?."budget-guard"?.threshold? // 100' "$CONFIG_FILE" 2>/dev/null || echo "100")
    if [[ "$CUSTOM_THRESHOLD" =~ ^[0-9]+$ ]] && [ "$CUSTOM_THRESHOLD" -gt 0 ]; then
        THRESHOLD="$CUSTOM_THRESHOLD"
    fi
fi

# Read current counter
if [ -f "$COUNTER_FILE" ]; then
    COUNT=$(cat "$COUNTER_FILE" 2>/dev/null || echo "0")
    # Validate it is a number
    if ! [[ "$COUNT" =~ ^[0-9]+$ ]]; then
        COUNT=0
    fi
else
    COUNT=0
fi

# Increment and atomically persist (eliminate check-then-write TOCTOU window)
COUNT=$((COUNT + 1))
TMP_COUNTER="$STATE_DIR/counter.tmp.$$"
echo "$COUNT" > "$TMP_COUNTER" 2>/dev/null && mv -f "$TMP_COUNTER" "$COUNTER_FILE" 2>/dev/null || { rm -f "$TMP_COUNTER" 2>/dev/null; exit 0; }

# Ask for confirmation at the threshold and every 25 calls past it.
# PreToolUse stdout is only honoured as structured JSON, so plain echo would be
# invisible to both the model and the user.
REASON=""
if [ "$COUNT" -eq "$THRESHOLD" ]; then
    REASON="BUDGET GUARD: tool usage reached $THRESHOLD calls this session. Review progress before continuing."
elif [ "$COUNT" -gt "$THRESHOLD" ] && [ $(( COUNT % 25 )) -eq 0 ]; then
    REASON="BUDGET GUARD: tool usage at $COUNT calls (threshold: $THRESHOLD)."
fi
if [ -n "$REASON" ]; then
    printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"%s"}}\n' "$REASON"
fi

exit 0
