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

  if ! jq . "$MARKETPLACE" >/dev/null 2>&1; then
    log_fail "marketplace.json is not valid JSON"
    return 1
  fi
  log_pass "marketplace.json is valid JSON"

  # Check required fields
  local errors
  errors="$(jq -r '
    [
      (if has("name") then empty else "name" end),
      (if has("owner") then (if .owner | has("name") then empty else "owner.name" end) else "owner" end),
      (if has("plugins") then (if (.plugins | type) == "array" then empty else "plugins (must be array)" end) else "plugins" end)
    ] |
    if has("plugins") and (.plugins | type) == "array" then
      . + [
        (.plugins | map(select(has("name") | not)) | to_entries | map("plugins[" + (.key|tostring) + "] missing name")[]),
        (.plugins | map(select(has("source") | not)) | to_entries | map("plugins[" + (.key|tostring) + "] missing source")[]),
        (
          .plugins | map(select(has("name")).name) |
          reduce .[] as $item ({}; .[$item] += 1) |
          to_entries | map(select(.value > 1).key) |
          if length > 0 then "duplicate plugin names: " + join(", ") else empty end
        )
      ]
    else . end | join("|")
  ' "$MARKETPLACE" 2>/dev/null)" || true

  if [[ -n "$errors" ]]; then
    IFS='|' read -ra errs <<< "$errors"
    for err in "${errs[@]}"; do
      if [[ -n "$err" ]]; then
        log_fail "marketplace.json: missing or invalid field '${err}'"
      fi
    done
    if [[ -n "$errors" ]]; then return 1; fi
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
  if ! jq . "$manifest" >/dev/null 2>&1; then
    log_fail "plugin.json is not valid JSON"
    fail_count=$((fail_count + 1))
    return
  fi
  log_pass "plugin.json is valid JSON"

  # 3. Check required fields: name, version, description
  for field in name version description; do
    local value
    value="$(jq -r ".$field // empty" "$manifest" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')" || true

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
    has_field="$(jq -e "has(\"$field\")" "$manifest" >/dev/null 2>&1 && echo "yes" || echo "no")"

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
    files="$(jq -r ".${array_field}[]? | strings" "$manifest" 2>/dev/null)" || true

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
    if ! jq . "$mcp_file" >/dev/null 2>&1; then
      log_fail ".mcp.json is not valid JSON"
      failed=1
    else
      log_pass ".mcp.json is valid JSON"
    fi
  fi

  # 8. Validate hooks format (should use object with "hooks" key, not flat array)
  local hooks_files
  hooks_files="$(jq -r ".hooks[]? | strings" "$manifest" 2>/dev/null)" || true

  if [[ -n "$hooks_files" ]]; then
    while IFS= read -r hook_file; do
      local hook_path="$dir/$hook_file"
      if [[ -f "$hook_path" ]]; then
        local is_array
        local has_hooks_key

        is_array="$(jq 'type == "array"' "$hook_path" 2>/dev/null || echo "false")"
        has_hooks_key="$(jq 'type == "object" and has("hooks")' "$hook_path" 2>/dev/null || echo "false")"

        if [[ "$is_array" == "true" ]]; then
          log_warn "Hooks file '${hook_file}' uses flat array format — should use object with 'hooks' key"
          warn_count=$((warn_count + 1))
        elif [[ "$has_hooks_key" == "true" ]]; then
          log_pass "Hooks file '${hook_file}' uses correct format"
        fi
      fi
    done <<< "$hooks_files"
  fi

  # 9. Check for relative paths in hooks/MCP that should use CLAUDE_PLUGIN_ROOT
  local hooks_warnings
  hooks_warnings="$(jq -r '
    if .hooks | type == "object" then
      if (.hooks | tostring | test("\\./hooks/|\\./scripts/")) then "WARN_HOOKS" else empty end
    else empty end
  ' "$manifest" 2>/dev/null)" || true

  local mcp_warnings
  mcp_warnings="$(jq -r '
    if .mcpServers | type == "object" then
      .mcpServers | to_entries[] |
      if (.value.args | type == "array" and (.value.args | join(" ") | test("\\./[a-z]"))) or (.value.command | type == "string" and (.value.command | test("\\./[a-z]"))) then
        "WARN_MCP:" + .key
      else empty end
    else empty end
  ' "$manifest" 2>/dev/null)" || true

  if [[ "$hooks_warnings" == "WARN_HOOKS" ]]; then
    log_warn "Inline hooks use relative paths — consider using \${CLAUDE_PLUGIN_ROOT}"
    warn_count=$((warn_count + 1))
  fi

  if [[ -n "$mcp_warnings" ]]; then
    while IFS= read -r warning; do
      if [[ -n "$warning" && "$warning" == WARN_MCP:* ]]; then
        local srv="${warning#WARN_MCP:}"
        log_warn "MCP server '${srv}' uses relative paths — consider using \${CLAUDE_PLUGIN_ROOT}"
        warn_count=$((warn_count + 1))
      fi
    done <<< "$mcp_warnings"
  fi

  # 10. MCP consistency: if plugin.json has mcpServers, warn if .mcp.json missing
  local has_mcp_in_manifest
  has_mcp_in_manifest="$(jq -e '.mcpServers | type == "object" and length > 0' "$manifest" >/dev/null 2>&1 && echo "yes" || echo "no")"

  if [[ "$has_mcp_in_manifest" == "yes" && ! -f "$mcp_file" ]]; then
    log_warn "plugin.json declares mcpServers but .mcp.json does not exist"
    warn_count=$((warn_count + 1))
  fi

  if [[ "$failed" -eq 1 ]]; then
    fail_count=$((fail_count + 1))
  else
    pass_count=$((pass_count + 1))
  fi
}

