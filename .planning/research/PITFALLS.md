# Domain Pitfalls: Cross-Platform AI Agent Plugin Compatibility

**Domain:** AI coding agent plugin marketplace (Claude Code, Codex CLI, Gemini CLI, Cursor, Windsurf)
**Researched:** 2026-03-20
**Confidence:** HIGH for critical pitfalls (verified against official docs, GitHub issues, release notes)

---

## Critical Pitfalls

Mistakes that cause silent failures, plugin breakage, or complete loss of functionality on one or more platforms.

---

### Pitfall 1: Codex CLI Has No MCP Support — All 7 MCP Plugins Break Silently

**What goes wrong:** This repo has 7 plugins with `.mcp.json` configs: `qa-droid`, `data-core`, `knowledge-synapse`, `devops-flow`, `task-commander`, `agent-memory`, `clickup-tasks`. When a user installs these on Codex CLI, the MCP servers are simply ignored. No error. No warning. The plugin appears installed but its core functionality — every MCP tool call — produces nothing.

**Why it happens:** Codex CLI does not implement the Model Context Protocol. It is an OpenAI-proprietary agent environment. MCP is a Anthropic/open-source protocol that Codex has chosen not to support. This is confirmed by multiple independent comparisons as of early 2026.

**Consequences:**
- `devops-flow` loses Cloudflare, GitHub, and Slack MCP tools — the entire plugin is inert
- `knowledge-synapse` loses Context7, Notion, and Google Drive — the deep-research skill has no data sources
- `data-core` and `agent-memory` lose their Neon Postgres connections — database operations fail silently
- Users get no error message; they just get an AI that says "I couldn't find that tool"

**Prevention:**
- Every cross-platform AGENTS.md for MCP-dependent plugins must include a prominent `## Platform Limitations` section stating: "On Codex CLI, MCP tools are unavailable. This plugin's core functionality requires Claude Code or Gemini CLI."
- Do not generate Codex AGENTS.md that implies MCP tools will work
- For Codex, provide fallback instructions using the Codex native tool set (file reads, bash, web search)

**Detection:** Look for `.mcp.json` at plugin root. If it exists and the platform is Codex, flag as incompatible.

**Phase:** Must be addressed in the cross-platform config generation phase before shipping any Codex AGENTS.md files.

**Confidence:** HIGH — confirmed by multiple 2026 comparative reviews and Codex CLI feature documentation.

---

### Pitfall 2: SKILL.md Multiline Description Breaks Claude Code Discovery Silently

**What goes wrong:** Claude Code skill discovery loads the `description` field from YAML frontmatter to decide whether to invoke a skill. If the description wraps to multiple lines (e.g., Prettier with `proseWrap: true` reformats it), skill discovery breaks completely. No error is emitted. The skill is not selected, not invoked, and the user gets no feedback.

**Why it happens:** Claude Code's YAML parser treats the frontmatter `description` as a single scalar string. When a formatter introduces a literal newline inside the YAML value, the parser either errors silently or reads only the first line — truncating the "Use when..." triggers that drive discovery.

**Consequences:**
- The skill exists in the repo but is never invoked by Claude
- The `deep-research` skill in `knowledge-synapse` has a 231-char description that is close to a line-wrap boundary at 80-char line width
- The `seo-geo-rag-optimizer` skill has a 579-char description — high risk of formatting-induced wrap
- 5 of 7 skills audited in prior sessions had no YAML frontmatter at all (confirmed in project memory)

**Prevention:**
- Always write the description as a single unbroken YAML string
- Use block scalar style (`description: |`) as a last resort, but test in Claude Code — it may not be parsed the same way
- Never run Prettier or auto-formatters on SKILL.md files
- Add a validation check: `grep -c $'\n' <<< "$description"` should equal 0 in the YAML scalar

**Detection:** The description field in YAML frontmatter contains a literal newline character. The skill is present in `skills_index.json` but never gets invoked during testing.

