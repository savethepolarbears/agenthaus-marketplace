---
name: design-flow-blueprint
description: Convert a natural-language brief into a connector-ready ActivePieces build plan. Use when designing or planning a new ActivePieces automation flow.
---

# Skill: Design flow blueprint

## Goal

Convert a natural-language brief into a connector-ready build plan.

## Blueprint schema

Create these sections:

1. **Outcome**
   - what the flow accomplishes
   - trigger event
   - side effects

2. **Inputs**
   - trigger payload fields
   - required secrets or connections
   - dynamic references

3. **Step plan**
   - step display name
   - piece
   - trigger or action
   - auth source
   - required input fields
   - output contract

4. **Control flow**
   - branches
   - loops
   - retry or fallback expectations

5. **Release plan**
   - draft only / publish / enable
   - run strategy

## Rules

- Prefer the smallest viable flow first.
- Reuse already-connected pieces where possible.
- If the user asks to “run” a flow, choose a real trigger path instead of inventing manual execution.
- Flag every missing connection up front.