# -------------------------------------------------------------------
# Hook Security Scanner
# -------------------------------------------------------------------
validate_hook_security() {
  local dir="$1"
  local name
  name="$(basename "$dir")"
  local found_issues=0

  # Find all .sh files under the plugin directory
  while IFS= read -r sh_file; do
    local rel_path="${sh_file#$dir/}"
    local content
    content="$(cat "$sh_file" 2>/dev/null)" || continue

    # Check for eval usage
    if echo "$content" | grep -qE '(^|[^a-zA-Z_])eval[[:space:]]'; then
      log_warn "[security] ${name}/${rel_path}: uses 'eval' — review for injection risk"
      warn_count=$((warn_count + 1))
      found_issues=1
    fi

    # Check for unquoted $TOOL_INPUT
    if echo "$content" | grep -qE '\$TOOL_INPUT[^"]' | grep -vqE '"\$TOOL_INPUT' 2>/dev/null; then
      : # handled below
    fi
    if echo "$content" | grep -qP '(?<!")\$TOOL_INPUT(?!")' 2>/dev/null || \
       echo "$content" | grep -qE '[^"]\$TOOL_INPUT[^"a-zA-Z_]' 2>/dev/null; then
      log_warn "[security] ${name}/${rel_path}: unquoted \$TOOL_INPUT — should be \"\$TOOL_INPUT\""
      warn_count=$((warn_count + 1))
      found_issues=1
    fi

    # Check for backtick command substitution with user input
    if echo "$content" | grep -qE '`[^`]*\$TOOL_INPUT[^`]*`'; then
      log_warn "[security] ${name}/${rel_path}: backtick substitution with \$TOOL_INPUT — use \$(…) with proper quoting"
      warn_count=$((warn_count + 1))
      found_issues=1
    fi

    # Check for $(...) with TOOL_INPUT or TOOL_INPUT_COMMAND inside
    if echo "$content" | grep -qE '\$\([^)]*\$(TOOL_INPUT|TOOL_INPUT_COMMAND)'; then
      log_warn "[security] ${name}/${rel_path}: command substitution contains \$TOOL_INPUT — injection risk"
      warn_count=$((warn_count + 1))
      found_issues=1
    fi

  done < <(find "$dir" -name "*.sh" -type f 2>/dev/null)

  if [[ "$found_issues" -eq 0 ]]; then
    # Only log if there were .sh files to check
    local sh_count
    sh_count="$(find "$dir" -name "*.sh" -type f 2>/dev/null | wc -l | tr -d ' ')"
    if [[ "$sh_count" -gt 0 ]]; then
      log_pass "Hook security: ${sh_count} shell script(s) scanned, no issues"
    fi
  fi
}

# -------------------------------------------------------------------
# Validate AGENTS.md byte limit (per-plugin: 2 KiB)
# -------------------------------------------------------------------
validate_agents_md() {
  local dir="$1"
  local name; name="$(basename "$dir")"
  local agents_file="$dir/AGENTS.md"
  if [[ -f "$agents_file" ]]; then
    local byte_count
    byte_count="$(wc -c < "$agents_file" | tr -d ' ')"
    if [[ "$byte_count" -gt 2048 ]]; then
      log_fail "${name}/AGENTS.md exceeds 2 KiB (${byte_count} bytes)"
      fail_count=$((fail_count + 1))
    else
      log_pass "${name}/AGENTS.md size OK (${byte_count} bytes)"
    fi
  fi
}

# -------------------------------------------------------------------
# Validate .cursor/rules/*.mdc frontmatter fields
# -------------------------------------------------------------------
validate_cursor_mdc() {
  local dir="$1"
  local name; name="$(basename "$dir")"
  local rules_dir="$dir/.cursor/rules"
  if [[ -d "$rules_dir" ]]; then
    while IFS= read -r mdc_file; do
      local rel="${mdc_file#$dir/}"
      local has_desc has_globs
      has_desc="$(head -10 "$mdc_file" | grep -c '^description:' || true)"
      has_globs="$(head -10 "$mdc_file" | grep -c '^globs:' || true)"
      if [[ "$has_desc" -eq 0 ]]; then
        log_fail "${name}/${rel}: missing 'description' in frontmatter"
        fail_count=$((fail_count + 1))
      fi
      if [[ "$has_globs" -eq 0 ]]; then
        log_fail "${name}/${rel}: missing 'globs' in frontmatter"
        fail_count=$((fail_count + 1))
      fi
    done < <(find "$rules_dir" -name "*.mdc" -type f 2>/dev/null)
  fi
}

