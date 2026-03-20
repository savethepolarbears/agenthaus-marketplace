# Feature Landscape: Cross-Platform AI Coding Agent Plugin Support

**Domain:** AI coding agent plugin marketplace (cross-platform)
**Researched:** 2026-03-20
**Confidence:** HIGH for Claude Code, Codex CLI, Gemini CLI; MEDIUM for Cursor, Windsurf

---

## Platform Capability Matrix

The six platforms being supported each have distinct plugin/extension models. This matrix defines what each natively supports so you can make build-vs-skip decisions per feature.

| Feature | Claude Code | Codex CLI | Gemini CLI | Cursor | Windsurf | GitHub Copilot |
|---------|-------------|-----------|------------|--------|----------|----------------|
| **Context files (Markdown)** | CLAUDE.md / AGENTS.md | AGENTS.md | GEMINI.md | .cursorrules / .cursor/rules/*.mdc | .windsurfrules | copilot-instructions.md |
| **Hierarchical context (dirs)** | YES — nearest file wins | YES — dir-level precedence | YES — nested GEMINI.md + `@import` | YES — .cursor/rules/ + path nesting | YES — global_rules.md + project .windsurfrules | YES — workspace + repo |
| **MCP server integration** | YES — .mcp.json / plugin.json | YES — config.toml `[mcp_servers]` | YES — settings.json `mcpServers` | YES — .cursor/mcp.json (40-tool limit) | YES — ~/.codeium/windsurf/mcp_config.json (100-tool limit) | YES — settings, GA |
| **Slash commands** | YES — .claude/commands/*.md or skills/ | NO — AGENTS.md instructions only | NO — no slash command protocol | PARTIAL — agent instructions, no slash commands | NO — no slash command protocol | PARTIAL — /commands via chat |
| **Skill files (SKILL.md)** | YES — dedicated YAML + body format | NO — plain AGENTS.md section only | NO — GEMINI.md section only | NO | NO | PARTIAL — .github/skills/*.md (experimental) |
| **Hook: pre-tool blocking** | YES — PreToolUse (exit 2 blocks) | NO — no hook system | YES — BeforeTool (exit 2 blocks) | YES — Cursor Hooks (exit 2 blocks, 10-20x faster exec Jan 2026) | YES — Cascade Hooks pre-write/pre-execute (exit 2 blocks) | PREVIEW — Agent Hooks in preview (GA Feb 2026) |
| **Hook: post-tool callback** | YES — PostToolUse (4 handler types) | NO | YES — AfterTool | YES | YES — post-action hooks | PREVIEW |
| **Hook: session lifecycle** | YES — SessionStart/End, SubagentStart/Stop | NO | YES — BeforeAgent/AfterAgent, session start/end | LIMITED — Automations (schedule/event-based) | LIMITED — session-level only | NO |
| **Hook handler types** | command, HTTP, prompt, agent | N/A | command, npm plugin | command only | command only | command only |
| **MCP tool name filtering** | pattern regex on tool events | `enabled_tools` / `disabled_tools` allowlist | regex matcher in settings | NO (all enabled tools always visible) | NO | NO |
| **Subagent spawning** | YES — agent type in plugin.json | NO — single agent model | NO | NO | NO | PREVIEW |
| **Sandbox/network isolation** | YES — per-command permissions | YES — workspace-write sandbox, network off by default | NO — standard terminal permissions | NO | NO | NO |
| **Config file format** | JSON (plugin.json) + Markdown | TOML (config.toml) + Markdown | JSON (settings.json) + Markdown | JSON (.cursor/mcp.json) + MDC | JSON (mcp_config.json) + Markdown | JSON + Markdown |
| **Plugin marketplace / install** | YES — /plugin install, skills_index.json | NO | NO | YES — cursor.com/marketplace | PARTIAL — windsurf.run directory, no CLI install | NO |

---

## Table Stakes

Features every plugin must provide or users will not install it on that platform.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Context file (Markdown) | Every platform reads one — it's the minimum viable integration | Low | Plain Markdown, no special syntax |
| MCP server config | 7 of 27 plugins need MCP; users expect tools to work | Low-Med | Format varies: JSON (Claude, Cursor, Windsurf, Copilot), TOML (Codex), JSON (Gemini) |
| Platform-specific file names | Each tool looks for a specific filename | Low | Cannot rename; must emit exactly AGENTS.md, GEMINI.md, etc. |
| No broken file references | Users abandon plugins that fail on install | Low | Paths like `${CLAUDE_PLUGIN_ROOT}` only resolve in Claude Code — strip or adapt |
| Environment variable documentation | All platforms need credential setup instructions | Low | Already in .env.example; needs per-platform callout |
| README that explains cross-platform | Users need to know which platform gets which features | Low | One README section per platform |

---

## Differentiators

Features that make AgentHaus plugins better than alternatives once cross-platform basics work.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Skill-to-context translation | Convert SKILL.md bodies into context-file sections so non-Claude platforms get the same workflow knowledge | Medium | Automated generation; not manual copy-paste |
| Unified MCP config generation | One canonical .mcp.json → emit config.toml section for Codex, settings.json block for Gemini, .cursor/mcp.json for Cursor automatically | Medium | Format conversion only; no logic changes |
| Hook-equivalent context rules | Translate PreToolUse blocking hooks into platform-native hook configs (Gemini BeforeTool, Windsurf pre-write, Cursor hooks) | High | Semantics differ per platform; requires per-platform templates |
| Platform feature matrix in README | Explicit table showing "this plugin gives you X on Claude, Y on Codex, Z on Cursor" | Low | HIGH user trust signal; no other marketplace does this |
| `skills_index.json` cross-platform discovery | Already exists (43 KB); extend it with platform fields so agents on any platform can query what's available | Low | Extend existing schema, don't replace it |
| Accurate agent definitions for Codex/Gemini | AGENTS.md sections that describe what each "agent" workflow does in plain prose | Low-Med | Codex/Gemini have no subagent protocol, but prose context still improves behavior |
| Hook parity table | Document exactly which hooks work on which platform so users set expectations correctly | Low | Prevents support issues |

---

## Anti-Features

Things to explicitly NOT attempt when generating cross-platform configs.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Copy SKILL.md verbatim into AGENTS.md | AGENTS.md is free-form; SKILL.md YAML frontmatter (name, description) is meaningless noise in Codex/Gemini | Strip frontmatter; embed prose content as a named section |
| `${CLAUDE_PLUGIN_ROOT}` in non-Claude configs | This variable only resolves in Claude Code's plugin runtime; will break as a literal string everywhere else | Use relative paths or absolute paths in generated configs |
| Exposing all MCP servers from all 27 plugins by default | Codex has no per-project tool filtering UI; Cursor caps at 40 tools, Windsurf at 100 | Generate per-plugin configs, not a single merged config for the whole marketplace |
| Attempting to translate hooks into Codex | Codex CLI has NO hook system (PRs #2904 and #9796 closed without merge, confirmed 2026) | Document the gap explicitly; skip hook generation for Codex entirely |
| Subagent definitions for non-Claude platforms | Claude Code has a formal subagent protocol (agent type in plugin.json); no other platform understands it | Convert agent descriptions to prose skill context; don't emit agent YAML blobs |
| Slash command syntax for Gemini/Windsurf | Neither platform has a slash command protocol | Convert command content to inline GEMINI.md/windsurfrules sections or drop the commands |
| Using `.cursorrules` (legacy) instead of `.cursor/rules/*.mdc` | Cursor has deprecated .cursorrules; official docs recommend migrating to .mdc format | Generate `.cursor/rules/<plugin-name>.mdc` files with proper YAML frontmatter |
| Merging all plugin context into one giant file | 12,000 char combined limit in Windsurf; context degradation in all platforms at large file sizes | Per-plugin context files, per-plugin MCP configs; use hierarchical placement |
| Assuming LSP configs work cross-platform | .lsp.json is Claude Code-specific; no equivalent in other platforms | Skip LSP for non-Claude; document as Claude-only |

---

## Platform-Specific Feature Inventory

### Claude Code (canonical, all features)

Supports everything: commands (61 total), agents (10), skills (27 SKILL.md files), hooks (5 plugins with hooks, 4 handler types, 20+ lifecycle events), MCP (7 plugins), LSP. This is the source of truth; all other platforms derive from it.

### Codex CLI (AGENTS.md + MCP only)

- **Reads:** `AGENTS.md` and directory-level `AGENTS.md` files
- **MCP:** `~/.codex/config.toml` or `.codex/config.toml` (trusted projects); `[mcp_servers.<name>]` tables; `enabled_tools` / `disabled_tools` allowlists per server
- **NO hooks:** Confirmed via closed PRs; no lifecycle interception
- **NO slash commands:** Context is pure prose instructions
- **NO subagents:** Single agent model
- **Sandbox:** workspace-write (default) or danger-full-access; network off by default
- **Config format:** TOML (unique — every other platform uses JSON)

### Gemini CLI (GEMINI.md + MCP + hooks)

- **Reads:** `GEMINI.md` files — hierarchical, `@import` syntax for splitting files
- **MCP:** `~/.gemini/settings.json` or `.gemini/settings.json` (project-level wins); `mcpServers` object; STDIO and HTTP transports; FastMCP integration; resources and prompts in addition to tools
- **Hooks:** `BeforeTool` (can block), `AfterTool`, `BeforeAgent`, `AfterAgent`, `BeforeModel`, `BeforeToolSelection`, session start/end; configured in settings.json; command hooks and npm plugin hooks; stdin/stdout JSON protocol; stderr for debug
- **NO slash commands:** Context is prose in GEMINI.md
- **NO subagents:** Single agent model
- **Tool name sanitization:** Automatic prefixing for conflicts

### Cursor (MDC rules + MCP + hooks + automations)

- **Reads:** `.cursor/rules/*.mdc` — YAML frontmatter with `description`, `globs`, `alwaysApply`; legacy `.cursorrules` still works but deprecated
- **MCP:** `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global); JSON `mcpServers` object; ~40 tool limit across all servers
- **Hooks:** Cursor Hooks system — pre/post tool execution, can block with exit code 2; command handler only; 10-20x faster since Jan 2026
- **Automations:** Schedule/event-based (Slack, Linear, GitHub, PagerDuty) — distinct from hooks
- **Plugin marketplace:** cursor.com/marketplace; MCP-centric plugins
- **NO slash commands:** Chat-based agent instructions only
- **Character limit per .mdc:** 6,000 chars; format note — flat .mdc files work, `RULE.md` subdirectory format documented but broken

### Windsurf / Cascade (windsurfrules + MCP + hooks)

- **Reads:** `.windsurfrules` at repo root; global `~/.codeium/windsurf/global_rules.md`; 6,000 chars per file, 12,000 chars combined
- **MCP:** `~/.codeium/windsurf/mcp_config.json` — Claude Desktop schema compatible; STDIO, Streamable HTTP, SSE; 100-tool limit
- **Hooks (Cascade Hooks):** pre-read-code, pre-write-code, pre-execute, and 9 others (12 total); exit code 2 blocks; JSON config files at three levels (merged); Python/Bash/Node.js scripts
- **Memories:** Cascade stores cross-session context (distinct from hooks)
- **Workflows:** `.windsurfrules`-driven multi-step workflows
- **NO slash commands**
- **NO formal subagents**

### GitHub Copilot (copilot-instructions.md + MCP + experimental hooks)

- **Reads:** `.github/copilot-instructions.md`; also discovers AGENTS.md and CLAUDE.md as of Feb 2026
- **MCP:** JSON `mcpServers` object; auto-approve at server and tool level; GA as of 2026
- **Hooks:** Agent Hooks — in preview; not GA yet
- **Skills:** `.github/skills/*.md` — experimental, not fully documented
- **Agents:** Custom agents — GA; sub-agents in preview
- **Governed by:** GitHub/Microsoft (not Anthropic)

---

## Feature Dependencies

```
MCP server config → per-platform MCP format (config.toml vs JSON)
  Codex MCP → TOML format (unique requirement)
  All others → JSON mcpServers object (same schema, different file path)

Hooks → platform availability check first
  Claude Code hooks → always generate (all 4 handler types)
  Gemini CLI hooks → generate BeforeTool/AfterTool equivalents
  Windsurf hooks → generate Cascade Hooks JSON
  Cursor hooks → generate Cursor Hooks config
  Codex hooks → SKIP (no hook system exists)
  GitHub Copilot hooks → SKIP until GA

Slash commands → Claude Code only
  Other platforms → convert to prose context sections in AGENTS.md / GEMINI.md / .windsurfrules

Subagents / agents → Claude Code only
  Other platforms → convert to prose context sections describing the agent's role

SKILL.md → Claude Code native format
  Claude Code → use as-is
  Others → strip YAML frontmatter, embed prose as named context section

${CLAUDE_PLUGIN_ROOT} path variable → Claude Code runtime only
  Other platforms → must use relative or absolute paths in generated configs

Skills index (skills_index.json) → cross-platform discovery
  All platforms benefit from extending with platform capability fields
```

---

## MVP Recommendation

Build in this priority order:

1. **Context file generation for all platforms** — every plugin gets AGENTS.md (Codex), GEMINI.md (Gemini), `.cursor/rules/<plugin>.mdc` (Cursor), `.windsurfrules` update (Windsurf). This gives every plugin a baseline on every platform.

2. **MCP config translation** — for the 7 plugins with MCP: generate per-plugin Codex TOML sections, Gemini settings.json blocks, Cursor .cursor/mcp.json, Windsurf mcp_config.json entries. Format is the only delta — MCP server definitions are semantically identical.

3. **Hook translation for Gemini, Cursor, Windsurf** — for the 5 plugins with hooks: generate platform-equivalent hook configs. Skip Codex (no hook system). Mark Copilot as future.

4. **Skill content embedding** — strip YAML frontmatter from each SKILL.md, embed the instruction body into non-Claude context files under a named heading.

5. **Command content embedding** — for 61 commands across 20 plugins: convert command Markdown bodies to context sections in non-Claude files; preserve Claude-native command files unchanged.

Defer:
- GitHub Copilot hooks — not GA; wait for stable API
- `.cursorrules` (legacy) — skip; generate .mdc only
- Interactive CLI tool — explicitly out of scope this milestone
- LSP configs — Claude-only; document as Claude-only, generate nothing for others

---

## Sources

- [Codex CLI AGENTS.md guide](https://developers.openai.com/codex/guides/agents-md)
- [Codex CLI MCP reference](https://developers.openai.com/codex/mcp)
- [Codex CLI config reference](https://developers.openai.com/codex/config-reference)
- [Codex CLI sandboxing](https://developers.openai.com/codex/concepts/sandboxing)
- [Gemini CLI GEMINI.md docs](https://google-gemini.github.io/gemini-cli/docs/cli/gemini-md.html)
- [Gemini CLI MCP servers](https://geminicli.com/docs/tools/mcp-server/)
- [Gemini CLI hooks reference](https://geminicli.com/docs/hooks/reference/)
- [Google Developers: Gemini CLI hooks blog post](https://developers.googleblog.com/tailor-gemini-cli-to-your-workflow-with-hooks/)
- [Claude Code hooks reference](https://code.claude.com/docs/en/hooks)
- [Claude Code skills docs](https://code.claude.com/docs/en/skills)
- [Cursor rules docs](https://cursor.com/docs/context/rules)
- [Cursor MCP docs](https://cursor.com/docs/mcp)
- [Cursor hooks docs](https://cursor.com/docs/hooks)
- [Windsurf Cascade MCP docs](https://docs.windsurf.com/windsurf/cascade/mcp)
- [Windsurf Cascade hooks docs](https://docs.windsurf.com/windsurf/cascade/hooks)
- [GitHub Copilot MCP extension docs](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/extend-coding-agent-with-mcp)
- [AGENTS.md unified format](https://agents.md/)
- [Codex hooks: PRs closed without merge (confirmed no hook system)](https://developers.openai.com/codex/config-advanced)
