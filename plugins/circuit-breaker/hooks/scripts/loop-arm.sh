#!/usr/bin/env bash
# Arm (trust) the current project's .agenthaus/loop.json for the loop guard.
# Usage: bash loop-arm.sh [--disarm]
# Run by a human (or via /circuit-breaker:loop). Records the config's sha256 so
# that any later edit disarms it until re-armed.

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=loop-lib.sh
. "$SCRIPT_DIR/loop-lib.sh"

CONFIG="$(loop_config_path)"
STATE_DIR="$(loop_state_root)" || { echo "loop-arm: cannot create state directory" >&2; exit 1; }
TRUST_FILE="$STATE_DIR/trusted"

if [ "${1:-}" = "--disarm" ]; then
    : >"$TRUST_FILE"
    echo "Loop guard disarmed for all projects."
    exit 0
fi

[ -f "$CONFIG" ] && [ ! -L "$CONFIG" ] || { echo "loop-arm: $CONFIG not found" >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "loop-arm: jq is required" >&2; exit 1; }
jq -e '.completionCommand | type == "string" and length > 0' "$CONFIG" >/dev/null \
    || { echo "loop-arm: completionCommand (string) is required in $CONFIG" >&2; exit 1; }

SHA="$(loop_sha256 "$CONFIG")" || { echo "loop-arm: sha256sum/shasum not found" >&2; exit 1; }
touch "$TRUST_FILE"
chmod 600 "$TRUST_FILE" 2>/dev/null || true
grep -qx "$SHA" "$TRUST_FILE" 2>/dev/null || printf '%s\n' "$SHA" >>"$TRUST_FILE"
echo "Loop guard armed for $CONFIG"
echo "  completionCommand: $(jq -r '.completionCommand' "$CONFIG")"
echo "  maxIterations:     $(jq -r '.maxIterations // 5' "$CONFIG") (clamped to 1..8)"
