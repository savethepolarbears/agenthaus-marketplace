---
name: blackboard-protocol
description: Validate typed task, result and artifact handoffs while preserving the legacy filesystem board. Use when coordinating sequential agents or configuring optional memory fallback.
---

# Blackboard protocol

Use `src/handoff.js` from the AgentHaus Marketplace checkout as the executable version 1 contract, documented by `schemas/handoff.schema.json`. The lightweight plugin schema validator is not the handoff validator. This guidance does not install an executor or intercept other tools.

A standalone cached plugin contains this plugin directory, not the repository-root `src/handoff.js` helper. Typed examples require a separately available AgentHaus Marketplace repository runtime and must run from that checkout. Do not install dependencies or assume a bundled helper. Without that runtime, preserve/read legacy task files and report typed validation unavailable; do not label an unchecked envelope validated. A future CLI integration is not provided by this skill.

Every envelope requires `schema_version: 1`, `kind`, UUID `task_id` and `correlation_id`, `producer`, `consumer`, strict UTC-millisecond `created_at`, `status`, `input`, `output` and `evidence`. Configurable identities are `runtime:project:actor` (each component up to 64 letters/digits/periods/underscores/hyphens). No fixed provider persona.

| Kind/status | Input/output | Required actor/history |
| --- | --- | --- |
| task/pending | input object; output null | Actor equals producer |
| task/in_progress | unchanged input/evidence; output null | Pending task exists; actor equals consumer |
| result/completed | input null; nonempty output object; evidence required | Worker produces result for original dispatcher |
| result/failed | input null; nonempty output.error; evidence optional | Same reversal of producer/consumer |

Only pending → in_progress → completed/failed is accepted. Task/correlation IDs remain fixed; timestamps cannot go backward. Duplicate results and reopened terminal identities reject. `createHandoffSession` enforces this during its in-memory lifetime; replay accepted history to validate resumed traces. Caller mutations cannot change stored state. A typed retry receives new task/correlation IDs.

Actor checks compare declared identities supplied by the caller; they do not authenticate an OS user or grant authority to execute work. UUID identity text is normalized to lowercase for replay checks.

```javascript
const { validateEnvelope, createHandoffSession, evidenceFor } = require('./src/handoff.js');
const projectRoot = '/absolute/project';
validateEnvelope(dispatch, { projectRoot });
const session = createHandoffSession({ projectRoot });
session.accept(dispatch, { actor: dispatch.producer });
session.accept(claim, { actor: dispatch.consumer });
result.evidence = [evidenceFor(projectRoot, 'reports/approved-local-result.json')];
session.accept(result, { actor: dispatch.consumer });
```

`evidenceFor` returns `{artifact_path,sha256}` for an existing regular file. Use project-relative slash paths. Absolute paths, traversal, directories and external symlink escapes reject; validation recomputes digests. Envelope limits are 1 MiB, depth 64 and 128 evidence entries. Validation observes the current local filesystem; it is not immutable-file attestation or isolation against another OS process.

Keep `.context/inbox/`, `.context/active/` and `.context/completed/` legacy task files readable. Add typed sidecars under `.context/typed/<task_id>/` without migrating legacy files. Legacy readers keep requirements/assigned_to/retry fields. Phase 13 owns durable storage, leases, migration and concurrency. Rename plus in-memory validation cannot prove exactly-one execution ownership; use a single sequential owner.

The optional repository runtime `src/blackboard.js` supplies transactional local SQLite claims. It requires a trusted absolute SQLite CLI (minimum 3.42.0 plus actual capability probes), uses a default 60-second renewable lease, and rejects stale-owner heartbeat/completion using increasing decimal fencing tokens. It does not bundle SQLite, install software, authenticate an OS actor or fence vendor effects. A reclaimed task's result producer is the current lease owner, even if different from the original dispatch's suggested consumer; the result consumer remains the original dispatcher.

Migration is a separate explicit operation: `planLegacyMigration({projectRoot,dbPath,actorMapping})` is write-free; apply rechecks that exact plan, requires `legacyOwnerStopped: true`, resolves each active task with explicit `legacyId: "requeue"`, backs up original files plus a checked database snapshot, then commits imports atomically. Repeating the same plan is idempotent. Legacy terminal files remain archived/unverified, not fabricated typed completions. Original files are never deleted by migration. Once migrated, only the blackboard may dispatch/claim execution; keep legacy readers read-only and MemPalace optional evidence storage. Missing backend never activates a weaker filesystem-lock owner. These APIs require the repository runtime; standalone cached plugin guidance does not bundle them.

Memory is optional:

- Default to local task/artifact state with `source: local-artifact-state`.
- Recall needs separately enabled read-only capability and explicit scope; label source/freshness. Historical recall does not replace current digest/runtime evidence.
- When disabled/unavailable, preserve local progress and report fallback; unknown remote facts remain unknown.
- Capture is a separate explicit opt-in with an identified destination and writer. Dispatch/claim/status/validation never silently write to MemPalace, palace stores, Google, WordPress or other vendors.

Use input/output provenance to distinguish local requests, fixtures and live observations. A completed offline fixture proves that reference flow only. No typed executor, native hook coverage, worktree isolation or provider acceptance is implied.
