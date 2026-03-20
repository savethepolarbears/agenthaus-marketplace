---
name: build-or-refactor-flow
description: Turn a blueprint into actual ActivePieces connector operations with minimal risk.
---

# Skill: Build or refactor flow

## Goal

Turn a blueprint into actual connector operations with minimal risk.

## Safe mutation protocol

1. Inspect flow structure.
2. Add skeleton steps first.
3. Configure trigger and steps only after validating the piece/action/trigger catalog.
4. Bind auth using discovered `externalId` values only.
5. Re-inspect after structural edits when branches or loops are involved.
6. Keep display names human-readable.
7. Add notes for handoff when useful.

## Destructive change policy

- Do not delete steps or branches unless:
  - the user explicitly asked, or
  - the change is part of a clearly approved refactor plan.
- Never disable a live published flow as part of a routine refactor unless asked.

## Output

Summarize:
- what changed
- what remains unconfigured
- what still blocks publishing
