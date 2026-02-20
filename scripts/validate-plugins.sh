#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR/.."
PLUGINS_DIR="$ROOT_DIR/plugins"
MARKETPLACE="$ROOT_DIR/.claude-plugin/marketplace.json"
SCHEMA="$ROOT_DIR/schemas/plugin.schema.json"

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

# -------------------------------------------------------------------
# Validate marketplace.json
# -------------------------------------------------------------------
validate_marketplace() {
  echo -e "\n${BOLD}Validating marketplace.json${NC}"

  if [[ ! -f "$MARKETPLACE" ]]; then
    log_fail ".claude-plugin/marketplace.json not found"
    return 1
  fi
  log_pass ".claude-plugin/marketplace.json exists"

  if ! python3 -c "import json; json.load(open('$MARKETPLACE'))" 2>/dev/null; then
    log_fail "marketplace.json is not valid JSON"
    return 1
  fi
  log_pass "marketplace.json is valid JSON"

  # Check required fields
  local result
  result="$(python3 -c "
import json, sys
data = json.load(open('$MARKETPLACE'))
errors = []
if 'name' not in data: errors.append('name')
if 'owner' not in data: errors.append('owner')
elif 'name' not in data.get('owner', {}): errors.append('owner.name')
if 'plugins' not in data: errors.append('plugins')
elif not isinstance(data['plugins'], list): errors.append('plugins (must be array)')

# Check for duplicate plugin names
if 'plugins' in data and isinstance(data['plugins'], list):
    names = [p.get('name') for p in data['plugins'] if 'name' in p]
    dupes = [n for n in names if names.count(n) > 1]
    if dupes:
        errors.append(f'duplicate plugin names: {set(dupes)}')

    # Check each plugin entry has required fields
    for i, p in enumerate(data['plugins']):
        if 'name' not in p: errors.append(f'plugins[{i}] missing name')
        if 'source' not in p: errors.append(f'plugins[{i}] missing source')

if errors:
    print('|'.join(errors))
    sys.exit(1)
" 2>/dev/null)" || true

  if [[ -n "$result" ]]; then
    IFS='|' read -ra errs <<< "$result"
    for err in "${errs[@]}"; do
      log_fail "marketplace.json: missing or invalid field '${err}'"
    done
    return 1
  fi
  log_pass "marketplace.json has required fields (name, owner, plugins)"

  # Check metadata section
  python3 -c "
import json
data = json.load(open('$MARKETPLACE'))
if 'metadata' not in data:
    print('WARN')
" 2>/dev/null | grep -q 'WARN' && {
    log_warn "marketplace.json: no metadata section (recommended: description, version, pluginRoot)"
    warn_count=$((warn_count + 1))
  } || log_pass "marketplace.json has metadata section"

  return 0
}

# -------------------------------------------------------------------
# Validate individual plugin
# -------------------------------------------------------------------
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

  # 4. Check recommended fields
  for field in author license; do
    local has_field
    has_field="$(python3 -c "
import json
data = json.load(open('$manifest'))
print('yes' if '$field' in data else 'no')
" 2>/dev/null)" || true

    if [[ "$has_field" != "yes" ]]; then
      log_warn "Recommended field '${field}' missing"
      warn_count=$((warn_count + 1))
    fi
  done

  # 5. Check README.md
  if [[ ! -f "$dir/README.md" ]]; then
    log_warn "README.md not found"
    warn_count=$((warn_count + 1))
  else
    log_pass "README.md exists"
  fi

  # 6. Check referenced files in commands, agents, skills, hooks arrays
  for array_field in commands agents skills hooks; do
    local files
    files="$(python3 -c "
import json
data = json.load(open('$manifest'))
val = data.get('$array_field', [])
if isinstance(val, list):
    for f in val:
        if isinstance(f, str):
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

  # 7. Validate .mcp.json if present
  local mcp_file="$dir/.mcp.json"
  if [[ -f "$mcp_file" ]]; then
    if ! python3 -c "import json; json.load(open('$mcp_file'))" 2>/dev/null; then
      log_fail ".mcp.json is not valid JSON"
      failed=1
    else
      log_pass ".mcp.json is valid JSON"
    fi
  fi

  # 8. Validate hooks format (should use object with "hooks" key, not flat array)
  local hooks_files
  hooks_files="$(python3 -c "
import json
data = json.load(open('$manifest'))
val = data.get('hooks', [])
if isinstance(val, list):
    for f in val:
        if isinstance(f, str):
            print(f)
" 2>/dev/null)" || true

  if [[ -n "$hooks_files" ]]; then
    while IFS= read -r hook_file; do
      local hook_path="$dir/$hook_file"
      if [[ -f "$hook_path" ]]; then
        local hook_format
        hook_format="$(python3 -c "
import json
data = json.load(open('$hook_path'))
if isinstance(data, list):
    print('array')
elif isinstance(data, dict) and 'hooks' in data:
    print('object')
else:
    print('unknown')
" 2>/dev/null)" || true

        if [[ "$hook_format" == "array" ]]; then
          log_warn "Hooks file '${hook_file}' uses flat array format — should use object with 'hooks' key"
          warn_count=$((warn_count + 1))
        elif [[ "$hook_format" == "object" ]]; then
          log_pass "Hooks file '${hook_file}' uses correct format"
        fi
      fi
    done <<< "$hooks_files"
  fi

  # 9. Check for relative paths in hooks/MCP that should use CLAUDE_PLUGIN_ROOT
  python3 -c "
import json, re
data = json.load(open('$manifest'))

# Check inline hooks
if isinstance(data.get('hooks'), dict):
    text = json.dumps(data['hooks'])
    if re.search(r'\./hooks/', text) or re.search(r'\./scripts/', text):
        print('WARN_HOOKS')

# Check inline mcpServers
for name, cfg in data.get('mcpServers', {}).items():
    args_str = ' '.join(cfg.get('args', []))
    cmd = cfg.get('command', '')
    if re.search(r'\./[a-z]', args_str) or re.search(r'\./[a-z]', cmd):
        print(f'WARN_MCP:{name}')
" 2>/dev/null | while IFS= read -r warning; do
    if [[ "$warning" == "WARN_HOOKS" ]]; then
      log_warn "Inline hooks use relative paths — consider using \${CLAUDE_PLUGIN_ROOT}"
      warn_count=$((warn_count + 1))
    elif [[ "$warning" == WARN_MCP:* ]]; then
      local srv="${warning#WARN_MCP:}"
      log_warn "MCP server '${srv}' uses relative paths — consider using \${CLAUDE_PLUGIN_ROOT}"
      warn_count=$((warn_count + 1))
    fi
  done

  if [[ "$failed" -eq 1 ]]; then
    fail_count=$((fail_count + 1))
  else
    pass_count=$((pass_count + 1))
  fi
}

# -------------------------------------------------------------------
# Main
# -------------------------------------------------------------------
echo -e "${BOLD}AgentHaus Plugin Validator${NC}"
echo "========================="

# Validate marketplace first
validate_marketplace

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
