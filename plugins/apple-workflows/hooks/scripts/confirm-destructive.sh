#!/usr/bin/env bash
# Block destructive Apple operations unless confirm=True is present in tool input.
# Exit 0 = allow, Exit 2 = block (Claude Code's blocking exit code; stderr is
# returned to the model. Any other non-zero exit is a non-blocking hook error).

set -euo pipefail

# Read tool input from stdin (JSON)
TOOL_INPUT=$(cat)

# Check if confirm=True (or confirm: true) is present
if echo "$TOOL_INPUT" | grep -qiE '"confirm"\s*:\s*true'; then
    exit 0
fi

echo "SAFETY GUARD: Destructive Apple operation blocked." >&2
echo "The tool call does not include 'confirm: true'." >&2
echo "Please confirm the deletion with the user before retrying." >&2
exit 2
