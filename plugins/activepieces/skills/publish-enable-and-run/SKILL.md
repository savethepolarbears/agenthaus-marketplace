---
name: publish-enable-and-run
description: Release an ActivePieces flow safely and choose an execution strategy that matches reality. Use when publishing, enabling, or testing an ActivePieces flow.
---

# Skill: Publish, enable, and run

## Goal

Release a flow safely and choose an execution strategy that matches reality.

## Release sequence

1. Preflight:
   - no invalid steps
   - required auth present
   - trigger configured
2. Publish draft.
3. Enable only when requested or clearly implied.

## Run strategy matrix

- **Chat UI** → interact through the chat trigger path
- **Form / webhook** → submit to the published endpoint or form
- **Schedule / event trigger** → enable and wait for the event or next schedule
- **No trigger path available** → perform a blueprint dry run only

## Non-negotiable rule

Never claim that the flow has been manually executed when the connector does not expose a direct execute endpoint.
