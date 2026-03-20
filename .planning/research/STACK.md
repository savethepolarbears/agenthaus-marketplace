# Technology Stack: Cross-Platform AI Coding Agent Config Formats

**Project:** AgentHaus Marketplace — Cross-Platform Plugin Support
**Researched:** 2026-03-20
**Research Mode:** Ecosystem + Comparison

---

## Recommended Stack

This is a format-mapping project, not a software build. The "stack" is a set of file format specifications and a clear mapping between them. The implementation work is generating config files in each format from the canonical Claude plugin format.

### Canonical Format (Source of Truth)

| Component | Location | Format | Purpose |
|-----------|----------|--------|---------|
| Plugin manifest | `.claude-plugin/plugin.json` | JSON | Plugin identity, component paths, MCP server inline config |
| Skills | `skills/<name>/SKILL.md` | Markdown + YAML frontmatter | Agent-invoked instructions |
| Commands | `commands/<name>.md` | Markdown + YAML frontmatter | User-invoked slash commands |
| Agents | `agents/<name>.md` | Markdown + YAML frontmatter | Subagent definitions |
| Hooks | `hooks/hooks.json` | JSON | Lifecycle event handlers |
| MCP config | `.mcp.json` | JSON | MCP server definitions |
| LSP config | `.lsp.json` | JSON | Language server configs |

### Cross-Platform Target Formats

| Platform | Primary Config | Skills | Commands | MCP |
|----------|---------------|--------|----------|-----|
| Claude Code | `.claude-plugin/plugin.json` | `skills/<name>/SKILL.md` | `commands/<name>.md` | `.mcp.json` |
| Codex CLI (OpenAI) | `AGENTS.md` | `~/.codex/skills/<name>/SKILL.md` | AGENTS.md prose | `.mcp.json` (same) |
| Gemini CLI | `GEMINI.md` | `SKILL.md` (agentskills standard) | `.gemini/commands/<name>.toml` | `.gemini/settings.json` mcpServers |
| Cursor | `.cursor/rules/*.mdc` | `SKILL.md` (via agentskills) | None native | `.cursor/mcp.json` |
| Windsurf | `.windsurf/rules/*.md` | `.windsurf/skills/<name>/SKILL.md` | None native | Windsurf settings UI |

---

## Platform Specifications

### 1. Claude Code (Anthropic)

**Confidence:** HIGH — Verified against official docs at code.claude.com (March 2026)

#### plugin.json Schema (complete)

```json
{
  "name": "plugin-name",
  "version": "1.2.0",
  "description": "Brief plugin description",
  "author": {
    "name": "Author Name",
    "email": "author@example.com",
    "url": "https://github.com/author"
  },
  "homepage": "https://docs.example.com/plugin",
  "repository": "https://github.com/author/plugin",
  "license": "MIT",
  "keywords": ["keyword1", "keyword2"],
  "commands": ["./custom/commands/special.md"],
  "agents": "./custom/agents/",
  "skills": "./custom/skills/",
  "hooks": "./config/hooks.json",
  "mcpServers": "./mcp-config.json",
  "outputStyles": "./styles/",
  "lspServers": "./.lsp.json"
}
```

**Required field:** `name` only. Everything else is optional.

**Path behavior:** Custom paths supplement default directories, they don't replace them. If `commands/` exists at plugin root, it's loaded regardless of whether `commands` is in manifest.

**Environment variables available in hook commands and MCP configs:**
- `${CLAUDE_PLUGIN_ROOT}` — absolute path to plugin installation dir (changes on update)
- `${CLAUDE_PLUGIN_DATA}` — persistent dir that survives plugin updates (`~/.claude/plugins/data/{id}/`)

#### SKILL.md Frontmatter (complete)

```yaml
---
name: skill-name                    # optional, max 64 chars, lowercase+numbers+hyphens
description: "What it does. Use when X."  # recommended, max 1024 chars (Claude's discovery mechanism)
argument-hint: "[filename] [format]"  # optional, shown in autocomplete
disable-model-invocation: true      # optional, default false; prevents Claude auto-invoking
user-invocable: false               # optional, default true; hides from / menu
allowed-tools: Read, Grep, Glob     # optional, space-delimited
model: claude-sonnet-4-5            # optional, model override for this skill
context: fork                       # optional, "fork" runs in isolated subagent
agent: Explore                      # optional, which subagent when context: fork
hooks:                              # optional, hooks scoped to skill lifecycle
  PostToolUse: [...]
---
```

