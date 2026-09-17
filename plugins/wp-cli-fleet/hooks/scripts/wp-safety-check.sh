#!/usr/bin/env bash
# wp-safety-check.sh — Gate destructive WP-CLI operations behind an explicit confirmation.
#
# Runs as a PreToolUse hook on Bash. Claude Code delivers the tool call as JSON on
# STDIN (not as a $TOOL_INPUT environment variable), so the command is read from there.
#
# Output contract: printing a hookSpecificOutput object with
# permissionDecision "ask" makes Claude Code prompt the user before the command runs.
# Staying silent and exiting 0 lets the command through untouched.

set -euo pipefail

STDIN_JSON="$(cat || true)"

if command -v jq >/dev/null 2>&1; then
  CMD="$(printf '%s' "$STDIN_JSON" | jq -r '.tool_input.command // empty' 2>/dev/null || true)"
else
  # Fallback: no jq available — scan the raw payload rather than failing open silently.
  CMD="$STDIN_JSON"
fi

[ -n "$CMD" ] || exit 0

# A fleet invocation puts an alias and/or global flags between `wp` and the
# subcommand — `wp @site.prod db drop`, `wp --path=... search-replace`. Matching a
# bare `wp<space>db` would miss every real fleet command, so allow those tokens.
WP='(^|[;&|[:space:]])wp([[:space:]]+(@[^[:space:]]+|--[^[:space:]]+))*[[:space:]]+'

has() { printf '%s\n' "$CMD" | grep -qiE "$1"; }

REASONS=""
add_reason() { REASONS="${REASONS:+$REASONS }$1"; }

if has "${WP}core[[:space:]]+update" && ! has '\-\-dry-run'; then
  add_reason "Core update without --dry-run: run a dry run first and take a database backup."
fi

if has "${WP}db[[:space:]]+(drop|reset|import)"; then
  add_reason "Destructive database operation (db drop/reset/import): confirm a recent verified backup exists."
fi

if has "${WP}search-replace" && ! has '\-\-dry-run'; then
  add_reason "search-replace without --dry-run: preview the changes before writing them."
fi

[ -n "$REASONS" ] || exit 0

if command -v jq >/dev/null 2>&1; then
  jq -nc --arg reason "[wp-cli-fleet] $REASONS" \
    '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"ask",permissionDecisionReason:$reason}}'
else
  # Without jq the reason cannot be safely JSON-encoded; block with exit 2 instead,
  # which Claude Code treats as "deny" and surfaces stderr back to the model.
  printf '[wp-cli-fleet] %s\n' "$REASONS" >&2
  exit 2
fi

exit 0
