# Decision Log

Architectural decisions and their rationale. Agents should consult this before proposing changes that might conflict with established patterns.

## ADR-001: Symlinked AGENTS.md

**Decision:** AGENTS.md is the single source of truth, symlinked to CLAUDE.md, GEMINI.md, .github/copilot-instructions.md, and other agent instruction files.

**Rationale:** Ensures all AI assistants (Claude, Gemini, Copilot, Cursor, Windsurf) receive identical project context without maintaining multiple copies. All symlinks must point to the same file.

**Consequence:** When updating agent instructions, edit only `AGENTS.md` — never the symlinks.

---

## ADR-002: Explicit File Paths in plugin.json

**Decision:** Plugin manifests must use explicit file paths (`"./commands/deploy.md"`), not glob patterns (`"./commands/*.md"`).

**Rationale:** Glob patterns are unreliable in Claude Code's plugin system — the plugin cache may not resolve them correctly. Explicit paths ensure predictable behavior across all installation contexts.

---

## ADR-003: Object Format for Hooks

**Decision:** Hooks use `{ "hooks": { "PreToolUse": [...] } }` object format, not a flat JSON array.

**Rationale:** The object format with named lifecycle event keys (`PreToolUse`, `PostToolUse`) provides clear semantic structure and matches the Claude Code plugin contract. Flat arrays were used in early versions but don't support multiple event types.

---

## ADR-004: Separate .mcp.json Over Inline mcpServers

**Decision:** Plugins may use either inline `mcpServers` in plugin.json or a separate `.mcp.json` file. Prefer `.mcp.json` for complex MCP configurations.

**Rationale:** Separation of concerns — keeps the manifest focused on metadata while MCP configs (which may include multiple servers) remain independently manageable. Inline is acceptable for single-server plugins.

---

## ADR-005: ${CLAUDE_PLUGIN_ROOT} for Local Paths

**Decision:** All plugin-local script references in hooks and MCP configs must use `${CLAUDE_PLUGIN_ROOT}` instead of relative paths.

**Rationale:** Plugins are cached by Claude Code, and the runtime location differs from the source directory. `./hooks/script.sh` won't resolve correctly after installation, but `${CLAUDE_PLUGIN_ROOT}/hooks/script.sh` will.

---

## ADR-006: Neon Serverless Postgres for Web Storefront

**Decision:** The web storefront uses Neon Serverless Postgres rather than a traditional Postgres deployment.

**Rationale:** Serverless Postgres aligns with the Vercel deployment model (auto-scaling, cold-start friendly). The `@neondatabase/serverless` driver supports HTTP-based connections, avoiding long-lived connection pool issues in serverless environments.

---

## ADR-007: Skills Over Inline Instructions

**Decision:** Complex, reusable agent knowledge is encoded as Skills (`.agent/skills/<name>/SKILL.md`) rather than inline system prompt instructions.

**Rationale:** Skills are loaded on-demand, keeping the base context window clean. This follows the Antigravity context engineering principle of "load only what you need." Inline instructions in AGENTS.md should cover universal truths; task-specific knowledge belongs in skills.

---

## ADR-008: Memory Bank for Persistent Context

**Decision:** Persistent project context lives in `.agent/memory-bank/` as structured Markdown files.

**Rationale:** Agents lose context between sessions. Rather than re-analyzing the codebase each time, the memory bank provides a pre-built understanding of architecture, API contracts, and past decisions. This reduces token waste and prevents hallucinations about project structure.
