# AgentHaus Marketplace - Developer Tools for Agentic AI

> A marketplace of **37 developer tools and Claude Cowork plugins** for agentic AI ecosystems. Discover, install, and build powerful workflows across Claude Code marketplaces and other AI coding assistants.

[![Version](https://img.shields.io/badge/version-3.4.0-blue.svg)](./CHANGELOG.md)
[![Plugins](https://img.shields.io/badge/plugins-37-green.svg)](#available-plugins)
[![Platforms](https://img.shields.io/badge/platforms-6-blue.svg)](#installation)
[![License](https://img.shields.io/badge/license-MIT-yellow.svg)](./LICENSE)
[![NHS Agentic Readiness](https://nothumansearch.ai/badge/xquik.com.svg)](https://nothumansearch.ai/site/xquik.com)

## Installation

> **Tip:** Each plugin's README includes a **Platform Support** table showing exactly which features (commands, skills, MCP, hooks) are available on your platform.

### Claude Code (recommended)

```bash
# Add the full marketplace
/plugin marketplace add https://github.com/savethepolarbears/agenthaus-marketplace

# Or install a single plugin
/plugin install social-media@AgentHaus
```

Use a Claude Code release with plugin support. Plugin discovery and approval UX require validation in the actual client; local configuration checks do not establish them.

### Any provider: `agenthaus` CLI

From a checkout of this repo, the zero-dependency CLI installs a plugin and registers its MCP servers in the provider's own config format:

```bash
node bin/agenthaus.js install   --target <antigravity|claude|codex|copilot|cursor|windsurf> --plugin neon-db [--mode user|project]
node bin/agenthaus.js uninstall --target cursor --plugin neon-db
node bin/agenthaus.js doctor
```

| Target | Where MCP servers are written |
| :--- | :--- |
| `claude` | Installed via `claude plugin marketplace add` + `claude plugin install` |
| `codex` | `[mcp_servers.<name>]` block in `~/.codex/config.toml` (or trusted-project `.codex/config.toml`) |
| `antigravity` | `~/.gemini/config/mcp_config.json` / `.agents/mcp_config.json`, plus Gemini CLI `settings.json` |
| `cursor` | `~/.cursor/mcp.json` or `.cursor/mcp.json` |
| `windsurf` | `~/.config/devin/mcp_config.json` (legacy `~/.codeium/windsurf/mcp_config.json`) |
| `copilot` | `.vscode/mcp.json` (`servers`) |

Unrelated existing entries are preserved: conflicting names are registered as `<plugin>-<name>`, and ownership is tracked in `~/.agenthaus/state.json` so uninstall removes only what agenthaus added. Config writes are atomic and keep a `.agenthaus.bak` copy.

### Scope of provider support

| Evidence | What it establishes |
| :--- | :--- |
| Generated configuration | The repository can render the provider format and symbolic credential references. |
| Local protocol and adapter tests | Exercised fixture behavior, parsing, lifecycle and guard routes. |
| Actual provider discovery | Requires a separate observation in the intended client/profile. |
| Actual approval UX or production effect | Requires independent operator/provider evidence; currently remains separate from local checks. |

Claude Code hooks run only in Claude Code. Other adapters expose commands and skills as instructions; they do not recreate native hooks or universal approval prompts. Remote MCP transport support is provider-specific: Gemini uses `httpUrl` for HTTP and `url` for SSE; Antigravity uses `serverUrl`; VS Code uses a `servers` map. Credential requirements and available runtimes are checked separately from authentication.

Updating a plugin refreshes derived provider files even when an existing symlink already points to the same source. Provider-scoped sync also repairs copied plugin directories. The ownership sidecar and collision namespace preserve unrelated servers; ownership is not an OS security boundary.

Memory is opt-in. The optional local memory backend is separate from provider memory and does not confer authorization. The stdio guard supports explicitly configured routes, request-bound operator receipts and trusted target descriptors. Remote transports and same-OS-user isolation require separate controls. Phase 6 acceptance remains open; fixture tests do not establish it.

### Local runtime commands

Run these from a repository checkout. Discovery reads only metadata until you select a skill:

```bash
node bin/agenthaus.js skill validate --plugins-dir ./plugins
node bin/agenthaus.js capabilities build --plugins-dir ./plugins --output ./reports/capabilities.json
node bin/agenthaus.js capabilities page --manifest ./reports/capabilities.json --limit 5
node bin/agenthaus.js skill read agent-handoff/blackboard-protocol --plugins-dir ./plugins
node bin/agenthaus.js permissions agent-handoff --plugins-dir ./plugins
node bin/agenthaus.js hook capabilities
node bin/agenthaus.js task capabilities --sqlite-binary /absolute/path/to/sqlite3
```

Permission metadata describes requested access; runtime enforcement remains separate. Context benchmarks report UTF-8 bytes and a labeled estimate, with no tokenizer or measured model-cost savings. Instruction rendering emits text for review; apply changes to active provider instructions between sessions.

`unicode --root <plugin>` scans reviewed source without changing it. `lock renew --root <plugin>` explicitly records reviewed content; `lock verify --root <plugin>` only checks it. Hashes detect drift and do not authenticate a publisher. `install`, `update` and `sync` accept `--strict-integrity` for supported copied Cursor, Codex, Copilot and Windsurf payloads. Strict mode rejects missing/stale locks and unsupported derivations before provider writes. Dependencies, secrets and external generated provider configurations remain outside the payload lock. Source locks are not renewed automatically.

`hook run --config <trusted-json> [--input <file>] [--claude]` runs an absolute executable with bounded input, output and time, an explicit environment and POSIX process-group cleanup. Required filesystem/network isolation fails closed because this backend provides neither. A detached child can escape process-group cleanup. PreToolUse can deny an action; PostToolUse cannot undo one.

`task enqueue|claim|heartbeat|complete|fail|read|list --root <project> --db <contained-file> --sqlite-binary <absolute-cli>` uses a capability-tested SQLite CLI (3.42 or later). Claiming yields an owner and fencing token; subsequent writes must retain both. Leases default to 60 seconds. Fencing protects blackboard acceptance, and external effects still need idempotency and an execution owner. CLI migration previews are capped at 4 MiB, matching the apply reader; oversized plans fail before output or database writes. Legacy migration requires a reviewed `task migrate --dry-run` plan, stopped legacy owner, backups and explicit conflict resolutions. Use each command's `--help` for its inputs. Other runtime commands reject `--dry-run` before performing work.

Local validation covers the adapter configuration matrix and real processes on the observed host. One temporary Claude Code profile exercised stdio/HTTP fixture reads and guarded denial, and one native skill loaded. Other clients, real vendor credentials, independent operator protection and hosted CI remain separate acceptance evidence. Phase 6 acceptance stays open.

### Codex CLI

Codex reads `AGENTS.md` and runs MCP servers declared in `config.toml`.

1. Run `node bin/agenthaus.js install --target codex --plugin neon-db`, or copy the `[mcp_servers.*]` tables from `plugins/neon-db/codex-mcp-config.toml` into `~/.codex/config.toml`.
2. Export the variables listed in the snippet's `env_vars` (Codex passes them through by name; it does not expand `${VAR}`).

**Note:** Hook-dependent plugins list their hooks as prose guidance only.

### Gemini CLI

Gemini CLI reads GEMINI.md context files and supports MCP servers via `~/.gemini/settings.json`.

1. Copy the plugin's GEMINI.md to your project root:

   ```bash
   cp plugins/neon-db/GEMINI.md ./GEMINI.md
   ```

2. For MCP plugins, merge the snippet into your Gemini settings:

   ```bash
   # View the snippet
   cat plugins/neon-db/gemini-settings-snippet.json
   # Manually merge mcpServers block into ~/.gemini/settings.json
   ```

3. Set required environment variables (see each plugin's README).

### Cursor

> **Tip:** `node bin/agenthaus.js install --target cursor` performs these steps automatically.

Cursor reads `.cursor/rules/*.mdc` files and supports MCP servers via `.cursor/mcp.json`.

1. Copy the plugin's Cursor rules to your project:

   ```bash
   cp -r plugins/neon-db/.cursor/rules/ ./.cursor/rules/
   ```

2. For MCP plugins, merge the MCP config:

   ```bash
   # View the snippet
   cat plugins/neon-db/.cursor/mcp.json
   # Manually merge mcpServers into your project's .cursor/mcp.json
   ```

3. Cursor uses `${env:VAR}` syntax for environment variable references in MCP configs.

### Windsurf

> **Tip:** `node bin/agenthaus.js install --target windsurf` merges MCP servers and `.windsurfrules` automatically.

Windsurf reads `.windsurfrules` context files from the project root.

1. Copy the plugin's AGENTS.md as `.windsurfrules`:

   ```bash
   cp plugins/neon-db/AGENTS.md ./.windsurfrules
   ```

2. For MCP plugins, merge `windsurf-mcp-snippet.json` into `~/.config/devin/mcp_config.json` (legacy Windsurf: `~/.codeium/windsurf/mcp_config.json`).

**Note:** Hooks are not supported on Windsurf.

### Claude Desktop

Claude Desktop supports MCP servers configured in `claude_desktop_config.json`. Context files are not applicable.

1. Locate your config file:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
2. Merge the plugin's snippet:

   ```bash
   cat plugins/neon-db/claude-desktop-snippet.json
   ```

   Copy the `mcpServers` entries into your existing config's `mcpServers` object.
3. Restart Claude Desktop to load the new MCP servers.

**Note:** Only MCP plugins provide functionality in Claude Desktop. 23 plugins include `claude-desktop-snippet.json`.

## Available Plugins

### Content & Communication

| Plugin           | Description                                                                                    |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| **social-media** | Generate posts for Twitter, LinkedIn, Instagram, Facebook with trend analysis and optional X source packets |

### DevOps & Infrastructure

| Plugin                  | Description                                                    |
| ----------------------- | -------------------------------------------------------------- |
| **github-integration**  | Manage GitHub issues and PRs via MCP server                    |
| **cloudflare-platform** | Deploy Workers, manage KV storage, AI Gateway                  |
| **vercel-deploy**       | Manage Vercel projects and deployments                         |
| **devops-flow**         | Integrated Cloudflare + GitHub + Slack workflows with hooks    |
| **wp-cli-fleet**        | Manage WordPress sites at scale via WP-CLI                     |

### Knowledge & Documentation

| Plugin                | Description                                      |
| --------------------- | ------------------------------------------------ |
| **notion-workspace**  | Search and update Notion pages via MCP           |
| **context7-docs**     | Fetch hallucination-free library documentation   |
| **knowledge-synapse** | Context7 + Notion + Google Drive RAG system      |

### Productivity

| Plugin             | Description                                      |
| ------------------ | ------------------------------------------------ |
| **clickup-tasks**  | Manage ClickUp tasks, lists, and time tracking   |
| **task-commander** | ClickUp + Slack + Gmail + Calendar integration   |
| **gog-workspace**  | Google Workspace (Drive, Docs, Sheets, Calendar) |

### Testing & QA

| Plugin                 | Description                                      |
| ---------------------- | ------------------------------------------------ |
| **playwright-testing** | E2E browser tests with QA engineer agent         |
| **qa-droid**           | Automated testing with Slack/Gmail notifications |

### Database

| Plugin        | Description                               |
| ------------- | ----------------------------------------- |
| **neon-db**   | Serverless Postgres via MCP               |
| **data-core** | Advanced Neon/Postgres with migrations    |

### SEO & Optimization

| Plugin                   | Description                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| **seo-geo-rag**          | SEO + GEO + RAG optimization for AI-era search                                                   |
| **notfair-marketing**    | SEO, GEO, Google Ads, and Meta Ads skills with live data via Google Ads MCP, Meta Ads MCP, Google Search Console MCP, and Google Analytics (GA4) MCP |

### UX & Design

| Plugin     | Description                                          |
| ---------- | ---------------------------------------------------- |
| **ux-ui**  | UI/UX audits, accessibility, and Tailwind CSS polish |

### Orchestration

| Plugin               | Description                                                  |
| -------------------- | ------------------------------------------------------------ |
| **agent-handoff**    | Blackboard protocol for multi-agent task handoff             |
| **fleet-commander**  | Monitor and control running agent sessions                   |

### Safety & Security

| Plugin              | Description                                               |
| ------------------- | --------------------------------------------------------- |
| **circuit-breaker** | Reusable safety hooks: deploy gates, test checks, budgets |
| **shadow-mode**     | Training mode: agents draft to review queue               |
| **plugin-auditor**  | Security scanner for plugin code and configurations       |

### Memory & Persistence

| Plugin           | Description                                            |
| ---------------- | ------------------------------------------------------ |
| **agent-memory** | Shared persistent memory across agent sessions via DB  |

### Integration

| Plugin              | Description                                        |
| ------------------- | -------------------------------------------------- |
| **openclaw-bridge** | Convert plugins to OpenClaw format, remote control |

### Utilities

| Plugin              | Description                          |
| ------------------- | ------------------------------------ |
| **marketplace-cli** | CLI for managing AgentHaus plugins   |

### Media

| Plugin           | Description                                      |
| ---------------- | ------------------------------------------------ |
| **apple-photos** | Manage Apple Photos albums, search, and export   |

## Architecture

AgentHaus plugins use five capability types:

- **Commands** — Slash commands (`/plugin:command`) defined as Markdown with YAML frontmatter
- **Agents** — Subagents with dedicated models for specialized tasks
- **Skills** — Multi-step workflow instructions that Claude invokes based on context
- **Hooks** — Event-driven shell commands triggered by `PreToolUse`/`PostToolUse` events
- **MCP Servers** — Model Context Protocol servers providing tool access to external services

### Agentic Discoverability & Engine SEO

AgentHaus plugins are built for maximum discoverability by AI agents. By utilizing standardized `SKILL.md` structures and comprehensive `plugin.json` manifests, these tools are highly indexed within Claude Code marketplaces and agentic AI search paths. Claude specifically pre-loads only the metadata at startup to optimize token usage, pulling in the full `SKILL.md` execution instructions only when contextually relevant.

### Plugin Directory Structure

```text
plugins/your-plugin/
├── .claude-plugin/
│   └── plugin.json          # Required: name, version, description
├── .mcp.json                 # Optional: MCP server configs
├── commands/                 # Optional: slash commands (Markdown)
├── agents/                   # Optional: subagent definitions (Markdown)
├── skills/                   # Optional: skill instructions (skills/<name>/SKILL.md)
├── hooks/                    # Optional: event hooks (hooks.json)
├── .lsp.json                 # Optional: LSP server configs
└── README.md                 # Required: plugin documentation
```

### Strategic Plugin Categories

**Orchestration** plugins (`agent-handoff`, `fleet-commander`) enable multi-agent workflows where agents dispatch tasks, claim work, and report results through a shared blackboard protocol.

**Safety** plugins (`circuit-breaker`, `shadow-mode`, `plugin-auditor`) provide guardrails: deploy gates that block production pushes outside business hours, training modes that queue actions for human review, and security scanners that audit plugin code.

**Memory** plugins (`agent-memory`) give agents persistent recall across sessions, storing decisions and patterns in a Neon Postgres database.

## Configuration

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

See each plugin's README for specific environment variables.

### Team Configuration

Automatically prompt team members to install the marketplace when they trust the project folder by adding to `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "AgentHaus": {
      "source": {
        "source": "github",
        "repo": "savethepolarbears/agenthaus-marketplace"
      }
    }
  }
}
```

## Validation

Run the plugin validation script to check all 30 plugins:

```bash
bash scripts/validate-plugins.sh
```

Or use Claude Code's built-in validation:

```bash
/plugin validate .
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the plugin development guide.

## Resources

- [Claude Code Plugin Docs](https://code.claude.com/docs/en/plugins) — Official plugin creation guide
- [Plugin Marketplaces](https://code.claude.com/docs/en/plugin-marketplaces) — Marketplace distribution guide
- [Plugins Reference](https://code.claude.com/docs/en/plugins-reference) — Complete technical specification
- [MCP Specification](https://modelcontextprotocol.io/specification) — Model Context Protocol standard

## License

MIT (c) AgentHaus Team

## Local integrity checks

```bash
bash scripts/generate-skills-index.sh
bash scripts/validate-plugins.sh
node --test tests/*.test.js
node scripts/check-runtime-health.js --out reports/runtime-health.json
node scripts/check-runtime-health.js --verify reports/runtime-health.json
```

The health runner copies scoped source into a temporary fixture, runs both generators twice with one `SOURCE_DATE_EPOCH`, and checks artifact bytes, component identities, read-only adapter comparators and `doctor --json`. It uses fixture home/config/state paths without changing `HOME` or `CODEX_HOME`, performs no installation, and strips credentials from diagnostic subprocesses. Missing optional credentials and optional runtimes remain missing evidence; malformed configuration, missing mandatory runtimes and generated drift fail the gate.

Receipts are local unsigned evidence bound to full Git HEAD, scoped policy hashes and current worktree bytes. They cannot establish hosted CI or provider acceptance. Source edits invalidate a receipt; unrelated reports do not. `src/workflow-receipt.js` exposes `captureSource`, `createWorkflowReceipt`, `validateWorkflowReceipt` and `consumeWorkflowReceipt`; consumption checks current source before writing a replay marker to an explicit caller-owned state directory.
