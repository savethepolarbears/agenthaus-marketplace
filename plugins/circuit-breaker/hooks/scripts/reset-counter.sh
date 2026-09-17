#!/usr/bin/env bash
# Reset the circuit-breaker tool usage counter.
# Safely removes the active user-isolated counter file and legacy locations if owned.

set -euo pipefail

USER_ID="${UID:-$(id -u 2>/dev/null || echo 0)}"
BASE_TMP="${TMPDIR:-/tmp}"
BASE_TMP="${BASE_TMP%/}"
BASE_TMP="${BASE_TMP:-/tmp}"
STATE_DIR="${BASE_TMP}/circuit-breaker-${USER_ID}"
COUNTER_FILE="$STATE_DIR/counter"

# Remove active isolated counter inside verified, non-symlinked, user-owned parent directory
if [ -L "$STATE_DIR" ] || [ ! -d "$STATE_DIR" ] || [ ! -O "$STATE_DIR" ]; then
    # Do not traverse into symlinked or alien-owned state directory
    :
else
    if [ -L "$COUNTER_FILE" ]; then
        rm -f "$COUNTER_FILE" 2>/dev/null || true
    elif [ -f "$COUNTER_FILE" ] && [ -O "$COUNTER_FILE" ]; then
        rm -f "$COUNTER_FILE" 2>/dev/null || true
    fi
fi

# Clean up legacy counter paths if owned
LEGACY_FILE="${BASE_TMP}/circuit-breaker-counter"
if [ -f "$LEGACY_FILE" ] && [ -O "$LEGACY_FILE" ] && [ ! -L "$LEGACY_FILE" ]; then
    rm -f "$LEGACY_FILE" 2>/dev/null || true
fi

LEGACY_UID_FILE="${BASE_TMP}/circuit-breaker-counter-${USER_ID}"
if [ -f "$LEGACY_UID_FILE" ] && [ -O "$LEGACY_UID_FILE" ] && [ ! -L "$LEGACY_UID_FILE" ]; then
    rm -f "$LEGACY_UID_FILE" 2>/dev/null || true
fi

# Clean up configuration file if present in working directory and owned
CONFIG_FILE=".circuit-breaker-config.json"
if [ -f "$CONFIG_FILE" ] && [ -O "$CONFIG_FILE" ] && [ ! -L "$CONFIG_FILE" ]; then
    rm -f "$CONFIG_FILE" 2>/dev/null || true
fi

echo "Circuit breaker counter reset successfully."
exit 0
