---
description: Send and manage Google Chat messages in Workspace spaces. Usage: `/gog-workspace:chat send "space-name" "Hello team!"` or `/gog-workspace:chat list`
---

Given "$ARGUMENTS" as user input, execute Google Chat operations using the `gog` CLI.

## Supported Operations

### Spaces
- **List spaces**: `gog chat spaces`
- **Space info**: `gog chat space <space_id>`
- **List members**: `gog chat members <space_id>`

### Messages
- **Send message**: `gog chat send <space_id> '<message>'`
- **List messages**: `gog chat messages <space_id>`
- **Read thread**: `gog chat thread <space_id> <thread_id>`
- **Reply to thread**: `gog chat reply <space_id> <thread_id> '<message>'`

## Instructions

1. Parse the user's intent from `$ARGUMENTS`
2. Google Chat requires a Workspace account
3. Use `--json` for structured output
4. Display messages with sender, timestamp, and space context
