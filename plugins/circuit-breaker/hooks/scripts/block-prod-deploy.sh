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
elif command -v python3 >/dev/null 2>&1; then
    CMD="$(printf '%s' "$STDIN_JSON" | python3 -I -c 'import json,sys
try:
    print((json.load(sys.stdin).get("tool_input") or {}).get("command") or "")
except Exception:
    pass' 2>/dev/null || true)"
else
    CMD="$STDIN_JSON"
fi

# Only gate commands that actually look like a deploy/publish.
# Match deploy/publish verbs as whole words at a command position so that e.g.
# `cat release-notes.md` is not gated; package scripts named *deploy*/*release*
# (npm run deploy, yarn deploy:prod) count as deploys; git pushes are resolved
# by git_intent.py.
DEPLOY_RE='(^|[;&|[:space:]])((npm|pnpm|yarn|bun)[[:space:]]+publish|(npm|pnpm|yarn|bun)[[:space:]]+((run|run-script)[[:space:]]+)?[a-z0-9:_.-]*(deploy|release)[a-z0-9:_.-]*|wrangler[[:space:]]+(deploy|publish|pages[[:space:]]+deploy)|vercel([[:space:]]+deploy)?[[:space:]]+--prod|netlify[[:space:]]+deploy[[:space:]]+--prod|fly[[:space:]]+deploy|kubectl[[:space:]]+(apply|rollout)|helm[[:space:]]+(upgrade|install)|terraform[[:space:]]+apply|gh[[:space:]]+release[[:space:]]+create|[a-z0-9_.-]*deploy[a-z0-9_.-]*\.sh|make[[:space:]]+(deploy|release))'
IS_DEPLOY=no
printf '%s\n' "$CMD" | grep -qiE "$DEPLOY_RE" && IS_DEPLOY=yes
# git push: resolve the effective destination (including a bare `git push` that
# follows the branch's upstream) instead of looking for branch names in the text.
# Cheap prefilter on the word `git` (aliases can hide `push`); git_intent.py parses global
# options (-C, -c, --no-pager, ...), `cd dir &&` and env prefixes.
if [ "$IS_DEPLOY" = no ] && printf '%s' "$CMD" | grep -qE '(^|[^[:alnum:]_-])git([^[:alnum:]_-]|$)'; then
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    if command -v python3 >/dev/null 2>&1; then
        PUSH="$(python3 -I "$SCRIPT_DIR/git_intent.py" push-protected "$CMD" 2>/dev/null || echo UNKNOWN)"
    else
        PUSH=UNKNOWN
    fi
    # Protected target, or unknown: treat as a deploy (fail closed).
    [ "$PUSH" = no ] || IS_DEPLOY=yes
fi
[ "$IS_DEPLOY" = yes ] || exit 0

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
