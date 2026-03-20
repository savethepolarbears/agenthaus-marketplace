# Project Research Summary

**Project:** AgentHaus Marketplace — Cross-Platform Plugin Support
**Domain:** AI coding agent plugin format conversion pipeline
**Researched:** 2026-03-20
**Confidence:** HIGH

## Executive Summary

AgentHaus Marketplace has 27 production-ready Claude Code plugins and needs to become usable on Codex CLI, Gemini CLI, Cursor, and Windsurf. This is not a software product build — it is a format conversion problem. Each platform reads a different set of config files from the filesystem, and the work is generating those files from the canonical Claude-native sources already in the repo. The recommended approach is a static generation pipeline (Node.js script) that reads each plugin's Claude-native files and emits committed AGENTS.md, GEMINI.md, and .cursor/rules/*.mdc artifacts per plugin. SKILL.md files require no conversion because all target platforms adopted the agentskills.io standard that Anthropic published in December 2025.

The critical constraint is that hooks and MCP server configs are not portable. Claude Code's PreToolUse/PostToolUse hook system has no equivalent on Codex, Gemini, Cursor, or Windsurf — hook behavior must be documented as prose warnings, never claimed to be functional. Codex CLI does not implement MCP at all, meaning 7 MCP-dependent plugins (devops-flow, knowledge-synapse, data-core, agent-memory, clickup-tasks, task-commander, qa-droid) are functionally inert on Codex and must say so explicitly. All other platforms support MCP with the same JSON schema as Claude's .mcp.json — only the file location differs.

The highest-leverage first step is fixing the existing skill stubs before running any generator. Research confirmed that 5 of 7 audited SKILL.md files had no YAML frontmatter at all, and 2 agent files reference a deprecated model name. A generator running against broken sources produces broken output. The phase order is: audit and fix sources → build generator → run generator → refresh documentation.

## Key Findings

### Recommended Stack

This project is a format-mapping pipeline, not a software build. The "stack" is the set of file format specs for each target platform plus a Node.js/TypeScript conversion script that matches the existing repo tooling.

**Core technologies:**
- `Claude plugin.json + SKILL.md`: Canonical source of truth — all other formats derive from this
- `agentskills.io SKILL.md spec`: Universal cross-platform skill format adopted by all 5 targets — write once, works everywhere
- `Node.js generator script (scripts/generate-cross-platform.js)`: Orchestrator that reads canonical Claude sources and emits per-platform output files; matches existing scripts/ pattern
- `AGENTS.md (Codex + Windsurf)`: One generated Markdown file per plugin satisfies both platforms (Windsurf adopted AGENTS.md natively March 2026)
- `GEMINI.md (Gemini CLI)`: Separate generated file with @include support for large plugins
- `.cursor/rules/<name>.mdc (Cursor)`: MDC format with YAML frontmatter; replaces deprecated .cursorrules

**Critical version note:** Cursor 0.45+ deprecated `.cursorrules`; generate `.mdc` files only. `claude-3-7-sonnet-20250219` was retired October 28, 2025; replace with alias `sonnet` in all agent frontmatter.

### Expected Features

**Must have (table stakes):**
- Context files for every platform (AGENTS.md, GEMINI.md, .mdc) — minimum viable cross-platform presence
- Platform-specific MCP config snippets — users cannot configure MCP without them
- Accurate platform limitations documentation — MCP-only plugins must not claim Codex support
- Per-platform env var setup instructions — credentials vary by platform config location
- README cross-platform section — users need to know what they get on each platform

**Should have (competitive differentiators):**
- Platform capability matrix per plugin — explicit table of what works where; no other marketplace provides this
- `skills_index.json` extended with `platforms` field — cross-platform skill discovery via npx
- Hook-equivalent prose context for Gemini/Cursor/Windsurf — behavior guidance even without enforcement
- Automated generation via CI — detect stale generated files before they ship
- Validation script extended for cross-platform checks (AGENTS.md byte count, .mdc frontmatter, @include path resolution)

**Defer to v2+:**
- GitHub Copilot hooks support — preview/not GA as of March 2026
- Interactive CLI tool for plugin installation — out of scope this milestone
- LSP config cross-platform equivalents — LSP is Claude Code-only; no target platform has an equivalent
- OpenClaw as a conversion intermediary — adds runtime dependency; native formats now adequate

### Architecture Approach