**CRITICAL CONSTRAINT:** Description is the discovery mechanism. It is pre-loaded into context at startup. The body of SKILL.md is only loaded when the skill is invoked. Do NOT put invocation triggers in the body — put them in description.

**Character budget:** All skill descriptions compete for 2% of context window (fallback: 16,000 chars). Many skills with long descriptions will cause some to be excluded.

**$ARGUMENTS substitutions in body:**
- `$ARGUMENTS` — all arguments
- `$ARGUMENTS[N]` or `$N` — argument by 0-based index
- `${CLAUDE_SESSION_ID}` — current session ID
- `${CLAUDE_SKILL_DIR}` — absolute path to skill directory

#### hooks.json Schema

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash|Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/check.sh"
          }
        ]
      }
    ],
    "PostToolUse": [...],
    "SessionStart": [...],
    "Stop": [...]
  }
}
```

**All hook events:** SessionStart, UserPromptSubmit, PreToolUse, PermissionRequest, PostToolUse, PostToolUseFailure, Notification, SubagentStart, SubagentStop, Stop, StopFailure, TeammateIdle, TaskCompleted, InstructionsLoaded, ConfigChange, WorktreeCreate, WorktreeRemove, PreCompact, PostCompact, Elicitation, ElicitationResult, SessionEnd

**Hook types:** `command` (shell), `http` (POST to URL), `prompt` (LLM eval), `agent` (agentic verifier)

**PreToolUse** can block tool execution. **PostToolUse** runs after success. Exit code from command hooks controls behavior.

#### Agent Markdown Format

```markdown
---
name: agent-name
description: "What this agent specializes in. When Claude should invoke it."
model: claude-sonnet-4-5
---

Detailed system prompt for the agent describing its role, expertise, and behavior.
```

#### .mcp.json Format

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@company/mcp-server"],
      "env": {
        "API_KEY": "${MY_API_KEY}"
      }
    }
  }
}
```

---

### 2. Codex CLI (OpenAI)

**Confidence:** MEDIUM — Verified OpenAI official docs exist, AGENTS.md spec confirmed. Skill format confirmed as agentskills.io standard.

#### AGENTS.md Format

AGENTS.md is plain Markdown. No frontmatter, no schema. Codex reads it as natural language instructions.

**File discovery order (per directory, first non-empty wins):**
1. `AGENTS.override.md` (takes precedence over base file)
2. `AGENTS.md`
3. Any names in `project_doc_fallback_filenames` config (e.g., `TEAM_GUIDE.md`)

**Loading chain:** Codex builds an instruction chain from `~/.codex/AGENTS.md` (global) → each directory level from repo root to current dir.

**Config knobs in `~/.codex/config.json`:**
- `project_doc_max_bytes` — max bytes to read from each AGENTS.md
- `project_doc_fallback_filenames` — additional filenames to treat as AGENTS.md

**What to put in AGENTS.md:** Project context, code style conventions, build commands, testing approach, architectural decisions, workflow instructions. Codex uses this verbatim as instruction context.

**Per-plugin AGENTS.md:** Generate an `AGENTS.md` at each plugin directory root describing the plugin's purpose, commands, skills, and usage. Codex picks this up when the user is working in that directory.

#### Skill Format (agentskills.io standard)

Codex adopted the agentskills.io open standard. Skills live at `~/.codex/skills/<name>/SKILL.md`.

```yaml
---
name: skill-name
description: "What it does and when to use it"
---

Instructions for the agent to follow.
```

The spec is identical to Claude Code's SKILL.md with `name` and `description` as the core fields (max 64 and 1024 chars respectively). Claude Code extensions (disable-model-invocation, context: fork, etc.) may not be honored in Codex — use only the agentskills.io standard fields for cross-platform compatibility.

#### MCP Configuration

Codex uses the same `.mcp.json` format as Claude Code. No conversion needed for MCP configs.

---

### 3. Gemini CLI (Google)

**Confidence:** MEDIUM — Google official docs and GitHub repo verified. TOML command format verified.

#### GEMINI.md Context File

GEMINI.md is plain Markdown with no frontmatter. Gemini CLI loads it as persistent context.

**Loading hierarchy (all combined, more specific overrides general):**
1. `~/.gemini/GEMINI.md` — global, all projects
2. Ancestor directories from current dir up to project root
3. Sub-directory `.gemini/` contexts for components

Use `gemini /init` to generate a starter GEMINI.md.

**Per-plugin GEMINI.md:** Generate a `GEMINI.md` at each plugin directory root. When a user is in that directory, Gemini CLI loads it automatically.

#### Extension Format (gemini-extension.json)

Extensions live in `~/.gemini/extensions/<name>/` or `.gemini/extensions/<name>/`.

