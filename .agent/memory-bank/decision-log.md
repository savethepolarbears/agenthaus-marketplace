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

---

## ADR-009: Provider-Native MCP Registration with External Ownership State

**Decision:** `agenthaus install` writes MCP servers in each provider's documented format (Codex `[mcp_servers.*]` TOML, Antigravity `serverUrl`, VS Code `servers`, Devin/Windsurf `mcp_config.json`) and installs Claude Code plugins through `claude plugin` rather than copying folders. Ownership of merged entries lives in `~/.agenthaus/state.json`, not in the provider configs.

**Rationale:** Provider docs (verified 2026-09-25) show Claude Code loads plugins only via its marketplace registry, Codex ignores `[mcp.servers.*]` and does not expand `${VAR}`, and Antigravity rejects `url`. Keeping ownership out of provider configs avoids undocumented top-level keys, lets one shared module (`src/providers/mcp-ownership.js`) own the merge/namespace/prune rules for every JSON provider, and keeps user-owned entries safe on uninstall. All config writes are atomic with a rolling `.agenthaus.bak`.


## ADR-010: v2.1 Modular Runtime Planning and Legacy Gap Ownership

**Decision (approved 2026-10-05):** Create v2.1 “The Modular Agentic Runtime” and retain incomplete v2.0 Phase 6–8 requirement ownership. New phases start at 9. v2.0 is superseded with gaps, not certified complete. BASE-01 renews the missing Phase 5 final verification.

**Scope:** Milestone/requirements/roadmap and six legacy gap plans are defined. All implementation and acceptance are pending. Keep Claude-native manifests, CommonJS/minimal runtime dependencies, external ownership state and existing collision naming. Use sidecar metadata, measured paged discovery, reviewed SHA-256 locks, event-specific hook adapters, honest isolation capabilities and fenced leases. TypeScript/WebSocket migrations are deferred.

**Artifacts:** Tracked .planning/ROADMAP.md and STATE.md; local ignored PROJECT/REQUIREMENTS/research/phase plans and reports/modular-runtime-analysis.md. Intentional ignore/privacy policy remains; do not force-add internal planning/reports.


## 2026-10-05 — Phase 6 guard execution

Implemented opt-in stdio guard, strict bounded policy matching, Ed25519 single-use receipts, operator-terminal signing command, and generated provider wrapping. Default providers and ownership namespace stay unchanged. Private keys, pinned configuration and consumed-nonce state need an independent operator trust boundary; same-user file modes do not establish isolation. Direct shell and remote calls remain unprotected; hooks provide guidance only. 181 tests and 37 plugins pass locally. Phase 6 is human_needed for live provider discovery/operator UX and legacy baseline acceptance; Phases 7–8 are not executed. Evidence: reports/phase-06-verification-receipt.json.

## 2026-10-24 — Graphify/catalog review and bounded guard corrections

Merged remote main 4b528d19 into feat/modular-runtime-phase-6 at 2dbccdbd. Local review fixes cap upstream guard input at 4 MiB, retain cancelled operations' deadlines/concurrency slots, fail closed on marketplace jq validation errors, and remove command arguments from WP audit events. QA-Droid's locked transitive dependency repair reports zero npm audit vulnerabilities; fast-uri stays on patched 3.x.

Fresh local evidence: 190 core tests, 37 plugin validations, and the real QA-Droid STDIO/Chromium smoke test pass. Source patches are uncommitted; exact worktree/policy hashes and coverage limits are in ignored reports/graphify-plugin-review/receipt.json. Graph rebuilt to 4,282 nodes and 4,739 edges, with code-only refresh and carried-forward document relationships. Independent reviews found no new regression in the accepted fixes.

Phase 6 remains human_needed. Approval receipts still lack trusted upstream-server identity binding, permitting same-request substitution when key/actor/provider/policy/scope are shared. Provider discovery/operator UX and independently protected operator configuration/key/nonce state remain unverified. Existing v2.1 phase ownership and provider lifecycle invariants stay authoritative. Proposed next work is Phase 6 acceptance, then Phases 7–8; see ignored reports/graphify-plugin-review/next-milestone.md. Remaining shadow queue, catalog identity, MCP reference/path, and progressive-disclosure findings are documented separately; no global updates or external service writes occurred.