**Warning signs:**
- Description is longer than ~200 characters
- Repository uses a formatter with `proseWrap: always` or `proseWrap: true`
- Skill was "working" then stopped after a formatting pass

**Phase:** Audit phase (fixing existing stubs). Must be checked before any skill is declared complete.

**Confidence:** HIGH — documented in GitHub issue #9817 on anthropics/claude-code.

---

### Pitfall 3: Deprecated Model Names Cause Silent Agent Degradation

**What goes wrong:** Two agent files in this repo use `claude-3-7-sonnet-20250219` as the model: `qa-droid/agents/sdet-agent.md` and `social-media/agents/trend-analyzer.md`. This model was retired October 28, 2025. On platforms that respect the model field (Claude Code), the agent either falls back to a default model silently or errors at invocation time. On cross-platform configs (Codex, Gemini, Cursor), the model field is simply ignored and the platform's own default is used.

**Why it happens:** Model names age out. `claude-3-7-sonnet-20250219` was a transitional model that Anthropic deprecated on a standard 6-month lifecycle. Alias shortnames like `sonnet` and `haiku` route to the current generation model in that tier and do not go stale.

**Consequences:**
- On Claude Code: agent may fail to invoke or silently downgrade
- Cross-platform: model field is meaningless; users expect the specific model but get whatever the platform defaults to
- The model tier logic (`haiku` for `fleet-monitor`, `sonnet` for heavier agents) gets lost entirely outside Claude Code

**Prevention:**
- Use only tier aliases (`sonnet`, `haiku`, `opus`) in agent frontmatter, never pinned version strings
- For cross-platform AGENTS.md, do not include model specifications — state the recommended Claude tier in a comment
- Audit: `grep -r "claude-3-7-sonnet-20250219" plugins/` before every release

**Detection:** Model field contains a date-versioned string (e.g., `-20250219`, `-20241022`). Cross-reference against the Anthropic model deprecations page.

**Phase:** Plugin audit phase. Fix the 2 broken agent files immediately; enforce alias-only in CONTRIBUTING.md.

**Confidence:** HIGH — Anthropic model deprecations page confirms claude-3-7-sonnet-20250219 retirement date; current model is Sonnet 4.6 as of March 2026.

---

### Pitfall 4: Hook Variables Are Claude Code-Exclusive — Cross-Platform Configs Must Not Reference Them

**What goes wrong:** Nine hook files in this repo reference Claude Code-specific environment variables: `$CLAUDE_PLUGIN_ROOT`, `$CLAUDE_PROJECT_DIR`, `$CLAUDE_OUTPUT`, and `$TOOL_INPUT`. These variables are injected by Claude Code's hook runner. On Codex CLI, Gemini CLI, Cursor, and Windsurf, these variables are either not set or map to different names with different semantics.

**Why it happens:** Claude Code hooks are a Claude-native execution environment. When generating cross-platform instruction files, developers copy hook scripts verbatim without adapting them to the target platform's execution model. None of the other platforms have an equivalent to PreToolUse/PostToolUse shell hooks at all — they don't run shell commands before/after tool calls.

**Consequences:**
- `circuit-breaker` hooks: deploy gate and budget guard scripts silently do nothing on all non-Claude platforms
- `shadow-mode` hooks: the review queue is never populated outside Claude Code — shadow review becomes a phantom feature
- `wp-cli-fleet` hooks: the safety check script (`wp-safety-check.sh`) never runs, removing the guardrail against destructive WP-CLI commands
- Any cross-platform AGENTS.md that says "hooks will enforce X" is lying to the user

**Specific variables and their non-portability:**
- `$CLAUDE_PLUGIN_ROOT` — no equivalent on other platforms; resolves to empty string, causing `bash "" script.sh` style errors
- `$CLAUDE_PROJECT_DIR` — no equivalent; audit log writes silently fail
- `$CLAUDE_OUTPUT` / `$TOOL_INPUT` — Claude Code injects these into the hook's environment; other platforms do not