The system is a static generation pipeline: canonical Claude plugin sources are read once, normalized into a platform-agnostic JavaScript data model, then rendered to platform-specific output files that are committed to git alongside their sources. Platform tools (Codex, Gemini CLI, Cursor, Windsurf) read files directly from the repo — they do not execute build scripts — so committed files are the only delivery mechanism. The generator is idempotent: re-running it on unchanged sources produces identical output, skipping writes when file content matches.

**Major components:**
1. `lib/readers/plugin-reader.js` — reads all canonical Claude files per plugin into a normalized data model
2. `lib/translators/hook-translator.js` — converts hook JSON to prose limitation notices (never executable configs)
3. `lib/translators/mcp-translator.js` — reformats `.mcp.json` mcpServers to per-platform snippet files
4. `lib/writers/agents-md-writer.js` — renders AGENTS.md for Codex CLI and Windsurf (one file serves both)
5. `lib/writers/gemini-md-writer.js` — renders GEMINI.md plus gemini-settings-snippet.json per plugin
6. `lib/writers/cursor-mdc-writer.js` — renders `.cursor/rules/<name>.mdc` with correct YAML frontmatter
7. `lib/writers/skills-index-writer.js` — regenerates skills_index.json with platforms + cross_platform_configs fields
8. `scripts/generate-cross-platform.js` — orchestrator that iterates all 27 plugins and calls each writer

### Critical Pitfalls

1. **Codex CLI has no MCP support** — All 7 MCP-dependent plugins silently fail on Codex. Every generated AGENTS.md for these plugins must include a prominent Platform Limitations section. Never generate Codex configs that imply MCP tools will work.

2. **SKILL.md multiline description breaks discovery silently** — Claude Code only reads the `description` YAML scalar for skill discovery; a formatter-introduced newline truncates it with no error. All descriptions must be single-line strings. Never run Prettier on SKILL.md files.

3. **Deprecated model names cause silent agent degradation** — `claude-3-7-sonnet-20250219` was retired October 28, 2025. Files `sdet-agent.md` and `trend-analyzer.md` use this model. Replace with tier alias `sonnet` immediately.

4. **Hook variables are Claude Code-exclusive** — `$CLAUDE_PLUGIN_ROOT`, `$CLAUDE_PROJECT_DIR`, `$CLAUDE_OUTPUT`, `$TOOL_INPUT` do not exist outside Claude Code. All 9 hook files in the repo are affected. Cross-platform configs must never claim hook enforcement. Document the safety gap per plugin.

5. **Codex AGENTS.md 32 KiB hard limit silently truncates** — Codex concatenates files from repo root to CWD with a 32 KiB ceiling; per-plugin files added last are cut first. Keep repo-level AGENTS.md under 6 KiB and each plugin AGENTS.md under 2 KiB. Enforce as a build-time validation check.

6. **Symlink strategy collapses under platform differentiation** — CLAUDE.md, .cursorrules, .windsurfrules are currently symlinks to AGENTS.md. Once per-platform content diverges, the symlinks propagate one platform's content to all others. Decouple to real files before generating per-plugin configs.

## Platform Compatibility Matrix

