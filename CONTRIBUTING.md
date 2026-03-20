# Contributing to AgentHaus

Thank you for your interest in contributing to AgentHaus! This guide will help you create plugins that integrate seamlessly with Claude Code.

> **Official reference:** [Create plugins](https://code.claude.com/docs/en/plugins) | [Plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces) | [Plugins reference](https://code.claude.com/docs/en/plugins-reference)

## Plugin Structure

Each plugin should follow this directory structure:

```text
plugins/your-plugin/
├── .claude-plugin/
│   └── plugin.json          # Required: Plugin manifest
├── .mcp.json                 # Optional: MCP server configs
├── commands/                 # Optional: Custom slash commands
│   └── your-command.md
├── agents/                   # Optional: Subagent definitions
│   └── your-agent.md
├── skills/                   # Optional: Skill instructions
│   └── your-skill/
│       └── SKILL.md
├── hooks/                    # Optional: Event hooks
│   └── hooks.json
├── .lsp.json                 # Optional: LSP server configs
└── README.md                 # Required: Plugin documentation
```

> **Important:** Don't put `commands/`, `agents/`, `skills/`, or `hooks/` inside the `.claude-plugin/` directory. Only `plugin.json` goes inside `.claude-plugin/`. All other directories must be at the plugin root level.

## Plugin Manifest & Agentic Discoverability

To maximize your plugin's discoverability in Claude Code marketplaces and agentic AI tools, the manifest metadata must be precise. AI agents load this configuration upon startup.

Create `.claude-plugin/plugin.json` following the [JSON schema](./schemas/plugin.schema.json):

```json
{
  "name": "your-plugin",
  "version": "1.0.0",
  "description": "Brief description of your plugin (10+ characters)",
  "author": {
    "name": "Your Name",
    "email": "you@example.com"
  },
  "homepage": "https://github.com/savethepolarbears/agenthaus-marketplace",
  "repository": "https://github.com/savethepolarbears/agenthaus-marketplace",
  "license": "MIT",
  "tags": ["category1", "category2"],
  "commands": ["./commands/your-command.md"],
  "agents": ["./agents/your-agent.md"],
  "skills": ["./skills/your-skill/SKILL.md"],
  "hooks": ["./hooks/hooks.json"]
}
```

The `name` field is used as the skill namespace prefix. For example, a plugin named `my-plugin` with a command `hello` creates the command `/my-plugin:hello`.

### Required Fields

| Field         | Type   | Description                            |
| ------------- | ------ | -------------------------------------- |
| `name`        | string | Kebab-case plugin identifier           |
| `version`     | string | Semantic version (e.g., `1.0.0`)       |
| `description` | string | Human-readable description (10+ chars) |

### Recommended Fields

| Field        | Type          | Description                                        |
| ------------ | ------------- | -------------------------------------------------- |
| `author`     | string/object | Author name or `{ "name": "...", "email": "..." }` |
| `homepage`   | string        | URL to plugin or marketplace repo                  |
| `repository` | string        | Source code repository URL                         |
| `license`    | string        | SPDX license identifier (e.g., `MIT`)              |
| `tags`       | string[]      | Category tags for discoverability                  |
| `keywords`   | string[]      | Keywords for plugin search                         |

### Capability Fields

Only include fields for capabilities your plugin provides:

- `commands` — Relative paths to command Markdown files or directories
- `agents` — Relative paths to agent Markdown files
- `skills` — Relative paths to skill SKILL.md files
- `hooks` — Relative paths to hook JSON files, or inline hooks configuration
- `mcpServers` — MCP server configurations (object or path to `.mcp.json`)
- `lspServers` — LSP server configurations for code intelligence

## MCP Configuration

If your plugin uses MCP servers, add them inline in `plugin.json` and create a standalone `.mcp.json`:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@scope/mcp-server-name"],
      "env": {
        "API_KEY": "${YOUR_API_KEY}"
      }
    }
  }
}
```

Use `${ENV_VAR}` syntax for environment variables. **Never hardcode secrets.**

## Commands

Create custom slash commands in `commands/`:

```markdown
---
description: What this command does
---

Instructions for Claude when the user runs /your-plugin:your-command.

Use $ARGUMENTS to reference user input.
```

The folder or file name becomes the command name, prefixed with your plugin namespace.

## Agents

Define subagents in `agents/`:

```markdown
---
name: your-agent
description: What this agent does
model: sonnet
---

