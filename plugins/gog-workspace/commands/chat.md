---
description: Send and manage Google Chat messages in Workspace spaces. Usage: `/gog-workspace:chat send "space-name" "Hello team!"` or `/gog-workspace:chat list`
argument-hint: "<list | send <space> <message>>"
---

Given "$ARGUMENTS" as user input, execute Google Chat operations using the `gog` CLI.

## Supported Operations

### Spaces
- **List spaces**: `gog chat spaces list`
- **Find a space by name**: `gog chat spaces find '<display_name>'`

### Messages
- **Send message**: `gog chat messages send spaces/<space_id> --text '<message>'`
- **Direct message**: `gog chat dm send <email> --text '<message>'`
- **List messages**: `gog chat messages list spaces/<space_id>`
- **List threads**: `gog chat threads list spaces/<space_id>`
- **Read thread**: `gog chat messages list spaces/<space_id> --thread spaces/<space_id>/threads/<thread_id>`
- **Reply to thread**: `gog chat messages send spaces/<space_id> --thread spaces/<space_id>/threads/<thread_id> --text '<message>'`

## Instructions

1. Parse the user's intent from `$ARGUMENTS`
2. Google Chat requires a Workspace account
3. Use `--json` for structured output
4. Display messages with sender, timestamp, and space context
