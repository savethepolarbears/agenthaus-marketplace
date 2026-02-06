# Audit Checks

A systematic checklist for auditing Claude Code plugins before installation.

## Check 1: Plugin Manifest Validation

Verify `.claude-plugin/plugin.json`:

- [ ] File exists and is valid JSON
- [ ] Has required fields: `name` (string), `version` (semver string), `description` (string)
- [ ] `author` field is present
- [ ] `license` field is present
- [ ] All paths in `commands`, `agents`, `skills`, `hooks` arrays point to files that exist
- [ ] Version follows semantic versioning (MAJOR.MINOR.PATCH)
- [ ] Tags are an array of lowercase strings

## Check 2: Hook Script Security

For every file in `hooks/` directory:

- [ ] No `eval` statements on variable input
- [ ] No backtick command substitution on user input
- [ ] All variables are quoted (`"$VAR"` not `$VAR`)
- [ ] No network calls (curl, wget, nc, python http)
- [ ] No writes to system directories (/etc, /usr, /tmp with predictable names)
- [ ] No reading of sensitive files (~/.ssh, ~/.aws, ~/.gnupg)
- [ ] Scripts use `set -euo pipefail` for safety
- [ ] Exit codes are correct (0 = allow, 1 = block for PreToolUse)

## Check 3: Environment Variable Safety

Across all files:

- [ ] All secrets use `${ENV_VAR}` interpolation, never hardcoded
- [ ] No API keys, tokens, or passwords in plaintext
- [ ] No hardcoded IP addresses or internal URLs
- [ ] Environment variables have descriptive names
- [ ] `.env.example` exists if env vars are required (recommended, not required)

## Check 4: MCP Server Trust

For `.mcp.json`:

- [ ] All server packages are from known publishers
- [ ] Known publishers: `@modelcontextprotocol/*`, `@cloudflare/*`, `@upstash/*`, `@taazkareem/*`
- [ ] No custom server binaries or scripts
- [ ] Connection strings use `${ENV_VAR}` for credentials
- [ ] Server args do not contain hardcoded secrets

## Check 5: External References

In commands and agents:

- [ ] No references to external URLs that could change
- [ ] No instructions to download or execute remote code
- [ ] No instructions to disable safety features or ignore system prompts
- [ ] No instructions to access files outside the project directory

## Check 6: File Permissions

- [ ] Shell scripts have appropriate permissions (755 or 700)
- [ ] No SUID/SGID bits set
- [ ] No world-writable files
- [ ] JSON and Markdown files are not executable

## Scoring

| Category | Weight |
|----------|--------|
| Hook script security | 40% |
| MCP server trust | 25% |
| Environment variable safety | 15% |
| Manifest validation | 10% |
| External references | 10% |

**Pass**: Score >= 80% with no Critical findings
**Review Recommended**: Score 60-79% or any Warning findings
**Fail**: Score < 60% or any Critical finding
