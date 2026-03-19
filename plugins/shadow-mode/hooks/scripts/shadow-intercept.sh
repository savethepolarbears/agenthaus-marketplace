#!/usr/bin/env bash
# Intercept destructive tool calls when shadow mode is active.
# If shadow mode is enabled, queue the action for review instead of executing.
# Exit 0 = allow action, Exit 1 = block action.

set -euo pipefail

MARKER_FILE=".shadow-mode-enabled"
QUEUE_DIR="review_queue"
TOOL_NAME="${1:-unknown}"

# If shadow mode is not enabled, allow the action
if [ ! -f "$MARKER_FILE" ]; then
    exit 0
fi

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
      --arg input_file "${TOOL_INPUT_FILE_PATH:-}" \
      --arg input_cmd "${TOOL_INPUT_COMMAND:-}" \
      '{tool: $tool, timestamp: $ts, status: $status, input_file: $input_file, input_command: $input_cmd}' > "$QUEUE_FILE"
else
    # Safe fallback using printf to avoid shell interpretation
    printf '{\n  "tool": "%s",\n  "timestamp": "%s",\n  "status": "pending",\n  "input_file": "%s",\n  "input_command": "%s"\n}\n' \
      "$(printf '%s' "$TOOL_NAME" | sed 's/["\]/\\&/g')" \
      "$(printf '%s' "$TIMESTAMP" | sed 's/["\]/\\&/g')" \
      "$(printf '%s' "${TOOL_INPUT_FILE_PATH:-}" | sed 's/["\]/\\&/g')" \
      "$(printf '%s' "${TOOL_INPUT_COMMAND:-}" | sed 's/["\]/\\&/g')" > "$QUEUE_FILE"
fi

echo "SHADOW MODE: Action queued for review -> ${QUEUE_FILE}"
echo "Tool: ${TOOL_NAME}"
echo "Use /review to inspect and approve/reject queued actions."

exit 1
