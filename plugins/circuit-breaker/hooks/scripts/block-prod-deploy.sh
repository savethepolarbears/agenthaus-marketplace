#!/usr/bin/env bash
# Block deployments outside business hours (Mon-Fri 9am-5pm local time).
# Exit 0 = allow, Exit 2 = block (Claude Code treats exit 2 as a deny and feeds
# stderr back to the model; any other non-zero exit is a non-blocking hook error).
#
# Runs as a PreToolUse hook on Bash. Claude Code delivers the tool call as JSON on
# STDIN, so the command is read from there — there is no $TOOL_INPUT env var.

set -euo pipefail

STDIN_JSON="$(cat || true)"
if command -v jq >/dev/null 2>&1; then
    CMD="$(printf '%s' "$STDIN_JSON" | jq -r '.tool_input.command // empty' 2>/dev/null || true)"
else
    CMD="$STDIN_JSON"
fi

# Only gate commands that actually look like a deploy/publish.
printf '%s\n' "$CMD" | grep -qiE '(deploy|push|publish|release)' || exit 0

# Check if this breaker is disabled
CONFIG_FILE=".circuit-breaker-config.json"
# Validate CONFIG_FILE contains only safe characters (prevent path traversal)
[[ "$CONFIG_FILE" =~ ^[a-zA-Z0-9._-]+$ ]] || exit 0
if [ -f "$CONFIG_FILE" ]; then
    ENABLED=$(jq -r 'if .breakers?."block-prod-deploy"?.enabled? == false then "False" else "True" end' "$CONFIG_FILE" 2>/dev/null || echo "True")
    if [ "$ENABLED" = "False" ]; then
        exit 0
    fi
fi

DAY_OF_WEEK=$(date +%u)  # 1=Monday, 7=Sunday
HOUR=$(date +%H)

if [ "$DAY_OF_WEEK" -gt 5 ]; then
    echo "CIRCUIT BREAKER: Deployment blocked -- weekend detected (day $DAY_OF_WEEK)." >&2
    echo "Override: disable this breaker with /configure disable block-prod-deploy" >&2
    exit 2
fi

if [ "$HOUR" -lt 9 ] || [ "$HOUR" -ge 17 ]; then
    echo "CIRCUIT BREAKER: Deployment blocked -- outside business hours (current: ${HOUR}:00)." >&2
    echo "Allowed window: Monday-Friday 09:00-17:00 local time." >&2
    echo "Override: disable this breaker with /configure disable block-prod-deploy" >&2
    exit 2
fi

exit 0
