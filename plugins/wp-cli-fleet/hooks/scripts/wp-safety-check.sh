#!/usr/bin/env bash
# wp-safety-check.sh — Warn before destructive WP-CLI operations
# Called by PreToolUse hook when a potentially mutating WP-CLI command is detected.

set -euo pipefail

INPUT="${TOOL_INPUT:-}"

# Check for core update without dry-run
if echo "$INPUT" | grep -qiE 'wp\s+(core\s+update)' && ! echo "$INPUT" | grep -qiE '--dry-run'; then
  echo "[wp-cli-fleet] WARNING: Core update detected without --dry-run."
  echo "Consider running with --dry-run first and creating a database backup."
fi

# Check for database destructive operations
if echo "$INPUT" | grep -qiE 'wp\s+db\s+(drop|reset|import)'; then
  echo "[wp-cli-fleet] WARNING: Destructive database operation detected."
  echo "Ensure you have a recent backup before proceeding."
fi

# Check for search-replace without dry-run
if echo "$INPUT" | grep -qiE 'wp\s+search-replace' && ! echo "$INPUT" | grep -qiE '--dry-run'; then
  echo "[wp-cli-fleet] WARNING: search-replace without --dry-run detected."
  echo "Consider running with --dry-run first to preview changes."
fi

exit 0
