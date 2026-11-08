---
description: Search, read, send, and manage Gmail messages using the gog CLI. Usage: `/gog-workspace:gmail search is:unread newer_than:7d` or `/gog-workspace:gmail send to@example.com "Subject" "Body"`
argument-hint: "<search <gmail-query> | send <to> <subject> <body>>"
---

Given "$ARGUMENTS" as user input, execute Gmail operations using the `gog` CLI.

## Supported Operations

### Search & Read
- **Search threads**: `gog gmail search '<query>' --max <n>`
- **Search messages**: `gog gmail messages search '<query>' --max <n>`
- **Read thread**: `gog gmail thread get <thread_id>`
- **Read message**: `gog gmail get <message_id>`

### Send & Reply
- **Send email**: `gog gmail send --to <to> --subject '<subject>' --body '<body>'`
- **Reply** (quotes the original by default): `gog gmail reply <message_id> --body '<reply>'`
- **Reply without quote**: `gog gmail reply <message_id> --body '<reply>' --no-quote`
- **Reply all**: `gog gmail reply-all <message_id> --body '<reply>'`
- **Forward**: `gog gmail forward <message_id> --to <to> --note '<intro>'`

### Drafts
- **Create draft**: `gog gmail drafts create --to <to> --subject '<subject>' --body '<body>'`
- **List drafts**: `gog gmail drafts list`
- **Send draft**: `gog gmail drafts send <draft_id>`

### Labels & Organization
- **List labels**: `gog gmail labels list`
- **Apply label**: `gog gmail labels modify <thread_id> --add '<label>'`
- **Remove label**: `gog gmail labels modify <thread_id> --remove '<label>'`
- **Archive**: `gog gmail archive <message_id>` (add `--thread` to pass thread IDs)
- **Trash**: `gog gmail trash <message_id>`

### Filters
- **List filters**: `gog gmail settings filters list`
- **Export filters**: `gog gmail settings filters export --out filters.xml`

## Instructions

1. Parse the user's intent from `$ARGUMENTS`
2. Construct the appropriate `gog gmail` command
3. Always use `--json` for machine-readable output when processing results
4. Present results in a clear, formatted summary
5. For search queries, default to `--max 10` unless specified
6. Prefer a draft (`gog gmail drafts create`) and show it before sending; send only after the user confirms
