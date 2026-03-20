#!/usr/bin/env bash
# Block deployments outside business hours (Mon-Fri 9am-5pm local time).
# Exit 0 = allow, Exit 1 = block.

set -euo pipefail

# Check if this breaker is disabled
CONFIG_FILE=".circuit-breaker-config.json"
# Validate CONFIG_FILE contains only safe characters (prevent path traversal)
[[ "$CONFIG_FILE" =~ ^[a-zA-Z0-9._-]+$ ]] || exit 0
if [ -f "$CONFIG_FILE" ]; then
    ENABLED=$(python3 -c "
import json, sys
try:
    cfg = json.load(open('$CONFIG_FILE'))
    print(cfg.get('breakers', {}).get('block-prod-deploy', {}).get('enabled', True))
except: print('True')
" 2>/dev/null || echo "True")
    if [ "$ENABLED" = "False" ]; then
        exit 0
    fi
fi

DAY_OF_WEEK=$(date +%u)  # 1=Monday, 7=Sunday
HOUR=$(date +%H)

if [ "$DAY_OF_WEEK" -gt 5 ]; then
    echo "CIRCUIT BREAKER: Deployment blocked -- weekend detected (day $DAY_OF_WEEK)."
    echo "Override: disable this breaker with /configure disable block-prod-deploy"
    exit 1
fi

if [ "$HOUR" -lt 9 ] || [ "$HOUR" -ge 17 ]; then
    echo "CIRCUIT BREAKER: Deployment blocked -- outside business hours (current: ${HOUR}:00)."
    echo "Allowed window: Monday-Friday 09:00-17:00 local time."
    echo "Override: disable this breaker with /configure disable block-prod-deploy"
    exit 1
fi

exit 0
