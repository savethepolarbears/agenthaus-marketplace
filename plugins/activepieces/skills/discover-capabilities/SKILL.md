---
name: discover-capabilities
description: Build a trustworthy capability map before making any change to an ActivePieces flow. Use when exploring available pieces, connectors, or triggers in ActivePieces.
---

# Skill: Discover capabilities

## Goal

Build a trustworthy capability map before making any change.

## Required operating sequence

1. List flows when the user is targeting an existing automation or wants to browse inventory.
2. Inspect `ap_flow_structure` before any mutation to an existing flow.
3. Use `ap_list_pieces` before selecting a trigger or action.
4. Use `ap_list_connections` before binding auth to any piece step.
5. Record:
   - target flow ID
   - trigger type
   - configured / unconfigured / invalid steps
   - valid insert locations
   - available connections for every required piece
   - whether a direct execution endpoint exists

## Rules

- Never assume the correct piece, version, action, or trigger.
- Never assume auth exists for a piece without checking connections.
- Prefer project-safe edits over broad rewrites.
- Always surface when a requested tool is not present in the connector.

## Deliverable

Return a compact capability brief with:

- selected flow or “new flow”
- available auth bindings by piece
- missing prerequisites
- recommended build strategy
- honest execution strategy