System prompt for the agent.
```

Available models: `sonnet`, `haiku`, `opus`. Always use the alias, never a pinned version string — pinned versions go stale and break the generator's model validation.

## Skills

Skills are model-invoked: Claude automatically uses them based on the task context. Create skills in `skills/<skill-name>/SKILL.md`:

```markdown
---
name: your-skill
description: Reviews code for best practices. Use when reviewing code or checking PRs.
---

When reviewing code, check for:
1. Code organization and structure
2. Error handling
3. Security concerns
4. Test coverage
```

Skills need frontmatter with `name` and `description` fields. The description is crucial for discoverability in AI marketplaces—it helps Claude decide when to dynamically load and apply the full file contents while conserving active token usage.

## Hooks

Define event hooks in `hooks/hooks.json`. Hooks must use the official Claude Code format:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs npm run lint:fix"
          }
        ]
      }
    ]
  }
}
```

Event types: `PreToolUse` (can block tool execution), `PostToolUse` (logging/side effects).

The hook command receives hook input as JSON on stdin. Use `jq` to extract fields like file paths.

### Using `${CLAUDE_PLUGIN_ROOT}`

When hooks or MCP servers reference scripts inside your plugin, use `${CLAUDE_PLUGIN_ROOT}` instead of relative paths. Plugins are copied to a cache directory on install, so relative paths like `./hooks/scripts/my-script.sh` won't resolve. Use:

```json
{
  "type": "command",
  "command": "bash \"${CLAUDE_PLUGIN_ROOT}/hooks/scripts/my-script.sh\""
}
```