```json
{
  "name": "extension-name",
  "version": "1.0.0",
  "contextFileName": "GEMINI.md",
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@company/mcp-server"],
      "env": {
        "API_KEY": "${MY_API_KEY}"
      }
    }
  },
  "excludeTools": ["run_shell_command(rm -rf)"],
  "settings": [
    {
      "name": "API Key",
      "description": "Your API key",
      "envVar": "MY_API_KEY"
    }
  ]
}
```

**Fields:**
- `name` — lowercase, numbers, dashes only
- `version` — semver
- `contextFileName` — file to load as context (defaults to GEMINI.md if file present)
- `mcpServers` — same shape as Claude's .mcp.json mcpServers value
- `excludeTools` — array of tool names to block; supports command-specific: `"run_shell_command(rm -rf)"`
- `settings` — array of configurable env vars with user-friendly names

#### Custom Commands (TOML)

Commands live in `commands/` inside the extension directory, or at `~/.gemini/commands/` (user-scoped) or `.gemini/commands/` (project-scoped).

**File → command name mapping:**
- `~/.gemini/commands/test.toml` → `/test`
- `.gemini/commands/git/commit.toml` → `/git:commit`
- Extension conflict → prefixed as `/extension-name.command-name`

**TOML format:**

```toml
description = "Brief one-line description shown in /help"
prompt = """
The prompt sent to Gemini when this command runs.

Use {{args}} to insert user arguments.
Use !{shell command} to inject shell output into the prompt.
"""
```

**Only `prompt` is required.** `description` is optional but recommended.

Use `/commands reload` to pick up changes without restarting.

#### Skills Support

Gemini CLI supports the agentskills.io standard. Same SKILL.md format as Claude Code and Codex.

#### MCP Configuration

Add MCP servers to `~/.gemini/settings.json` or `.gemini/settings.json`:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@company/mcp-server"],
      "env": {
        "API_KEY": "${MY_API_KEY}"
      }
    }
  }
}
```

Or bundle them inside `gemini-extension.json`. The mcpServers object shape is identical to Claude's .mcp.json value.

---

### 4. Cursor

**Confidence:** MEDIUM — Official Cursor docs confirmed. .mdc format confirmed. Skills via agentskills.io confirmed.

#### Rules: .cursor/rules/*.mdc (current format, recommended)

Project rules live in `.cursor/rules/` as `.mdc` files. Each file is one rule.

```
---
description: "What this rule does. When to apply it."
globs: "**/*.ts,**/*.tsx"
alwaysApply: false
---

Rule content in Markdown here.
```

**Frontmatter fields:**

| Field | Type | Purpose |
|-------|------|---------|
| `description` | string | Tells agent when to apply this rule. Required for "Agent" mode. |
| `globs` | string | Comma-separated glob patterns. File-scoped auto-attachment when matched. |
| `alwaysApply` | boolean | If true and no globs, always attached regardless of context. |

**Rule activation types:**

| Type | Condition | Behavior |
|------|-----------|---------|
| Always | `alwaysApply: true`, no globs | Always attached |
| Auto-Attach | `globs` defined, `alwaysApply: false` | Attached when matching files are in context |
| Agent | `description` present, no globs, `alwaysApply: false` | AI decides based on description |
| Manual | No description, no globs, `alwaysApply: false` | Must be manually referenced |

**Character limits:** No documented per-rule limit, but keep concise. Cursor truncates context.

**Legacy format (.cursorrules):** A single file at repo root. Still functional as of 2026 but deprecated. All new rules should use `.cursor/rules/*.mdc`.

#### MCP Configuration (.cursor/mcp.json)

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@company/mcp-server"],
      "env": {
        "API_KEY": "${env:MY_API_KEY}"
      }
    }
  }
}
```

**Note:** Cursor uses `${env:VAR}` syntax for environment variables, unlike Claude's `${VAR}`. This is a critical difference when generating cross-platform MCP configs.

**Scope:** `.cursor/mcp.json` in project root (project-scoped) or `~/.cursor/mcp.json` (user-scoped).

#### Skills (agentskills.io standard)

Cursor supports SKILL.md via the agentskills.io standard. Skills are placed in `.cursor/skills/<name>/SKILL.md` or via user scope at `~/.cursor/skills/<name>/SKILL.md`.

---

### 5. Windsurf (Codeium)

**Confidence:** MEDIUM — Multiple community sources. Official docs at docs.windsurf.com partially verified.

#### Rules: .windsurf/rules/*.md (current format)

Rules live in `.windsurf/rules/` as `.md` files with frontmatter.

```markdown
---
trigger: always_on
---

Rule content in Markdown here.
```

Or for glob-based activation:

```markdown
---
trigger: glob
globs: "**/*.test.ts"
---

