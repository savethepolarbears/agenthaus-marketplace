---
description: Search, read, send, and manage Gmail messages using the gog CLI. Usage: `/gog-workspace:gmail search is:unread newer_than:7d` or `/gog-workspace:gmail send to@example.com "Subject" "Body"`
---

Given "$ARGUMENTS" as user input, execute Gmail operations using the `gog` CLI.

## Supported Operations

### Search & Read
- **Search threads**: `gog gmail search '<query>' --max <n>`
- **Search messages**: `gog gmail messages '<query>' --max <n>`
- **Read thread**: `gog gmail read <thread_id>`
- **Read message**: `gog gmail read <message_id> --message`

### Send & Reply
- **Send email**: `gog gmail send <to> --subject '<subject>' --body '<body>'`
- **Reply**: `gog gmail reply <thread_id> --body '<reply>'`
- **Reply with quote**: `gog gmail reply <thread_id> --body '<reply>' --quote`
- **Forward**: `gog gmail forward <message_id> <to>`

### Drafts
- **Create draft**: `gog gmail draft <to> --subject '<subject>' --body '<body>'`
- **List drafts**: `gog gmail drafts`
- **Send draft**: `gog gmail draft send <draft_id>`

### Labels & Organization
- **List labels**: `gog gmail labels`
- **Apply label**: `gog gmail label <thread_id> <label>`
- **Remove label**: `gog gmail unlabel <thread_id> <label>`
- **Archive**: `gog gmail archive <thread_id>`
- **Trash**: `gog gmail trash <thread_id>`

### Filters
- **List filters**: `gog gmail filters`
- **Export filters**: `gog gmail filters --export`

## Instructions

1. Parse the user's intent from `$ARGUMENTS`
2. Construct the appropriate `gog gmail` command
3. Always use `--json` for machine-readable output when processing results
4. Present results in a clear, formatted summary
5. For search queries, default to `--max 10` unless specified