This also applies to MCP server configurations that reference local files:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/server/index.js"]
    }
  }
}
```

## LSP Servers

Plugins can include LSP (Language Server Protocol) configurations for code intelligence. Create `.lsp.json` at your plugin root:

```json
{
  "go": {
    "command": "gopls",
    "args": ["serve"],
    "extensionToLanguage": {
      ".go": "go"
    }
  }
}
```

Users must have the language server binary installed on their machine.

## Validation

### Built-in Validation

Use Claude Code's built-in validation from within a session:

```bash
/plugin validate .
```

Or from the command line:

```bash
claude plugin validate .
```

### Repository Validation Script

Run the repository validation script before submitting:

```bash
bash scripts/validate-plugins.sh
```

This checks:

- Valid JSON for plugin.json and .mcp.json
- Required fields present (name, version, description)
- All referenced files exist
- README.md present
- Hooks format consistency
- Marketplace.json validity

Your plugin must also conform to `schemas/plugin.schema.json`.

## Testing

### Local Development Testing

Use `--plugin-dir` to test your plugin without installation:

```bash
claude --plugin-dir ./plugins/your-plugin
```

You can load multiple plugins at once:

```bash
claude --plugin-dir ./plugins/plugin-one --plugin-dir ./plugins/plugin-two
```

### What to Test

1. **Commands** — Run each command and verify output
2. **Agents** — Check they appear in `/agents` and respond correctly
3. **Skills** — Verify they trigger on relevant tasks
4. **Hooks** — Confirm they fire on the correct events
5. **MCP servers** — Test all environment variable references resolve correctly

## Security Best Practices

1. **Never hardcode secrets** — Use `${ENV_VAR}` interpolation in MCP configs
2. **Review hooks carefully** — Shell commands in hooks are an injection surface
3. **Use `${CLAUDE_PLUGIN_ROOT}`** — For referencing plugin-local scripts in hooks and MCP configs
4. **Validate inputs at system boundaries** — User input, external API responses
5. **Audit MCP servers** — Only use MCP servers from providers you trust
6. **Don't reference files outside the plugin** — Plugins are cached; `../` paths won't work
7. **Pin MCP server versions** — Use specific versions in npx args (e.g., `@scope/server@1.2.3`)

## Best Practices

1. **Include clear documentation** — README with examples and env var table
2. **Add meaningful tags and keywords** — Help users find your plugin
3. **Follow semantic versioning** — For plugin versions
4. **Test locally with `--plugin-dir`** — Before submitting
5. **Keep plugins focused** — One plugin per concern; compose with multi-plugin installs
6. **Use the official hooks format** — Object with `hooks` key, not flat arrays
7. **Document required environment variables** — In both README and plugin description

## Cross-Platform Support

AgentHaus plugins target 6 platforms: Claude Code, Codex CLI, Gemini CLI, Cursor, Windsurf, and Claude Desktop. The generator at `scripts/generate-cross-platform.js` reads Claude-native plugin sources and emits per-platform config files automatically.

### Generated Files

For each plugin, the generator produces:

| File | Platform | Purpose |
| ---- | -------- | ------- |
| `AGENTS.md` | Codex CLI, Windsurf | Prose context: capabilities, limitations, usage |
| `GEMINI.md` | Gemini CLI | Prose context with MCP configuration guidance |
| `.cursor/rules/<name>.mdc` | Cursor | MDC rule file with description, globs, alwaysApply frontmatter |
| `gemini-settings-snippet.json` | Gemini CLI | mcpServers snippet for `~/.gemini/settings.json` (MCP plugins only) |
| `.cursor/mcp.json` | Cursor | mcpServers config with `${env:VAR}` syntax (MCP plugins only) |
| `claude-desktop-snippet.json` | Claude Desktop | mcpServers snippet for `claude_desktop_config.json` (MCP plugins only) |

The generator is idempotent: re-running on unchanged sources produces byte-for-byte identical output.

### Running the Generator

After editing any plugin source file (plugin.json, SKILL.md, hooks.json, .mcp.json), regenerate all cross-platform configs:

```bash
node scripts/generate-cross-platform.js
```

Then validate the output:

```bash
bash scripts/validate-plugins.sh
```

The validation script checks AGENTS.md byte count (must be under 2 KiB per plugin), .mdc frontmatter validity, and file reference resolution.

### Platform Limitations

The generator embeds platform limitation notices automatically based on plugin capabilities:

- **Hook-dependent plugins** (`circuit-breaker`, `shadow-mode`, `agent-handoff`, `social-media`, `gog-workspace`, `wp-cli-fleet`): Generated files include a notice that hooks are Claude Code-exclusive.
- **MCP-dependent plugins** on Codex CLI: Generated AGENTS.md includes a notice that MCP tools are unavailable on Codex CLI.

If your new plugin uses hooks or MCP servers, the generator detects this from `plugin.json` and adds the correct notices — you do not need to write them manually.

### AGENTS.md Size Budget

Generated `AGENTS.md` files must stay under 2 KiB (2048 bytes). The generator enforces this by truncating content if the budget is exceeded. Keep plugin descriptions and agent prompts concise to stay within budget.

---

## Submitting Your Plugin

1. Fork this repository at <https://github.com/savethepolarbears/agenthaus-marketplace>
2. Create your plugin under `plugins/`
3. Run `bash scripts/validate-plugins.sh` to verify
4. Run `claude plugin validate ./plugins/your-plugin` if available
5. Add an entry to `.claude-plugin/marketplace.json` with:
   - `name`, `source`, `category`, `description`
   - `keywords` array for search discovery
   - `author` object with `name` (and optional `email`)
6. Submit a pull request with:
   - Description of the plugin
   - Required environment variables
   - Example usage

## CI/CD

Pull requests automatically run:

- Plugin validation (all plugins checked against schema)
- Marketplace.json validation (structure and duplicate detection)

See `.github/workflows/validate.yml` for details.

## Human-in-the-Loop (HITL) Requirements

Plugins that perform destructive or externally-visible actions **must** include `requires_approval` flags in their hook configurations. This applies to:

- Cloud deployments (Cloudflare Workers, Vercel, AWS)
- Repository mutations (git push, PR creation, branch deletion)
- Database operations (migrations, drops, bulk updates)
- External notifications (Slack messages, emails)
- WordPress site modifications (core updates, search-replace)

Example hook with HITL:

```json
{
  "matcher": "Bash",
  "requires_approval": true,
  "approval_message": "This will deploy to production. Approve?",
  "hooks": [{ "type": "command", "command": "..." }]
}
```

The `requires_approval` flag is defined in `schemas/plugin.schema.json` and enforced during validation.

## Credential Documentation

Plugins requiring API keys or tokens must declare them in `plugin.json` using the `required_credentials` field:

```json
"required_credentials": [
  {
    "name": "GITHUB_TOKEN",
    "scopes": ["repo", "read:org"],
    "rotation": "90d",
    "description": "Fine-grained PAT for repository access"
  }
]
```

Guidelines:

- Always specify minimum required scopes
- Recommend rotation periods for long-lived tokens
- Document the credential's purpose in the description
- Reference `docs/agent-identity.md` for the full credential management architecture

## Failure Mode Documentation

Every SKILL.md must include a `## Failure Modes & Recovery` section with a table:

| Failure                     | Detection                | Recovery                    |
| --------------------------- | ------------------------ | --------------------------- |
| Describe what can go wrong  | How the agent detects it | What the agent should do    |

This ensures agents handle errors gracefully instead of hallucinating or retrying indefinitely. See existing skills in `.agent/skills/` for examples.

## Questions?

Open an issue or reach out to the AgentHaus team.