## 2026-10-24 — Receipt v2 and audited local remediation

Approval receipts now bind a reviewed installation/server/launch descriptor. Version1 fails closed; programmatic approval wiring requires a per-server target file, selects its absolute executable and resets documented launcher startup controls. Hashing and upstream forwarding share an explicit correlation-field normalization contract; arbitrary semantic metadata remains bound. No claim of full OS isolation follows.

222 core tests,37 plugin validations, real Claude Code temporary-provider read/deny/approved-once/replay-denied tests and PTY refusal/decline/signing tests pass. Disposable keys were removed. Independent operator identity/configuration/nonce protection remains a deployment gate; source fixes and temporary profiles do not close it. Phase6 supplement06-03 records local closure without accepting the phase or milestone.

Catalog indexv2 uses typed unique IDs with legacy_id retained. Strict schema/coverage checks replace count tolerance. Canonical MCP references were reconciled, official Outscraper routes pinned to outscraper-mcp0.2.5, and Gemini/Antigravity resolves plugin roots. Shadow proposals are atomic digest-only records with a4MiB input ceiling and require fresh review. Six large skill bodies are preserved in deferred references; their static scores improve to100, without measured token-saving claims.

Two isolated generation passes are byte-identical. Public-registry inventory reports11of18 distinct pre-existing npx references unavailable without authentication; no arbitrary replacement, OAuth or vendor mutation was inferred. See reports/autonomous-remediation for exact receipts and remaining boundaries. Source changes remain uncommitted; existing provider lifecycle and phase ownership decisions stay authoritative.

## 2026-10-25 — Phases7–14 local runtime implementation

User explicitly authorized continuing Phases7–14 while Phase6 acceptance stays open. Implemented typed handoffs and optional memory, isolated health/source-bound receipts, standards-compatible metadata, paged capability discovery and safe reads, Unicode/content locks with verified staging, typed bounded hook execution, SQLite leases/fencing/migration, structural Codex TOML and JSON ownership preservation, and target-scoped discovery refresh. Review fixes reject misleading dry-run combinations, migration preview state collisions, malformed ownership/TOML, ambient loader controls and incoherent hook results.

Real Claude Code temporary stdio/HTTP fixture reads and correlated guard denial were observed; native manifest validation covered37plugins and one skill was loaded. Adapter fixtures and source checks do not establish other native clients, vendor credentials, independent operator protection, hosted CI or production effects. A temporary test cwd bug appended instruction references; exact proven append-only pollution was removed, original AGENTS preimage restored, and byte-invariance regression added. Source remains uncommitted/unpushed. See reports/remaining-phases/review.md and receipt.json for current exact check counts/hashes; older phase receipts are historical after source changes.

## 2026-10-25 — Autonomous local verification and security closure

Phases7–14 now have criterion-level local verification, requirement/SUMMARY cross-references, source fingerprints, Nyquist coverage maps and retroactive security registers. Independent typed security audit found two medium Codex gaps: malformed MCP definitions reached rendering and uninstall removed unmarked user prose. Root reused shared server validation, added cwd type checking and limited removal to marked selected-plugin references. Both regressions failed before the fix;72focused provider tests and424core tests passed afterward. Independent actual-code VM reproductions closed both findings;21/21registered threats closed.

Architecture/API documentation now matches the actual CommonJS runtime and current CI definition rather than a removed storefront or unimplemented modules. Phase6 remains explicitly deferred/human_needed; no milestone archive, cleanup, deployment or production acceptance follows from local completion. Configured gpt-5.6-terra auditor route was unavailable; inherited model with resolved effort performed the typed read-only audit.

MemPalace status was observed, but automatic approval review rejected transmitting a private phase summary for duplicate checking because payload/destination lack specific authorization. No artifact was filed; the optional hook is skipped with a concrete export plan under reports/autonomous-closeout. Do not retry or route around this rejection without specific authorization.
