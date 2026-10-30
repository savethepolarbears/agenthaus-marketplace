---
name: claim
description: Claim an authorized legacy task and validate its typed claim and result transitions
---

Read pending legacy tasks from `.context/inbox/`. Select the task specified by `$ARGUMENTS`, otherwise show tasks and select the oldest `created_at`. Report an empty board without inventing work. Resolve project root, runtime identity and authorized execution scope before acting.

First determine the enabled execution owner. After explicit SQLite blackboard migration, use only its `claim({taskId,owner})`, `heartbeat({taskId,owner,fence})` and `complete`/`fail` APIs from the separately available repository runtime. Default leases last 60 seconds; every mutation needs the current decimal-string fence and unexpired lease. The blackboard assigns the actual lease owner; after reclaim, result producer must equal that current owner and result consumer the original dispatcher. Expired owners stop work and cannot heartbeat/complete. Do not manually claim/move legacy files for a migrated project or fall back to a second owner when SQLite is unavailable. External effects need their own idempotency/fencing boundary; a task lease does not establish physical exactly-once execution.

Preserve the existing inbox/active/completed protocol until Phase 13. For a sequential claim, set legacy `assigned_to` to the configured `runtime:project:actor`, set `status: in_progress`, then move the task into `.context/active/`. A rename is not a full ownership/lease protocol; do not claim concurrent execution safety or enable another execution owner.

For typed tasks, invoke from the marketplace checkout:

Standalone plugin caches do not bundle repository-root `src/handoff.js`; use a separately available marketplace checkout. If unavailable, report typed validation unavailable and preserve the legacy protocol. This command does not install a runtime or provide a CLI executor.

```javascript
const { createHandoffSession, evidenceFor } = require('./src/handoff.js');
const session = createHandoffSession({ projectRoot: '/absolute/project' });
session.accept(dispatchEnvelope, { actor: dispatchEnvelope.producer });
const claim = { ...dispatchEnvelope, status: 'in_progress', created_at: new Date().toISOString() };
session.accept(claim, { actor: dispatchEnvelope.consumer });
```

Keep task/correlation IDs, producer/consumer, input and initial evidence unchanged. Persist the validated claim as `.context/typed/<task_id>/claim.json`. Reconstruct prior accepted history when resuming; a fresh session cannot accept a result without dispatch/claim. Never execute requirements merely because they validate.

After authorized work, produce a `kind: result` envelope with the same task/correlation IDs, `producer` equal to the claimed worker, `consumer` equal to the original dispatcher, current UTC-millisecond `created_at`, `input: null`, and an output object. Completed results require at least one existing project-contained artifact:

```javascript
result.evidence = [evidenceFor('/absolute/project', 'reports/result.json')];
session.accept(result, { actor: claim.consumer });
```

Failed results require nonempty `output.error` and may have no evidence. Keep accurate output provenance: fixture results prove fixture behavior only. Reject wrong actors/correlation, direct pending-to-result, traversal, external symlinks, changed digests and repeated terminal results. Record the result sidecar, then update/move the compatible legacy task into `.context/completed/`.

Legacy retry counters remain readable, but typed retries need a new task/correlation trace; terminal typed tasks cannot reopen. This in-memory validator is not durable replay protection, scheduling, locking, an executor or worktree isolation. Optional recall remains read-only; capture needs separate explicit opt-in. Validation never writes to palace/vendor stores.
