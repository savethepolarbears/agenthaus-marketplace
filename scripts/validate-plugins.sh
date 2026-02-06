#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGINS_DIR="$SCRIPT_DIR/../plugins"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

pass_count=0
fail_count=0
warn_count=0
total_count=0

log_pass() { echo -e "  ${GREEN}PASS${NC} $1"; }
log_fail() { echo -e "  ${RED}FAIL${NC} $1"; }
log_warn() { echo -e "  ${YELLOW}WARN${NC} $1"; }

validate_plugin() {
  local dir="$1"
  local name
  name="$(basename "$dir")"
  local failed=0

  echo -e "\n${BOLD}Validating plugin: ${name}${NC}"
  total_count=$((total_count + 1))

  # 1. Check plugin.json exists
  local manifest="$dir/.claude-plugin/plugin.json"
  if [[ ! -f "$manifest" ]]; then
    log_fail ".claude-plugin/plugin.json not found"
    fail_count=$((fail_count + 1))
    return
  fi
  log_pass ".claude-plugin/plugin.json exists"

  # 2. Validate JSON syntax
  if ! python3 -c "import json; json.load(open('$manifest'))" 2>/dev/null; then
    log_fail "plugin.json is not valid JSON"
    fail_count=$((fail_count + 1))
    return
  fi
  log_pass "plugin.json is valid JSON"

  # 3. Check required fields: name, version, description
  for field in name version description; do
    local value
    value="$(python3 -c "
import json, sys
data = json.load(open('$manifest'))
val = data.get('$field')
if val is None or (isinstance(val, str) and not val.strip()):
    sys.exit(1)
print(val)
" 2>/dev/null)" || true

    if [[ -z "$value" ]]; then
      log_fail "Required field '${field}' is missing or empty"
      failed=1
    else
      log_pass "Field '${field}' present"
    fi
  done

  # 4. Check README.md
  if [[ ! -f "$dir/README.md" ]]; then
    log_warn "README.md not found"
    warn_count=$((warn_count + 1))
  else
    log_pass "README.md exists"
  fi

  # 5. Check referenced files in commands, agents, skills, hooks arrays
  for array_field in commands agents skills hooks; do
    local files
    files="$(python3 -c "
import json
data = json.load(open('$manifest'))
for f in data.get('$array_field', []):
    print(f)
" 2>/dev/null)" || true

    if [[ -n "$files" ]]; then
      while IFS= read -r ref_file; do
        if [[ ! -f "$dir/$ref_file" ]]; then
          log_fail "Referenced file '${ref_file}' (${array_field}) not found"
          failed=1
        else
          log_pass "Referenced file '${ref_file}' exists"
        fi
      done <<< "$files"
    fi
  done

  # 6. Validate .mcp.json if present
  local mcp_file="$dir/.mcp.json"
  if [[ -f "$mcp_file" ]]; then
    if ! python3 -c "import json; json.load(open('$mcp_file'))" 2>/dev/null; then
      log_fail ".mcp.json is not valid JSON"
      failed=1
    else
      log_pass ".mcp.json is valid JSON"
    fi
  fi

  if [[ "$failed" -eq 1 ]]; then
    fail_count=$((fail_count + 1))
  else
    pass_count=$((pass_count + 1))
  fi
}

# Main
echo -e "${BOLD}AgentHaus Plugin Validator${NC}"
echo "========================="

if [[ ! -d "$PLUGINS_DIR" ]]; then
  echo -e "${RED}Error: plugins/ directory not found at ${PLUGINS_DIR}${NC}"
  exit 1
fi

for plugin_dir in "$PLUGINS_DIR"/*/; do
  [[ -d "$plugin_dir" ]] || continue
  validate_plugin "$plugin_dir"
done

echo ""
echo "========================="
echo -e "${BOLD}Summary:${NC} ${total_count} plugins checked, ${GREEN}${pass_count} passed${NC}, ${RED}${fail_count} failed${NC}, ${YELLOW}${warn_count} warnings${NC}"

if [[ "$fail_count" -gt 0 ]]; then
  exit 1
fi
exit 0