# -------------------------------------------------------------------
# Validate SKILL.md rules
# -------------------------------------------------------------------
validate_skills() {
  local dir="$1"
  local name="$(basename "$dir")"
  
  if [[ -d "$dir/skills" ]]; then
    while IFS= read -r skill_file; do
      local rel_path="${skill_file#$dir/}"
      
      # Extract name and description from YAML frontmatter
      local skill_name=$(awk '/^---/{p++} p==1 && /^name:/{print substr($0, index($0,$2))} p==2{exit}' "$skill_file" | tr -d '"'\''\r' | sed 's/^[ \t]*//;s/[ \t]*$//')
      local skill_desc=$(awk '/^---/{p++} p==1 && /^description:/{print substr($0, index($0,$2))} p==2{exit}' "$skill_file" | tr -d '"'\''\r' | sed 's/^[ \t]*//;s/[ \t]*$//')
      
      if [[ -z "$skill_name" ]]; then
        log_fail "${name}/${rel_path}: missing name in frontmatter"
        fail_count=$((fail_count + 1))
      elif [[ ${#skill_name} -gt 64 ]]; then
        log_fail "${name}/${rel_path}: name exceeds 64 characters (${#skill_name})"
        fail_count=$((fail_count + 1))
      fi
      
      if [[ -z "$skill_desc" ]]; then
        log_fail "${name}/${rel_path}: missing description in frontmatter"
        fail_count=$((fail_count + 1))
      else
        if [[ ${#skill_desc} -gt 1024 ]]; then
          log_fail "${name}/${rel_path}: description exceeds 1024 characters (${#skill_desc})"
          fail_count=$((fail_count + 1))
        fi
        
        if ! echo "$skill_desc" | grep -qi "use when"; then
          log_fail "${name}/${rel_path}: description missing 'Use when...' trigger"
          fail_count=$((fail_count + 1))
        fi
      fi
    done < <(find "$dir/skills" -name "SKILL.md" -type f 2>/dev/null)
  fi
}

# -------------------------------------------------------------------
# Skills Index Sync Check
# -------------------------------------------------------------------
validate_skills_index() {
  local index_file="$ROOT_DIR/skills_index.json"

  echo -e "\n${BOLD}Validating skills_index.json${NC}"

  if [[ ! -f "$index_file" ]]; then
    log_warn "skills_index.json not found at repo root — run scripts/generate-skills-index.sh"
    warn_count=$((warn_count + 1))
    return
  fi
  log_pass "skills_index.json exists"

  if ! jq . "$index_file" >/dev/null 2>&1; then
    log_fail "skills_index.json is not valid JSON"
    fail_count=$((fail_count + 1))
    return
  fi
  log_pass "skills_index.json is valid JSON"

  # Count actual files vs index entries
  local actual_count
  actual_count="$(find "$PLUGINS_DIR" \( -path "*/agents/*.md" -o -path "*/skills/*/SKILL.md" -o -path "*/commands/*.md" \) | wc -l | tr -d ' ')"

  local index_count
  index_count="$(jq -r '.entries | length' "$index_file" 2>/dev/null)" || index_count=0

  local diff=$((actual_count - index_count))
  if [[ "$diff" -lt 0 ]]; then diff=$((-diff)); fi

  if [[ "$diff" -gt 5 ]]; then
    log_warn "skills_index.json has ${index_count} entries but found ${actual_count} files (diff: ${diff}) — regenerate with scripts/generate-skills-index.sh"
    warn_count=$((warn_count + 1))
  else
    log_pass "skills_index.json entry count (${index_count}) matches file count (${actual_count})"
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
  validate_hook_security "$plugin_dir"
  validate_skills "$plugin_dir"
  validate_agents_md "$plugin_dir"
  validate_cursor_mdc "$plugin_dir"
done

validate_skills_index

# Repo-level AGENTS.md size check
repo_agents="$ROOT_DIR/AGENTS.md"
if [[ -f "$repo_agents" ]]; then
  bytes="$(wc -c < "$repo_agents" | tr -d ' ')"
  if [[ "$bytes" -gt 6144 ]]; then
    log_fail "Repo-level AGENTS.md exceeds 6 KiB (${bytes} bytes)"
    fail_count=$((fail_count + 1))
  else
    log_pass "Repo-level AGENTS.md size OK (${bytes} bytes)"
  fi
fi

echo ""
echo "========================="
echo -e "${BOLD}Summary:${NC} ${total_count} plugins checked, ${GREEN}${pass_count} passed${NC}, ${RED}${fail_count} failed${NC}, ${YELLOW}${warn_count} warnings${NC}"

if [[ "$fail_count" -gt 0 ]]; then
  exit 1
fi
exit 0
