#!/usr/bin/env bash
# Intercept destructive tool calls when shadow mode is active.
# If shadow mode is enabled, queue the action for review instead of executing.
# Exit 0 = allow, Exit 2 = block (Claude Code's blocking exit code; stderr is
# returned to the model. Any other non-zero exit is a non-blocking hook error).

set -euo pipefail

MARKER_FILE=".shadow-mode-enabled"
QUEUE_DIR="review_queue"

# If shadow mode is not enabled, allow the action. Checked before reading stdin so
# the common path stays cheap.
if [ ! -f "$MARKER_FILE" ]; then
    exit 0
fi

# Claude Code delivers the tool call as JSON on STDIN. There is no $TOOL_INPUT,
# $TOOL_INPUT_COMMAND or $TOOL_INPUT_FILE_PATH environment variable, and no
# positional argument — every field below comes from that payload.
STDIN_JSON="$(cat || true)"
if command -v jq >/dev/null 2>&1; then
    TOOL_NAME="$(printf '%s' "$STDIN_JSON" | jq -r '.tool_name // "unknown"' 2>/dev/null || echo unknown)"
    INPUT_FILE="$(printf '%s' "$STDIN_JSON" | jq -r '.tool_input.file_path // ""' 2>/dev/null || true)"
    INPUT_CMD="$(printf '%s' "$STDIN_JSON" | jq -r '.tool_input.command // ""' 2>/dev/null || true)"
else
    TOOL_NAME="unknown"
    INPUT_FILE=""
    INPUT_CMD=""
fi
# Keep the queue filename safe regardless of what the payload contained.
TOOL_NAME="$(printf '%s' "$TOOL_NAME" | tr -cd '[:alnum:]._-')"
[ -n "$TOOL_NAME" ] || TOOL_NAME="unknown"

# Shadow mode is active -- queue the action
mkdir -p "$QUEUE_DIR"

TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
SAFE_TIMESTAMP=$(date -u +%Y%m%d-%H%M%S)
QUEUE_FILE="${QUEUE_DIR}/${SAFE_TIMESTAMP}-${TOOL_NAME}.json"

# Write action details to queue (safely construct JSON to prevent injection)
if command -v jq >/dev/null 2>&1; then
    jq -n \
      --arg tool "$TOOL_NAME" \
      --arg ts "$TIMESTAMP" \
      --arg status "pending" \
      --arg input_file "$INPUT_FILE" \
      --arg input_cmd "$INPUT_CMD" \
      '{tool: $tool, timestamp: $ts, status: $status, input_file: $input_file, input_command: $input_cmd}' > "$QUEUE_FILE"
else
    # Safe fallback using printf to avoid shell interpretation
    printf '{\n  "tool": "%s",\n  "timestamp": "%s",\n  "status": "pending",\n  "input_file": "%s",\n  "input_command": "%s"\n}\n' \
      "$(printf '%s' "$TOOL_NAME" | sed 's/["\]/\\&/g')" \
      "$(printf '%s' "$TIMESTAMP" | sed 's/["\]/\\&/g')" \
      "$(printf '%s' "$INPUT_FILE" | sed 's/["\]/\\&/g')" \
      "$(printf '%s' "$INPUT_CMD" | sed 's/["\]/\\&/g')" > "$QUEUE_FILE"
fi

echo "SHADOW MODE: Action queued for review -> ${QUEUE_FILE}" >&2
echo "Tool: ${TOOL_NAME}" >&2
echo "Use /review to inspect and approve/reject queued actions." >&2

exit 2
