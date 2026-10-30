# Architecture Overview

AgentHaus Marketplace distributes37canonical Claude plugins and a zero-dependency CommonJS CLI in bin/agenthaus.js and src/. There is no agenthaus-web directory in this checkout. Provider settings are derived adapters; plugin manifests remain canonical for this repository catalog. Global project/capability registration remains governed by the provider-neutral workspace registry.

## Components and reuse boundaries

| Component | Source and responsibility |
|---|---|
|Catalog|src/catalog.js discovers actual plugin directories; .claude-plugin/marketplace.json registers37plugins.|
|CLI|bin/agenthaus.js → src/cli.js; legacy installer/doctor/sync routes are preserved. src/runtime-cli.js dispatches on-demand skill,capabilities,permissions,lock,unicode,hook and task commands.|
|Provider lifecycle|src/installer.js reuses built-in provider adapters; provider preflight precedes target mutation. src/providers/mcp-ownership.js is the shared JSON ownership/collision authority.|
|Structural config|src/toml-structure.js validates a bounded conservative TOML subset; src/codex-toml.js renders native tables; src/providers/codex.js preserves unmanaged text and marked ownership. Unsupported forms fail closed.|
|Typed handoff and coordination|src/handoff.js validates envelopes/correlation/evidence. src/blackboard.js reuses that validation with capability-tested SQLite CLI transactions,60-second leases and fencing. No database dependency is installed by the CLI.|
|Optional memory|src/memory-integrations.js provides explicit37-plugin statuses and enabled/opt-in controls. Recall failure falls back to native state; memory cannot grant execution authority.|
|Discovery and metadata|src/skill-metadata.js enumerates48skills independently of the177-component index. src/capabilities.js reuses those descriptors for deterministic paged manifests and safe body reads. AgentHaus sidecars remain separate from native manifests.|
|Integrity|src/unicode-hygiene.js and src/integrity.js validate reviewed payload bytes, executable metadata and contained paths. Installer/strict sync reuse private verified staging. Lock renewal is explicit.|
|Execution guard|src/safety-wiring.js wraps configured stdio routes using src/safety-guard.js and shared policy/request/receipt validation. Independent operator protection and deployment acceptance remain open in Phase6.|
|Hook execution|src/hook-runtime.js provides typed event adapters, bounded shell-free spawning and an explicit environment. Environment cleaning is not filesystem/network isolation.|
|Evidence|src/workflow-receipt.js binds HEAD, scoped policy hashes and worktree bytes. scripts/check-runtime-health.js generates twice and runs doctor/comparators in a disposable source/profile fixture. Receipts are local unsigned evidence.|

## Dependency flow

The CLI is the composition root. Capabilities reuse skill metadata; blackboard reuses handoff validation; install/update/strict sync reuse integrity snapshots and existing provider adapters; all JSON providers share ownership logic and atomic filesystem helpers. The existing CommonJS runtime and schemas are retained instead of introducing a framework, alternate catalog or duplicate provider authority.

Plugin hooks remain native to Claude Code. Other provider adapters do not emulate hooks or independent approval UX. Standalone cached plugins do not bundle the repository runtime modules; advanced runtime commands require this checkout. Provider config fixtures and local stdio/HTTP servers are distinct from observed native-client discovery.

## Validation and acceptance

.github/workflows/ci.yml defines plugin validation, unit tests, isolated health/drift receipts, Node20/22/24 across Linux/macOS/Windows, QA-Droid smoke, dependency audit and secret scanning. These are configured hosted jobs, not evidence that the current uncommitted tree passed hosted CI.

Phases7–14 have local implementations; criterion-level verification and exact source binding live under .planning/phases/ and reports/autonomous-closeout/. Phase6 is explicitly deferred under the user's instruction to continue later phases while keeping its acceptance open. One temporary Claude Code profile exercised local stdio/HTTP reads/denial and one skill loaded; other native providers and real vendor credentials/effects remain unverified. Do not accept or archive the milestone while Phase6 is open.

Source locks detect drift rather than authenticate publishers. SQLite fencing protects accepted board state rather than physical exactly-once effects. Exactly one enabled execution owner must be observed before operating each real automation; local fixtures do not establish production ownership.
