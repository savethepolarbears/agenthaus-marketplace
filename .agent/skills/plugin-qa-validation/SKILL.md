---
name: plugin-qa-validation
description: Use when validating a plugin's quality before publishing — checks JSON syntax, YAML frontmatter, cross-references marketplace.json, verifies env var documentation, and optionally tests storefront rendering via the browser agent. Triggers on "validate plugin", "check plugin", "plugin QA", "test plugin quality".
---

# Plugin QA Validation Skill

## Goal

Perform comprehensive quality assurance on a Claude Code/Cowork plugin before marketplace publication.

## Procedure

### Phase 1: Structure Validation

1. Verify required files exist:
   - `plugins/<name>/.claude-plugin/plugin.json` (required)
   - `plugins/<name>/README.md` (required)
   - At least one of: `commands/`, `agents/`, `skills/`

2. Verify no empty directories — only create directories for components the plugin uses.

### Phase 2: Manifest Validation

1. Parse `plugin.json` and check:
   - `name` — present, kebab-case, matches directory name
   - `version` — present, valid semver
   - `description` — present, under 150 characters, starts with action verb
   - `author` — recommended
   - `license` — recommended
   - `tags` — array of valid category strings

2. Check file references:
   - All paths in `commands`, `agents`, `skills`, `hooks` arrays point to existing files
   - **No glob patterns** — only explicit file paths
   - All paths are relative to the plugin directory

### Phase 3: Command & Agent Validation

1. For each command `.md` file:
   - Verify YAML frontmatter exists with `name` and `description`
   - Check instructions are substantive (not just placeholder text)

2. For each agent `.md` file:
   - Verify YAML frontmatter with `name`, `description`, `model`
   - Check model value is valid (sonnet, haiku, opus, claude-3-7-sonnet, etc.)

### Phase 4: Hooks & MCP Validation

1. If `hooks/hooks.json` exists:
   - Verify JSON is valid
   - Confirm object format with `hooks` key (not flat array)
   - Check script references use `${CLAUDE_PLUGIN_ROOT}`, not relative paths

2. If `.mcp.json` exists:
   - Verify JSON is valid
   - Confirm `mcpServers` key exists
   - Check env vars use `${VAR}` interpolation, no hardcoded secrets

### Phase 5: Documentation Validation

1. Check README.md includes:
   - Plugin name and description
   - Installation instructions
   - Available commands/agents with usage examples
   - Required environment variables (if any)

2. Cross-reference env vars:
   - All `${VAR}` references in MCP/hooks configs are documented in README
   - All documented env vars exist in `.env.example`

### Phase 6: Marketplace Cross-Reference

1. Check if plugin is registered in `.claude-plugin/marketplace.json`
2. If registered, verify:
   - `name` matches plugin.json
   - `source` path is correct and relative
   - `category` is a valid standard category

### Phase 7: Browser QA (Optional)

If the storefront is running (`http://localhost:3000`):

1. Navigate to the storefront
2. Search for the plugin by name
3. Verify the plugin card renders with correct name, description, and category badge
4. Capture a screenshot as evidence

## Output Format

Produce a validation report with:

- ✅ PASS / ❌ FAIL / ⚠️ WARN for each check
- Summary: total checks, passes, failures, warnings
- Actionable fix instructions for any failures

## Constraints

- Never modify plugin files during validation (read-only)
- Report all issues, don't stop at the first failure
- Distinguish between hard failures (blocking) and warnings (advisory)

## Common Issues

| Issue | Severity | Fix |
| ------- | ---------- | ----- |
| Glob patterns in plugin.json | FAIL | Replace with explicit file paths |
| Flat array hooks format | WARN | Migrate to object format with `hooks` key |
| Relative paths without `${CLAUDE_PLUGIN_ROOT}` | WARN | Replace `./hooks/` with `${CLAUDE_PLUGIN_ROOT}/hooks/` |
| Missing env var documentation | FAIL | Add to README and `.env.example` |
| plugin.json name mismatch with directory | FAIL | Ensure name matches directory name |

## Failure Modes & Recovery

| Failure | Detection | Recovery |
|---------|-----------|----------|
| Validation script not found | `scripts/validate-plugins.sh` missing | Check repo root; ensure scripts/ directory exists |
| Plugin directory structure invalid | Missing .claude-plugin/ or plugin.json | Guide user through required structure per CONTRIBUTING.md |
| MCP server fails to start | Connection timeout or command error | Verify env vars are set; test MCP server command manually |
| Hook script fails security scan | Dangerous pattern detected | Review script against security guidelines; use printf instead of echo |
