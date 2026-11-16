#!/usr/bin/env bash
# Arm (trust) the current project's .agenthaus/loop.json for the loop guard.
# Usage: bash loop-arm.sh [--disarm | --disarm-project]
# Run by a human (or via /circuit-breaker:loop). Records "<project path> <sha256>"
# so a later edit, or the same config in another checkout, is not trusted.

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=loop-lib.sh
. "$SCRIPT_DIR/loop-lib.sh"

LOOP_ACTIVE_CWD="$(pwd)"  # arm the worktree the session is in
CONFIG="$(loop_config_path)"
STATE_DIR="$(loop_state_root)" || { echo "loop-arm: cannot create state directory" >&2; exit 1; }
TRUST_FILE="$STATE_DIR/trusted"

if [ "${1:-}" = "--disarm" ]; then
    : >"$TRUST_FILE"
    echo "Loop guard disarmed for all projects."
    exit 0
fi
if [ "${1:-}" = "--disarm-project" ]; then
    PROJECT="$(cd "$(loop_project_dir)" && pwd -P)"
    if [ -f "$TRUST_FILE" ]; then
        TMP="$TRUST_FILE.tmp.$$"
        awk -v p="$PROJECT" 'index($0, p " ") != 1' "$TRUST_FILE" >"$TMP" && mv -f "$TMP" "$TRUST_FILE"
    fi
    echo "Loop guard disarmed for $PROJECT."
    exit 0
fi

[ -f "$CONFIG" ] && [ ! -L "$CONFIG" ] || { echo "loop-arm: $CONFIG not found" >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "loop-arm: jq is required" >&2; exit 1; }
jq -e '.completionCommand | type == "string" and length > 0' "$CONFIG" >/dev/null \
    || { echo "loop-arm: completionCommand (string) is required in $CONFIG" >&2; exit 1; }

KEY="$(loop_trust_key)" || { echo "loop-arm: cannot hash config (sha256sum/shasum missing?)" >&2; exit 1; }
touch "$TRUST_FILE"
chmod 600 "$TRUST_FILE" 2>/dev/null || true
grep -Fqx -- "$KEY" "$TRUST_FILE" 2>/dev/null || printf '%s\n' "$KEY" >>"$TRUST_FILE"
echo "Loop guard armed for $CONFIG"
echo "  completionCommand: $(jq -r '.completionCommand' "$CONFIG")"
echo "  maxIterations:     $(jq -r '.maxIterations // 5' "$CONFIG") (clamped to 1..8)"
