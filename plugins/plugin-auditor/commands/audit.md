---
name: audit
description: Scan a plugin directory for security risks and configuration issues
---

You are auditing a plugin for security risks before installation.

Take $ARGUMENTS as the path to a plugin directory. If not provided, ask for the plugin path.

Perform these security checks:

1. **Plugin manifest validation**:
   - Verify `.claude-plugin/plugin.json` exists and is valid JSON
   - Check required fields: name, version, description
   - Validate version follows semver
   - Check all referenced files (commands, agents, skills, hooks) actually exist

2. **Hook script analysis** (CRITICAL):
   - Read all files referenced in hooks JSON
   - Check for shell injection risks: unquoted variables, eval usage, backtick execution
   - Flag any network calls (curl, wget, nc, etc.)
   - Flag any file operations outside the project directory
   - Flag any environment variable reads that could leak secrets

3. **MCP server audit**:
   - Read `.mcp.json` if present
   - Verify all server packages are from known/trusted sources (@modelcontextprotocol/*, @cloudflare/*, @upstash/*, @taazkareem/*)
   - Check for hardcoded credentials (API keys, tokens, passwords)
   - Verify all secrets use `${ENV_VAR}` interpolation syntax
   - Flag any unknown or custom MCP server packages

4. **Command and agent review**:
   - Read all command and agent markdown files
   - Check for instructions that could lead to data exfiltration
   - Flag any commands that encourage disabling safety features
   - Check for references to external URLs or services

5. **Environment variable check**:
   - List all `${ENV_VAR}` references found across all files
   - Cross-reference with `.env.example` if it exists
   - Flag any hardcoded URLs, IPs, or credentials

6. **Generate security report**:
```
=== PLUGIN SECURITY AUDIT ===
Plugin: {name} v{version}

CRITICAL ({count})
  - [CRIT-001] Hook script uses eval: hooks/scripts/deploy.sh:15

WARNINGS ({count})
  - [WARN-001] Unknown MCP server package: @custom/server-xyz
  - [WARN-002] Command references external URL: commands/sync.md:23

INFO ({count})
  - [INFO-001] 3 environment variables required
  - [INFO-002] 2 MCP servers configured

VERDICT: {PASS | REVIEW RECOMMENDED | FAIL}
```

Assign verdict based on: any CRITICAL = FAIL, any WARNING = REVIEW RECOMMENDED, only INFO = PASS.