**Prevention:**
- Cross-platform AGENTS.md must clearly state: "Safety hooks (PreToolUse/PostToolUse) are Claude Code-only. On other platforms, enforce these policies manually."
- Never port Claude Code hook JSON to other platform formats — hooks do not have an equivalent concept
- Document which safety behaviors are lost per platform in a compatibility matrix

**Detection:** Any hook JSON file containing `${CLAUDE_PLUGIN_ROOT}`, `$CLAUDE_PROJECT_DIR`, `$CLAUDE_OUTPUT`, or `$TOOL_INPUT`. All 9 hook files in this repo are affected.

**Phase:** Cross-platform config generation phase. Hooks section must be excluded or annotated for non-Claude outputs.

**Confidence:** HIGH — Claude Code hooks documentation confirms these are Claude Code-exclusive env vars.

---

### Pitfall 5: Cursor `.cursorrules` Is Deprecated — Generating It Creates a Format Debt

**What goes wrong:** If the cross-platform tooling generates `.cursorrules` files, it is writing to a deprecated format. As of Cursor 0.45+, the new format is `.cursor/rules/` directory with `.mdc` files per rule. The legacy `.cursorrules` still loads in a clean directory, but `.mdc` files take precedence when both exist. Generating `.cursorrules` files now means they will stop working the moment a user also has `.cursor/rules/` in their project.

**Why it happens:** Cursor deprecated the format without a hard cutoff date, so documentation and blog posts still reference `.cursorrules`. The AGENTS.md in this repo already references `.cursorrules` as the Cursor format (it is listed as a symlink target). This is now technically incorrect.

**Consequences:**
- Cross-platform configs generated today will be silently overridden by any `.mdc` rules the user already has
- If Cursor removes `.cursorrules` support in a future version, every generated file becomes dead code with no warning
- The existing repo-level `.cursorrules` symlink to `AGENTS.md` is already using the deprecated mechanism

**Prevention:**
- Generate `.cursor/rules/<plugin-name>.mdc` files with frontmatter (`alwaysApply: false`, `globs: []`) instead of `.cursorrules`
- Each plugin gets one `.mdc` file scoped to the plugin's relevant files
- Remove or do not generate `.cursorrules` at the plugin level
- Keep the repo-level `.cursorrules` symlink temporarily for backward compat, but document the migration path

**Detection:** Any file named `.cursorrules` in a plugin directory, or plugin.json that references `.cursorrules` as a capability.

**Phase:** Cross-platform config generation phase. Design the output format as `.mdc` from day one.

**Confidence:** MEDIUM-HIGH — Cursor 0.47 release notes confirm deprecation; exact removal date not announced as of March 2026.

---

### Pitfall 6: Codex CLI AGENTS.md 32 KiB Hard Limit Silently Truncates Instructions

