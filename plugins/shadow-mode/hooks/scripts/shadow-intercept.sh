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

# Write action details to queue
cat > "$QUEUE_FILE" << QEOF
{
  "tool": "${TOOL_NAME}",
  "timestamp": "${TIMESTAMP}",
  "status": "pending",
  "input_file": "${TOOL_INPUT_FILE_PATH:-}",
  "input_command": "${TOOL_INPUT_COMMAND:-}"
}
QEOF

echo "SHADOW MODE: Action queued for review -> ${QUEUE_FILE}"
echo "Tool: ${TOOL_NAME}"
echo "Use /review to inspect and approve/reject queued actions."

exit 1