| Feature | Claude Code | Codex CLI | Gemini CLI | Cursor | Windsurf |
|---------|-------------|-----------|------------|--------|---------|
| Context files | plugin.json + CLAUDE.md | AGENTS.md | GEMINI.md | .cursor/rules/*.mdc | AGENTS.md |
| SKILL.md (agentskills.io) | YES — native | YES — native | YES — native | YES — native | YES — native |
| MCP servers | YES — .mcp.json | NO — not implemented | YES — settings.json | YES — .cursor/mcp.json (40-tool limit) | YES — mcp_config.json (100-tool limit) |
| Slash commands | YES — commands/*.md | NO — prose in AGENTS.md | NO | NO | NO |
| PreToolUse / PostToolUse hooks | YES — all 4 handler types | NO — no hook system | YES — BeforeTool/AfterTool | YES — Cursor Hooks | YES — Cascade Hooks |
| Subagent spawning | YES — agents/*.md | NO | NO | NO | NO |
| MCP env var syntax | ${VAR} | ${VAR} | ${VAR} | ${env:VAR} — DIFFERENT | ${VAR} |
| Config file format | JSON + Markdown | TOML (unique) + Markdown | JSON + Markdown | JSON + MDC | JSON + Markdown |
| Plugin marketplace | YES — /plugin install | NO | NO | YES — cursor.com/marketplace | PARTIAL |

**Key gap: Cursor uses `${env:VAR}` syntax for MCP env vars.** Using Claude's `${VAR}` in Cursor's .cursor/mcp.json causes silent credential resolution failure.

## Implications for Roadmap

Based on combined research findings, the dependency graph dictates a strict 4-phase order. A generator running against stub SKILL.md files produces garbage. Phase 1 is the critical path bottleneck.

### Phase 1: Source Quality Audit
**Rationale:** Generator correctness depends entirely on source file quality. Running generation against broken stubs or deprecated model refs produces broken cross-platform output. This is the critical path.
**Delivers:** All 27 plugin.json files validated, all SKILL.md stubs replaced with spec-compliant files (frontmatter + body + trigger-rich descriptions), deprecated model names replaced with tier aliases, skills_index.json regenerated from live sources.
**Addresses:** Must-have features — platform-accurate documentation cannot be generated from stale sources.
**Avoids:** Pitfalls 2 (multiline description), 3 (deprecated models), 8 (body-only trigger conditions), 9 (skills_index.json drift).

### Phase 2: Generator Build
**Rationale:** Only stable once Phase 1 sources are trustworthy. Architecture is well-defined — 7 components with clear input/output contracts. Standard Node.js file I/O, no novel patterns.
**Delivers:** `scripts/generate-cross-platform.js` + `lib/readers/`, `lib/translators/`, `lib/writers/` modules. Idempotent. Produces committed output files for all 27 plugins.
**Uses:** Node.js (matches existing scripts/ tooling), gray-matter for YAML frontmatter parsing, fs/promises for atomic writes.
**Implements:** Full architecture from ARCHITECTURE.md (8 components).
**Avoids:** Pitfall 4 (hook variable portability — translator emits prose, never shell), Pitfall 5 (generate .mdc not .cursorrules), Pitfall 10 (decouple symlinks before generating), Pitfall 11 (hooks excluded from cross-platform output).

### Phase 3: Generation Run and Output Review
**Rationale:** Depends on Phase 2 generator being functional. This phase executes the generator, validates output quality, and commits generated artifacts for all 27 plugins.
**Delivers:** Per-plugin AGENTS.md (Codex + Windsurf), GEMINI.md, .cursor/rules/*.mdc, gemini-settings-snippet.json (7 MCP plugins), updated skills_index.json with platforms + cross_platform_configs fields.
**Avoids:** Pitfall 1 (Codex MCP claims — compatibility matrix embedded in each generated file), Pitfall 6 (32 KiB size check run as validation step), Pitfall 7 (GEMINI.md additive-only design), Pitfall 12 (per-plugin GEMINI.md kept under 300 words).

### Phase 4: Documentation Refresh
**Rationale:** Generated configs are useless without platform-specific installation instructions. This phase produces the user-facing documentation that explains what each platform gets.
**Delivers:** README.md updated with per-platform installation sections, CONTRIBUTING.md updated with generator usage and regeneration workflow, plugins-static.ts updated to include 4 missing plugins (seo-geo-rag, gog-workspace, apple-photos, wp-cli-fleet), per-plugin README sections documenting which features are available on which platform.
**Addresses:** Must-have — cross-platform README; Differentiator — platform capability matrix per plugin.
**Avoids:** Pitfall 13 (repo-level AGENTS.md must be self-sufficient for Codex root-dir users), Pitfall 14 (validation script extended for cross-platform correctness).

### Phase Ordering Rationale

- Phase 1 before Phase 2: The generator's output quality is bounded by source quality. Generating against stubs produces outputs that must be regenerated anyway.
- Phase 2 before Phase 3: The generator must exist before it can run. Architecture is fully specified — no ambiguity in what to build.
- Phase 3 before Phase 4: Documentation describes what was generated. Writing docs before seeing actual output risks inaccurate claims.
- Hook prose and MCP snippets are baked into Phases 2+3 rather than separate phases — they are format transformations within the generator, not standalone work.

### Research Flags

Phases with standard, well-documented patterns (skip `/gsd:research-phase`):
- **Phase 1:** Audit work against known specs — no novel research needed, just validation against verified platform docs.
- **Phase 4:** Documentation writing — standard pattern, no new platform research required.

Phases that may need targeted research during planning:
- **Phase 2 (Generator Build):** Specifically the gray-matter YAML parsing behavior and whether it faithfully handles all current frontmatter patterns in the repo. Spot-check before committing to the parser choice.
- **Phase 3 (Gemini MCP snippets):** Verify the exact merge path for Gemini settings.json on per-platform setups before baking instructions into generated GEMINI.md files. The documented path (`~/.gemini/settings.json`) is confirmed but project-scoped overrides need a test run.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Platform file formats verified against official docs for all 5 targets; agentskills.io spec confirmed as universal standard |
| Features | HIGH | Platform capability matrix built from official docs + confirmed closed GitHub PRs (Codex hooks, MCP gaps) |
| Architecture | HIGH | Generator pattern is well-established static-site-generator style; component boundaries derived from clear input/output contracts |
| Pitfalls | HIGH | All critical pitfalls (1-6) verified from official documentation or confirmed GitHub issues; no speculation involved |

**Overall confidence:** HIGH

### Gaps to Address

- **Windsurf MCP project-scoped config path:** The documented path is `~/.codeium/windsurf/mcp_config.json` (global) but no confirmed project-scoped equivalent. Generated Windsurf content should direct users to global config with a note that project-scoped support is unconfirmed. Validate by testing before shipping Windsurf MCP instructions.
- **Cursor MDC subdirectory format:** Official docs mention a `RULE.md` subdirectory format for `.cursor/rules/` but flag it as currently broken. Stick to flat `.mdc` files — this is not a risk, just a documentation note.
- **GitHub Copilot skills (.github/skills/*.md):** Listed as experimental. Research confirmed it exists but it is not fully documented. Exclude from this milestone; revisit when GA.
- **Gemini CLI `@include` path resolution:** Confirmed as supported syntax but exact behavior when a referenced file is missing is not documented. Generator should use `@include` only for optional supplemental content, not for required plugin instructions.

## Sources

### Primary (HIGH confidence)
- [Claude Code — Plugins reference](https://code.claude.com/docs/en/plugins-reference) — plugin.json schema, SKILL.md frontmatter spec
- [Claude Code — Hooks reference](https://code.claude.com/docs/en/hooks) — hook events, handler types, Claude-exclusive env vars
- [agentskills.io specification](https://agentskills.io/specification) — universal SKILL.md standard, adoption list
- [Codex CLI — AGENTS.md guide](https://developers.openai.com/codex/guides/agents-md) — file loading chain, 32 KiB limit
- [Codex CLI — Agent Skills](https://developers.openai.com/codex/skills) — SKILL.md support confirmed
- [Gemini CLI — GEMINI.md docs](https://geminicli.com/docs/cli/gemini-md/) — loading hierarchy, alphabetical ordering, @include
- [Gemini CLI — MCP configuration](https://geminicli.com/docs/tools/mcp-server/) — settings.json mcpServers schema
- [Cursor — Rules reference](https://cursor.com/docs/context/rules) — .mdc format, deprecation of .cursorrules
- [Cursor — MCP docs](https://cursor.com/docs/context/mcp) — ${env:VAR} syntax confirmed
- [Windsurf — AGENTS.md](https://docs.windsurf.com/windsurf/cascade/agents-md) — AGENTS.md adoption, sub-directory scoping
- [Anthropic Model Deprecations](https://platform.claude.com/docs/en/about-claude/model-deprecations) — claude-3-7-sonnet-20250219 retired Oct 28, 2025
- [GitHub Issue #9817: SKILL.md multiline description bug](https://github.com/anthropics/claude-code/issues/9817)
- [GitHub Issue #7138: Codex AGENTS.md silent truncation](https://github.com/openai/codex/issues/7138)

### Secondary (MEDIUM confidence)
- [Gemini CLI — Extensions reference](https://geminicli.com/docs/extensions/reference/) — gemini-extension.json format
- [Cursor Community Forum — .cursorrules deprecation](https://forum.cursor.com/t/generate-cursor-rules-created-a-deprecated-cursorrules-file/113200)
- [AI Coding Agents 2026 comparison](https://lushbinary.com/blog/ai-coding-agents-comparison-cursor-windsurf-claude-copilot-kiro-2026/) — Codex MCP absence corroborated
- [codex-hooks community project](https://github.com/hatayama/codex-hooks) — Codex hook limitations analysis

### Tertiary (LOW confidence)
- [OpenClaw plugin bridge overview](https://docs.openclaw.ai/tools/plugin) — reviewed and rejected as intermediary; adds dependency with no benefit over native formats
- [Windsurf community rules guide](https://playbooks.com/windsurf-rules) — corroborates official docs; not authoritative

---
*Research completed: 2026-03-20*
*Ready for roadmap: yes*