Rules for test files only.
```

Or for AI-decided activation:

```markdown
---
trigger: model_decision
description: "Apply when working with database migrations"
---

Rules for database work.
```

**Trigger values:**

| Trigger | Behavior |
|---------|---------|
| `always_on` | Always injected into context |
| `glob` | Applied when file patterns match (requires `globs` field) |
| `model_decision` | Cascade decides (requires `description` field) |
| `manual` | Only when user @mentions the rule by name |

**Legacy format (.windsurfrules):** Single file at repo root. Still supported but `.windsurf/rules/` is preferred.

**Character limits:**
- Per rule file: 6,000 characters (truncated beyond this)
- Total global + local combined: 12,000 characters max
- Global rules take priority when combined limit exceeded

#### Skills: .windsurf/skills/<name>/SKILL.md

Windsurf Cascade supports the agentskills.io standard.

```
.windsurf/skills/deploy-to-production/
├── SKILL.md
└── deployment-checklist.md
```

```yaml
---
name: deploy-to-production
description: "Guides the deployment process with safety checks. Use when deploying."
---

Instructions here.
```

Invoke explicitly with `@skill-name` in Cascade's input box.

#### MCP Configuration

Windsurf MCP servers are configured via the Windsurf settings UI or a settings file. No documented `.windsurf/mcp.json` equivalent exists in the same form. The mcpServers object format follows standard MCP JSON.

---

## The agentskills.io Open Standard

**Confidence:** HIGH — Published by Anthropic December 18, 2025. Adopted by 26+ platforms. Spec at agentskills.io.

SKILL.md is the universal cross-platform format. All five target platforms support it. Write one SKILL.md per skill, and it works on Claude Code, Codex, Gemini CLI, Cursor, and Windsurf.

### Core Specification (platform-agnostic)

```yaml
---
name: skill-name          # required, max 64 chars, lowercase+numbers+hyphens
description: "..."        # required, max 1024 chars, describe what AND when
license: MIT              # optional
---

