#!/usr/bin/env bash
# Track tool usage count and warn when threshold is exceeded.
# Always exits 0 (warning only, never blocks).

set -euo pipefail

COUNTER_FILE="/tmp/circuit-breaker-counter"
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
    THRESHOLD="$CUSTOM_THRESHOLD"
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

# Increment
COUNT=$((COUNT + 1))
echo "$COUNT" > "$COUNTER_FILE"

# Warn at threshold
if [ "$COUNT" -eq "$THRESHOLD" ]; then
    echo "BUDGET GUARD: Tool usage has reached $THRESHOLD calls this session."
    echo "Consider reviewing progress and whether continued tool use is needed."
elif [ "$COUNT" -gt "$THRESHOLD" ] && [ $(( COUNT % 25 )) -eq 0 ]; then
    echo "BUDGET GUARD: Tool usage at $COUNT calls (threshold: $THRESHOLD)."
fi

exit 0
