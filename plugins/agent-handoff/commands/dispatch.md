---
name: dispatch
description: Dispatch a validated typed handoff sidecar while preserving the legacy task board
---

Resolve requirements from `$ARGUMENTS` and the exact project root. Ask for missing requirements before dispatch. Generate task/correlation UUIDs with `require('node:crypto').randomUUID()`. Configure producer and consumer as `runtime:project:actor`; each component permits letters, digits, periods, underscores and hyphens, up to 64 characters. Never hard-code a provider persona.

Create a version 1 typed sidecar with actual IDs, UTC timestamp and scoped requirements:

```json
{
  "schema_version": 1,
  "kind": "task",
  "task_id": "89186523-5e78-4b99-b924-d9cd53dcf800",
  "correlation_id": "802506a1-9205-4a68-a998-bf1695b34cd4",
  "producer": "node:example:coordinator",
  "consumer": "node:example:worker",
  "created_at": "2026-10-24T10:00:00.000Z",
  "status": "pending",
  "input": { "requirements": "User-authorized work", "provenance": "local-user-request" },
  "output": null,
  "evidence": []
}
```

Run the production API from the AgentHaus Marketplace checkout; the lightweight plugin-manifest validator does not enforce this contract:

Standalone plugin caches do not include repository-root `src/handoff.js`. These examples require an existing separate marketplace checkout; without it, report typed validation unavailable and preserve legacy compatibility. Do not assume a bundled runtime or install one implicitly.

```bash
node -e 'const fs=require("node:fs");require("./src/handoff.js").validateEnvelope(JSON.parse(fs.readFileSync(process.argv[1],"utf8")),{projectRoot:process.argv[2]});' /absolute/project/.context/typed/TASK/dispatch.json /absolute/project
```

Store additive dispatch/claim/result sidecars under `.context/typed/<task_id>/`; do not overwrite existing identities. Replay them through one `createHandoffSession({projectRoot}).accept(envelope,{actor})` in order to check history and duplicate results. Standalone validation checks shape/evidence, not history.

Preserve the legacy `.context/inbox/<task_id>.json` task with `requirements`, `status`, `assigned_to`, `created_at`, `completed_at`, `result`, `priority`, `retries` and `max_retries`. Typed sidecars do not replace or migrate current readers; Phase 13 owns durable queue migration. Report both paths and local validation evidence. Validation neither executes requirements nor establishes an atomic claim.

For an explicitly migrated project, the local SQLite blackboard is the sole execution owner: enqueue through the separately installed repository runtime's `openBlackboard(options).enqueue(dispatch)`. Do not also enqueue a legacy inbox task. Preserve legacy files for read-only compatibility. SQLite CLI is an opt-in feature prerequisite (trusted absolute executable, version/capability gate), not a global requirement for unrelated plugin use; unavailable support is an explicit failure, with no unsafe lock fallback or implicit installation.

Recall is optional and read-only when separately enabled. Disabled/unavailable memory falls back to scoped local task/artifact state with its source labeled. Capture is a separate explicit opt-in; never silently write to MemPalace or external services.