**What goes wrong:** Codex concatenates AGENTS.md files from repo root down to the CWD, stopping at 32 KiB total. Instructions that exceed this limit are silently truncated — no warning is shown in the TUI or CLI output. This is a confirmed and tracked GitHub issue (#7138, #13386 on openai/codex).

**Why it happens:** Codex imposes a context budget (`project_doc_max_bytes`, default 32 KiB) to preserve context window space. When a repo-level AGENTS.md is large (the current repo AGENTS.md is approximately 9 KB) and multiple plugin-level AGENTS.md files are being planned, the total easily exceeds 32 KiB. The most recently added (deepest directory) content is what gets cut.

**Consequences:**
- Per-plugin AGENTS.md files (planned for this milestone) will be the first to be truncated if the limit is hit
- Critical plugin-specific instructions — the ones closest to what the user is actually working on — are silently lost
- Codex appears to follow instructions but the more specific plugin guidance is gone

**Prevention:**
- Keep the repo-level AGENTS.md for Codex under 6 KiB to leave headroom for per-plugin files
- Per-plugin Codex AGENTS.md must be kept under 2 KiB each (assume 10 plugins active at once = 20 KiB plugin budget)
- Use hierarchical placement: put plugin AGENTS.md at `plugins/<name>/AGENTS.md` — Codex will load it only when working in that directory
- Test total concatenated size: `cat AGENTS.md plugins/*/AGENTS.md | wc -c` before shipping

**Detection:** Total size of all AGENTS.md files exceeds 32,768 bytes. Run the byte count check as part of validation.

**Phase:** Cross-platform config generation phase. Enforce size constraints as a build-time check.

**Confidence:** HIGH — GitHub issues #7138 and #13386 on openai/codex confirm silent truncation.

---

## Moderate Pitfalls

Mistakes that degrade functionality or create maintenance problems without causing outright failures.

---

### Pitfall 7: Gemini CLI Reads GEMINI.md Files Alphabetically, Not by Priority

**What goes wrong:** When multiple GEMINI.md files exist in subdirectories, Gemini CLI collects them all and reads them in alphabetical path order, regardless of which directory the user is working in. This means plugin-specific overrides placed in `plugins/agent-handoff/GEMINI.md` have no guaranteed precedence over generic guidance in `plugins/apple-photos/GEMINI.md` — the ordering is filesystem alphabetical, not logical.

**Why it happens:** Gemini CLI uses BFS to discover GEMINI.md files up to 200 directories deep, then sorts them alphabetically. This design prevents OS-specific filesystem ordering differences but means intuitive "closer = more specific" precedence does not apply.

**Consequences:**
- If two GEMINI.md files conflict (e.g., different instructions for handling secrets), the alphabetically-later file wins regardless of relevance
- Plugin instructions that start with letters earlier in the alphabet are read first and can be overridden by unrelated plugins read later
- Total token load from all discovered GEMINI.md files counts against Gemini's 1,000 requests/day quota

**Prevention:**
- Keep all plugin GEMINI.md files non-conflicting — they should add context, not contradict each other
- Put shared/baseline content only in the repo-level GEMINI.md; plugin-level files should only add plugin-specific context
- Keep each plugin GEMINI.md under 500 words to minimize context token consumption

**Detection:** Two plugin GEMINI.md files that include contradictory instructions on the same topic.

**Phase:** Cross-platform config generation. Design plugin GEMINI.md as additive-only, never overriding.

**Confidence:** HIGH — confirmed in Gemini CLI official documentation and independent deep-dive articles.

---

### Pitfall 8: Skill Description as Discovery Mechanism — "When to Use" in Body Is Too Late

**What goes wrong:** Claude Code loads only the `description` field from SKILL.md frontmatter at startup. The skill body (including any `## When to Use` section) is only loaded after the skill has already been selected. This means trigger conditions written in the body have zero effect on whether the skill gets discovered and invoked.

**Why it happens:** Claude Code uses a two-phase loading model: lightweight frontmatter scan at startup → full body load only on invocation. Most developers assume the `## When to Use` section in the body drives discovery.

**Consequences:**
- Skills in this repo that put all their trigger conditions in `## When to Use` sections inside the body are not discoverable unless the description field independently carries those triggers
- Example: `circuit-breaker/skills/safety-guardrails/SKILL.md` has its trigger conditions in both the description and `## When to Use` — the body section is redundant for discovery but not harmful
- Any new skill written with a vague one-sentence description and a detailed `## When to Use` body section will be invisible

**Prevention:**
- Every SKILL.md description must include "Use when..." trigger phrases inline — do not defer to the body
- The description is THE discovery mechanism. Treat it as the only text Claude will read when deciding to invoke this skill
- Body content (`## When to Use`) is useful as a UX confirmation for the user reading the skill, not for Claude's selection logic

**Detection:** SKILL.md where the description is ≤ 50 characters or contains no "Use when" / "when the user" phrasing.

**Phase:** Skill audit phase. All stub replacements must include trigger-rich descriptions.

**Confidence:** HIGH — confirmed by Anthropic official skill authoring best practices documentation and first-principles analysis of how Claude Code skill loading works.

---

### Pitfall 9: `skills_index.json` Drifts from Plugin Reality

**What goes wrong:** The `skills_index.json` (43 KB) at the repo root is the cross-platform discovery mechanism used by non-Claude platforms. It is a static snapshot. If plugins are added, skills are renamed, or descriptions are updated without regenerating the index, other platforms discover stale skill data. CONCERNS.md already flags this.

**Why it happens:** There is no automated regeneration step. The index was generated once and is manually maintained. As this milestone adds skills to stub plugins and updates descriptions, every change requires a manual re-run of whatever generated the index.

**Consequences:**
- Gemini CLI users discover skills via `npx` using the stale index — they get outdated descriptions and missing skills
- New skills added in this milestone (filling stubs) will not appear in cross-platform discovery until the index is regenerated
- The 4 plugins missing from `plugins-static.ts` (seo-geo-rag, gog-workspace, apple-photos, wp-cli-fleet) are likely also missing from or inconsistently represented in the index

**Prevention:**
- Add `scripts/generate-skills-index.sh` that regenerates `skills_index.json` from live plugin files
- Run regeneration as the last step of the validation script (`scripts/validate-plugins.sh`)
- Add a CI check: regenerate index and verify it matches the committed version (diff = fail)

**Detection:** Compare skill names and descriptions in `skills_index.json` against current `plugins/*/skills/*/SKILL.md` files.

**Phase:** Plugin audit phase. Fix the index drift before cross-platform configs go out.

**Confidence:** HIGH — CONCERNS.md explicitly documents this risk; the 4-plugin gap in plugins-static.ts confirms the drift pattern exists.

---

### Pitfall 10: Symlink Strategy for Config Files Creates Platform-Specific Breakage Risk

**What goes wrong:** The repo currently uses symlinks so that `CLAUDE.md`, `.clinerules`, `.cursorrules`, `.windsurfrules`, `.replit.md`, `.idx/airules.md` all point to `AGENTS.md`. This works until any platform needs content that is different from — or in conflict with — `AGENTS.md`. At that point, the symlink strategy collapses: changing AGENTS.md for one platform's needs breaks all others.

**Why it happens:** The symlink approach is a common early-stage shortcut. It works when all platforms can receive identical instructions. It breaks at the point of differentiation — which is exactly what this milestone requires.

**Consequences:**
- If AGENTS.md is updated to include Codex-specific guidance (e.g., "MCP is not available, use bash instead"), that instruction pollutes CLAUDE.md, confusing Claude Code
- Platform-specific notes in AGENTS.md (e.g., "Gemini: use @include for large files") appear verbatim in `.cursorrules` where they are irrelevant
- The GEMINI.md is already a separate standalone file (correctly), suggesting the team already recognized this conflict

**Prevention:**
- Decouple the symlinks: each config file should be a real file with platform-appropriate content
- AGENTS.md: Codex CLI format (pure Markdown, no hooks, no MCP assumptions, size-budgeted)
- CLAUDE.md: Anthropic Claude Code format (current full content is appropriate here)
- GEMINI.md: already standalone — maintain as-is
- `.cursorrules`: legacy stub pointing to `.cursor/rules/` migration; or delete it
- `.windsurfrules`: Windsurf-specific content (currently a symlink to AGENTS.md)

**Detection:** `ls -la CLAUDE.md .cursorrules .windsurfrules` — if any show `->` they are symlinks.

**Phase:** Cross-platform config generation phase. Decouple before generating per-plugin configs.

**Confidence:** HIGH — directly observable in the codebase; the GEMINI.md standalone exception confirms the team already hit this problem.

---

### Pitfall 11: Hook Matcher Patterns Use Claude-Specific Tool Names

**What goes wrong:** Hook matchers in this repo reference Claude Code tool names directly: `"matcher": "Write"`, `"matcher": "Edit"`, `"matcher": "Bash"`. These tool names are Claude Code's internal tool name space. Codex CLI uses different tool names (e.g., `file_write`, `shell`). Gemini CLI uses yet another namespace. If hooks were ever ported to another platform, the matchers would not fire.

**Why it happens:** Hook matchers are written against Claude Code's documented tool name list. There is no cross-platform standard for tool names. Each platform invented its own.

**Consequences:**
- Even if another platform eventually supports hooks, a port of this hook JSON would require rewriting all matchers
- The `social-media` hook matcher `"social-media:(tweet|linkedin|instagram|facebook|analyze-trend)"` references a plugin-namespaced command — this is Claude Code plugin command syntax that is entirely foreign to every other platform

**Prevention:**
- Treat all hook configurations as Claude Code-exclusive artifacts. Never translate them to other platforms.
- Document per-plugin README: "Safety hooks operate only in Claude Code. On other platforms, the following guardrails are not enforced: [list]"

**Detection:** Any hook JSON with `matcher` values referencing `Write`, `Edit`, `Bash`, `Read`, or plugin-namespaced commands.

**Phase:** Cross-platform config generation. Hooks section must be explicitly excluded.

**Confidence:** HIGH — Claude Code hooks documentation lists tool names; no cross-platform standard exists.

---

## Minor Pitfalls

Lower-impact issues that create friction or confusion without breaking functionality.

---

### Pitfall 12: Gemini CLI Request Quota Consumed by Context Discovery

**What goes wrong:** Gemini CLI counts each tool call — including file reads during context discovery — against the 1,000 requests/day quota (on free tier). A repo with 27 plugins, each with a GEMINI.md, means every session startup consumes up to 27+ requests just reading plugin context files, before the user has even typed a command.

**Prevention:** Keep per-plugin GEMINI.md files lean (under 300 words). Use `@include` sparingly. Consolidate plugin guidance into the repo-level GEMINI.md where possible.

**Phase:** Cross-platform config generation. Optimize for token efficiency, not completeness.

**Confidence:** MEDIUM — 1,000 requests/day limit confirmed; exact cost per context discovery file read requires testing.

---

### Pitfall 13: AGENTS.md Per-Plugin Instructions Ignored When User Works at Repo Root

**What goes wrong:** Codex loads AGENTS.md files by walking from the Git root to the current working directory. If the user runs Codex from the repo root (the most common case), per-plugin AGENTS.md files in `plugins/<name>/` are not loaded — Codex does not scan down into subdirectories for instruction files.

**Why it happens:** Codex loads files along the path from root to CWD. It does not load files in sibling or child directories that the user is not currently inside.

**Prevention:** The repo-level AGENTS.md must contain a summary of all plugins. Per-plugin AGENTS.md files are supplementary and only active when the user `cd`s into that plugin directory.

**Detection:** Per-plugin AGENTS.md files that contain instructions critical to correct use from the repo root will never be seen.

**Phase:** Cross-platform config generation. Design the information architecture so the repo-level AGENTS.md is self-sufficient.

**Confidence:** HIGH — confirmed in Codex CLI file loading documentation.

---

### Pitfall 14: Plugin Validation Script Does Not Test Cross-Platform Format Correctness

**What goes wrong:** `scripts/validate-plugins.sh` checks Claude Code-specific structure (`.claude-plugin/plugin.json`, YAML frontmatter, MCP JSON). It does not validate that generated AGENTS.md files are within the 32 KiB limit, that GEMINI.md uses correct `@include` paths, or that `.mdc` files have correct frontmatter. Cross-platform configs could be structurally broken and pass validation.

**Prevention:** Extend validation to cover cross-platform output: byte count check on AGENTS.md, `@include` path resolution check for GEMINI.md, `.mdc` frontmatter field validation for Cursor.

**Phase:** Cross-platform config generation phase. Validation extension should be built alongside the generators.

**Confidence:** HIGH — directly observable gap between what the validator checks and what this milestone requires.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Skill stub replacement | Multiline description breaking discovery (Pitfall 2) | Validate all descriptions are single-line YAML scalars |
| Skill stub replacement | Description too short to trigger discovery (Pitfall 8) | Every description must contain "Use when..." phrasing |
| Agent frontmatter audit | Deprecated model pinned strings (Pitfall 3) | Replace `claude-3-7-sonnet-20250219` with `sonnet` in sdet-agent.md and trend-analyzer.md |
| Cross-platform config generation | Codex MCP gap (Pitfall 1) | Platform compatibility matrix in every plugin's cross-platform output |
| Cross-platform config generation | Cursor deprecated format (Pitfall 5) | Generate `.mdc` files, not `.cursorrules` |
| Cross-platform config generation | Codex 32 KiB truncation (Pitfall 6) | Enforce size budget as a validation check |
| Cross-platform config generation | Symlink decoupling (Pitfall 10) | Create real files before generating per-plugin versions |
| Cross-platform config generation | Hook portability claims (Pitfalls 4, 11) | Never claim hooks work outside Claude Code |
| skills_index.json update | Drift from plugin reality (Pitfall 9) | Automate regeneration as part of validation |
| Documentation refresh | Gemini alphabetical ordering (Pitfall 7) | Design plugin GEMINI.md as additive, non-conflicting |

---

## Sources

- [Claude Code Skill Authoring Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) — SKILL.md frontmatter spec, discovery mechanism (HIGH confidence)
- [GitHub Issue #9817: Skill discovery sensitive to frontmatter formatting](https://github.com/anthropics/claude-code/issues/9817) — multiline description bug confirmed (HIGH confidence)
- [GitHub Issue #25380: SKILL.md validator rejects valid Claude Code extended frontmatter](https://github.com/anthropics/claude-code/issues/25380) — validator vs runtime discrepancy (HIGH confidence)
- [Codex CLI Custom Instructions with AGENTS.md](https://developers.openai.com/codex/guides/agents-md) — file loading, merge order, 32 KiB limit (HIGH confidence)
- [GitHub Issue #7138: AGENTS.md silently truncated](https://github.com/openai/codex/issues/7138) — truncation without warning confirmed (HIGH confidence)
- [GitHub Issue #13386: AGENTS.md instructions near end ignored](https://github.com/openai/codex/issues/13386) — corroborating truncation issue (HIGH confidence)
- [Gemini CLI GEMINI.md documentation](https://geminicli.com/docs/cli/gemini-md/) — alphabetical ordering, @include syntax, 200-dir limit (HIGH confidence)
- [Cursor .mdc rules format guide](https://www.agentrulegen.com/guides/cursor-rules-guide) — deprecation of .cursorrules, .mdc migration (MEDIUM-HIGH confidence)
- [Cursor Community Forum: Generate Cursor Rules created deprecated .cursorrules](https://forum.cursor.com/t/generate-cursor-rules-created-a-deprecated-cursorrules-file/113200) — deprecation confirmed in tooling (HIGH confidence)
- [AI Coding Agents 2026 comparison: Codex MCP limitation](https://lushbinary.com/blog/ai-coding-agents-comparison-cursor-windsurf-claude-copilot-kiro-2026/) — Codex no-MCP confirmed (HIGH confidence)
- [Anthropic Model Deprecations](https://platform.claude.com/docs/en/about-claude/model-deprecations) — claude-3-7-sonnet-20250219 retirement Oct 28, 2025 (HIGH confidence)
- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks) — Claude-exclusive hook system and env vars (HIGH confidence)
- [Windsurf Rules documentation](https://docs.windsurf.com/windsurf/cascade/workflows) — .windsurfrules format and relationship to Cursor rules (MEDIUM confidence)
