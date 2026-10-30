# API Contracts & Schemas

Reference documentation for data formats used across the marketplace.

## plugin.json Manifest

Every plugin requires `.claude-plugin/plugin.json` with these fields:

```json
{
  "name": "plugin-name",           // Required: kebab-case identifier
  "description": "What it does",   // Required: human-readable description, minimum 10 characters
  "version": "1.0.0",             // Required: semver
  "author": "Author Name",        // Recommended
  "homepage": "https://...",       // Recommended
  "license": "MIT",               // Recommended
  "tags": ["category"],           // Array of category strings
  "commands": ["./commands/cmd.md"],  // Explicit paths, NOT globs
  "agents": ["./agents/agent.md"],
  "skills": ["./skills/name"],
  "hooks": ["./hooks/hooks.json"],
  "mcpServers": {}                 // Inline MCP server configs
}
```

> **Critical:** Use explicit component paths, never globs. Skills use directory paths (`"./skills/name"`) containing SKILL.md; commands use explicit Markdown file paths. Installed Claude native validation verifies the current corpus.

## marketplace.json Registry

Located at `.claude-plugin/marketplace.json`:

```json
{
  "name": "agenthaus-marketplace",
  "owner": { "name": "AgentHaus Team" },
  "metadata": {
    "description": "...",
    "version": "1.0.0",
    "pluginRoot": "./plugins"
  },
  "plugins": [
    {
      "name": "plugin-name",        // Must match plugin.json name
      "source": "./plugins/name",   // Relative path from marketplace.json
      "category": "devops",         // Standard category
      "description": "User-facing"  // Not developer jargon
    }
  ]
}
```

## Command Frontmatter

Every command `.md` file requires YAML frontmatter:

```yaml
---
name: command-name
description: What this command does
---
```

The file/folder name becomes the slash command name.

## Agent Frontmatter

Agent `.md` files require:

```yaml
---
name: agent-name
description: What this agent specializes in
model: sonnet
---
```

## Skill Frontmatter

Every `SKILL.md` requires:

```yaml
---
name: skill-name
description: When and why to use this skill. Include trigger phrases.
---
```

## Hooks Format

Hooks use object format with `hooks` key (NOT flat array):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "tool_name",
        "hooks": [{ "type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/script.sh" }]
      }
    ],
    "PostToolUse": []
  }
}
```

## MCP Server Config

Either inline in plugin.json or in `.mcp.json`:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@scope/server-name"],
      "env": {
        "API_KEY": "${ENV_VAR_NAME}"
      }
    }
  }
}
```

> **Critical:** Always use `${ENV_VAR}` interpolation — never hardcode credentials.

Remote servers use `"type": "http"` (or `"sse"`) with `url` and optional `headers`; Claude Code rejects other `type` values.

## Installer Ownership State

`agenthaus install` merges plugin MCP servers into provider configs and records ownership in `~/.agenthaus/state.json` (override with `AGENTHAUS_STATE_FILE`); provider configs carry no agenthaus keys:

```json
{
  "version": 1,
  "mcp": {
    "/abs/path/.cursor/mcp.json": {
      "<plugin>": { "<sourceKey>": { "key": "<destKey>", "managed": true } }
    }
  }
}
```

- `key` differs from `sourceKey` when the name was taken (`<plugin>-<name>`, then `-2`, `-3`, ...).
- `managed: false` marks a pre-existing identical user entry the plugin reuses; it is never deleted.
- Legacy in-config `_agenthaus_mcp` / `_agenthaus_mcp_map` markers are imported and stripped on the next write; namespaced legacy keys (`<plugin>-…`) import as managed, bare keys as unmanaged (provenance unknown, never deleted).
- Codex uses a marked `# >>> agenthaus:<plugin> >>>` block in `config.toml` instead of the state file.

## QA-Droid STDIO MCP

`plugins/qa-droid/index.js` registers SDK request schemas for `tools/list` and
`tools/call`. `visit_and_report` requires an HTTP or HTTPS `url` and returns the
page title. Unknown tools and invalid URLs produce protocol errors; browser
failures produce `isError: true` tool results. Every launched browser is closed
in a `finally` block. `npm test` in that plugin runs the real STDIO/browser smoke
test against a local HTTP fixture; CI is configured for Node 20, 22, and 24. Hosted results are separate evidence.

## Environment Variables

See `.env.example` and each plugin README for required symbolic environment names. Never record secret values in a declaration, receipt or validation output.

## Modular runtime contracts

Native plugin manifests stay canonical. Optional agenthaus.json sidecars follow schemas/agenthaus-metadata.schema.json; requested permissions remain declarations, with missing fields unknown. Skill metadata is validated by src/skill-metadata.js. Capabilities follow schemas/capabilities.schema.json and expose stable identities/digests without full bodies; paging is hash-bound and byte-limited.

Task/result envelopes follow schemas/handoff.schema.json. Actor strings identify declared participants; they do not authenticate OS identities. SQLite blackboard claims require current owner/fence on heartbeat and terminal transitions. CLI legacy plans are limited to4MiB on both preview and apply; preview cannot overwrite database/journal/legacy paths. Migration apply requires an explicitly stopped legacy owner, reviewed plan/resolutions and backup/readback.

Reviewed locks follow schemas/content-lock.schema.json. Verification never renews them. Strict install/update/sync supports genuine copied Cursor/Codex/Copilot/Windsurf payloads, rejects unsupported derivations and validates source/destination before mutation. Dependencies, secrets and external derived provider configuration remain outside payload locks.

Hook results follow schemas/hook-result.schema.json. Allowed requires successful launch/exit0 without timeout, signal or overflow. PreToolUse block/error maps to native denial; PostToolUse cannot undo an action. Required unsupported filesystem/network isolation rejects before launch. Independent-session descendants and Windows process-tree containment remain unsupported.

Guard approval receipts follow schemas/approval-receipt.schema.json and bind the reviewed launch descriptor, request digest, actor/provider/scope, policy and expiry. Only validated correlation metadata is normalized for hashing/forwarding. Nonce replay fails closed. Independently protected operator storage is still a deployment acceptance requirement. See source APIs and README for exact executable CLI arguments; no live provider or production acceptance is inferred from these schemas.
