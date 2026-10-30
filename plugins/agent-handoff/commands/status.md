---
name: status
description: Read the legacy task board and separately report validated typed handoff evidence
---

Read `.context/inbox/`, `.context/active/` and `.context/completed/` without modification. Missing directories are empty; malformed files are invalid, not completed. Show task ID, requirements summary, legacy status, assigned runtime actor, timestamps and result/error. `$ARGUMENTS` containing `json` requests the same scoped observation as JSON. Do not print secrets from inputs/outputs.

Legacy files remain the compatibility board until Phase 13. Label their format `legacy`; JSON parsing alone is not schema-v1 validation.

If the project explicitly enabled the SQLite blackboard, report its existing database as the authoritative execution state and legacy files as read-only historical compatibility. Capability probing must not create a database; absence/unavailable backend is unknown/unavailable, not an empty successful board. Read/list operations must not initialize missing state. Show current owner, fencing token, lease expiry and terminal result separately from process liveness; none proves an external effect succeeded.

For `.context/typed/<task_id>/` sidecars, use the marketplace checkout's `src/handoff.js`. `validateEnvelope(envelope,{projectRoot})` checks strict fields and current file digests. To prove a valid lifecycle, replay dispatch, claim and result through one `createHandoffSession({projectRoot})`, with the recorded actor for each operation. A standalone result cannot prove a correlated claim. Missing history/artifacts, changed digests, wrong actors/correlation and repeated results remain explicit failures or unknowns.

Standalone cached plugins do not contain the repository-root helper. Typed checks require a separately available marketplace repository runtime; without it, label typed validation unavailable while continuing read-only legacy status. Do not imply that this plugin bundles an executor or install a runtime implicitly.

Display typed and legacy state separately, with validation time and disagreements. Calculate counts/durations only from observed data. Status, valid digest, local fixture, live execution and production readback are separate evidence tiers. This command does not repair, retry, execute work or capture memory.

Optional MemPalace recall must be separately enabled and read-only. Disabled/unavailable recall falls back to native task/artifact state with `source: local-artifact-state`; do not infer absent remote facts or silently capture them.