Skill instructions in Markdown.
```

**Constraints enforced by spec:**
- `name`: lowercase letters, numbers, hyphens only; max 64 chars; cannot start/end with hyphen; no consecutive hyphens
- `description`: max 1024 chars; no `<` or `>` characters; must describe both what the skill does and when to use it

**Optional fields from agentskills.io spec:**
- `license` — keep short (license name or bundled file name)
- `compatibility` — intended product, required packages, network access
- `allowed-tools` — space-delimited pre-approved tools (experimental, platform support varies)

**Platform-specific extensions (Claude Code only):**
- `disable-model-invocation`, `user-invocable`, `model`, `context`, `agent`, `argument-hint`, `hooks`

Use only the core spec fields for maximum cross-platform compatibility. Add Claude-specific fields on top — other platforms ignore unknown frontmatter fields.

---

## Mapping Table: Claude Concept → Platform Equivalent

| Claude Code | Codex CLI | Gemini CLI | Cursor | Windsurf |
|-------------|-----------|------------|--------|---------|
| `.claude-plugin/plugin.json` | `AGENTS.md` (prose description) | `GEMINI.md` + `gemini-extension.json` | `.cursor/rules/*.mdc` | `.windsurf/rules/*.md` |
| `skills/<name>/SKILL.md` | `~/.codex/skills/<name>/SKILL.md` | `SKILL.md` (agentskills) | `.cursor/skills/<name>/SKILL.md` | `.windsurf/skills/<name>/SKILL.md` |
| `commands/<name>.md` | Describe in `AGENTS.md` | `.gemini/commands/<name>.toml` | Manual rule in `.cursor/rules/` | Manual rule in `.windsurf/rules/` |
| `agents/<name>.md` | Describe in `AGENTS.md` | Describe in `GEMINI.md` | Agent rule in `.cursor/rules/` | Describe in `.windsurf/rules/` |
| `hooks/hooks.json` | No equivalent | No equivalent | No equivalent | No equivalent |
| `.mcp.json` (with `${VAR}`) | `.mcp.json` (same format) | `.gemini/settings.json` mcpServers | `.cursor/mcp.json` (use `${env:VAR}`) | Windsurf settings UI |
| Plugin namespace `/plugin:skill` | Flat `/skill` | Flat `/skill` or `/ext.skill` | Via rules file | Via @mention |
| `settings.json` (agent key) | No equivalent | No equivalent | No equivalent | No equivalent |

---

## Alternatives Considered

| Decision | Chosen | Rejected | Why |
|----------|--------|----------|-----|
| Single universal format | No — generate per-platform | Universal format | No single format works for all 5 platforms' native features |
| Format conversion tooling | Node.js/TypeScript script | Shell scripts | Matches existing stack; testable; npm publishable |
| OpenClaw as intermediary | No | Yes | Adds runtime dependency; platforms each have native support now |
| Windsurf MCP config | Settings UI guidance only | .windsurf/mcp.json | No documented project-scoped file format confirmed |

---

## What NOT to Do

### Do NOT use one AGENTS.md for all platforms

AGENTS.md is Codex CLI-specific (and has been adopted by Codex). For Gemini, it means nothing. For Cursor, it means nothing. Write platform-native configs.

**Exception:** The repo-level AGENTS.md (which is also CLAUDE.md, .cursorrules, etc. via symlinks) is fine for repository context. But per-plugin configs must be platform-native.

### Do NOT use Claude's ${VAR} syntax in Cursor MCP configs

Cursor uses `${env:VAR}` syntax. Using `${VAR}` will cause Cursor to fail silently to resolve secrets. This is a breaking difference.

### Do NOT put discovery triggers in SKILL.md body

The body is only loaded after invocation. Triggers in the body never help Claude decide to invoke the skill. Description is the only discovery surface. Description must contain "Use when..." triggers.

### Do NOT create skills over 500 lines

The SKILL.md body should stay under 500 lines. Move heavy reference content to supporting files in the skill directory and link them from SKILL.md.

### Do NOT put secrets in Gemini extension settings

The `settings` array in gemini-extension.json exposes config to users via UI. Store actual secrets in env vars, not in the extension file.

### Do NOT nest .claude-plugin/ components inside the manifest directory

Only `plugin.json` goes inside `.claude-plugin/`. All component directories (commands/, agents/, skills/, hooks/) must be at the plugin root level.

---

## Installation Commands by Platform

```bash
# Claude Code — install from marketplace
claude plugin install github-integration@agenthaus

# Codex CLI — skills go in home dir, AGENTS.md in project
cp -r plugins/github-integration/skills/* ~/.codex/skills/
cp plugins/github-integration/AGENTS.md ./AGENTS.md  # (generated)

# Gemini CLI — extension in .gemini/extensions
mkdir -p .gemini/extensions/github-integration
cp -r plugins/github-integration/gemini/* .gemini/extensions/github-integration/

# Cursor — rules and MCP config
cp plugins/github-integration/.cursor/rules/*.mdc .cursor/rules/
cp plugins/github-integration/.cursor/mcp.json .cursor/

# Windsurf — rules and skills
cp plugins/github-integration/.windsurf/rules/*.md .windsurf/rules/
cp -r plugins/github-integration/skills/* .windsurf/skills/
```

---

## Sources

- [Claude Code — Create plugins (official)](https://code.claude.com/docs/en/plugins) — HIGH confidence
- [Claude Code — Plugins reference (official)](https://code.claude.com/docs/en/plugins-reference) — HIGH confidence
- [Claude Code — Extend with skills (official)](https://code.claude.com/docs/en/skills) — HIGH confidence
- [agentskills.io specification](https://agentskills.io/specification) — HIGH confidence
- [Codex CLI — Custom instructions with AGENTS.md (official)](https://developers.openai.com/codex/guides/agents-md) — HIGH confidence
- [Codex CLI — Agent Skills (official)](https://developers.openai.com/codex/skills) — HIGH confidence
- [Gemini CLI — Extensions (official GitHub)](https://google-gemini.github.io/gemini-cli/docs/extensions/) — MEDIUM confidence
- [Gemini CLI — Custom commands (geminicli.com docs)](https://geminicli.com/docs/cli/custom-commands/) — MEDIUM confidence
- [Gemini CLI — Extension reference](https://geminicli.com/docs/extensions/reference/) — MEDIUM confidence
- [Cursor — Rules for AI (official docs)](https://cursor.com/docs/context/rules) — MEDIUM confidence
- [Cursor — MCP configuration (official docs)](https://cursor.com/docs/context/mcp) — MEDIUM confidence
- [Windsurf — Cascade Skills (official docs)](https://docs.windsurf.com/windsurf/cascade/skills) — MEDIUM confidence
- [Windsurf rules community guide](https://playbooks.com/windsurf-rules) — LOW confidence (corroborates official)
- [OpenClaw plugin bridge overview](https://docs.openclaw.ai/tools/plugin) — LOW confidence (third-party)
