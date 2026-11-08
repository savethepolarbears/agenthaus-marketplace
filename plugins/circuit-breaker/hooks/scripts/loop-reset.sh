#!/usr/bin/env bash
# Reset loop-guard iteration state for the current session. Registered on
# SessionStart and UserPromptSubmit so every new user turn gets a fresh,
# deterministic iteration budget. Never blocks.

set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=loop-lib.sh
. "$SCRIPT_DIR/loop-lib.sh" || exit 0

STDIN_JSON="$(cat 2>/dev/null || true)"
STATE_DIR="$(loop_state_root)" || exit 0
SESSION_KEY="$(loop_session_key "$(loop_json_field "$STDIN_JSON" session_id)")"
STATE_FILE="$STATE_DIR/$SESSION_KEY.json"
if [ -f "$STATE_FILE" ] && [ -O "$STATE_FILE" ]; then
    rm -f "$STATE_FILE" 2>/dev/null || true
fi
exit 0
