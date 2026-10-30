# Shadow Mode

Agents draft outputs to a review queue instead of executing directly. Useful for training new agents, auditing agent behavior, or adding a human approval step to sensitive workflows.

## Platform Support

| Feature | Claude Code | Codex CLI | Gemini CLI | Cursor | Windsurf | Claude Desktop |
|---------|-------------|-----------|------------|--------|----------|----------------|
| Commands | full | partial | partial | partial | partial | n/a |
| Skills | full | full | full | full | full | n/a |
| MCP | n/a | n/a | n/a | n/a | n/a | n/a |
| Hooks | full | none | none | none | none | n/a |

## Prerequisites

Python 3 is required for digest generation and atomic queue publication. No credentials are required. Hook input is limited to 4 MiB; larger requests are blocked without a queue record or raw input logs.

## Installation

```bash
/plugin install shadow-mode
```

## Usage

### Enable Shadow Mode

```
/enable
```

Once active, all Write, Edit, and Bash tool calls are intercepted and recorded as digest-only JSON proposals in `review_queue/` instead of executing.

### Disable Shadow Mode

```
/disable
```

Returns to normal execution. Warns if there are unreviewed actions in the queue.

### Review Queued Actions

```
/review
```

Displays safe proposal metadata. Each proposal requires fresh operator review of
the original request and separate approval of the exact operation. Digests cannot
reconstruct requests. Reject or skip unavailable requests; never replay legacy raw
parameters or batch-approve unseen operations. See [review](commands/review.md).

## Architecture

Shadow mode uses a PreToolUse hook system that intercepts destructive operations before they execute.

### Components

```
hooks/
  hooks.json                      # Hook definitions for Write, Edit, Bash
  scripts/
    shadow-intercept.sh          # Intercept logic and queue writer
commands/
  enable.md                      # Activate shadow mode
  disable.md                     # Deactivate shadow mode
  review.md                      # Review and process queue
```

### How It Works

1. `/enable` creates a `.shadow-mode-enabled` marker file
2. PreToolUse hooks check for this marker before each Write, Edit, or Bash call
3. If the marker exists, the hook atomically publishes a digest-only proposal to `review_queue/{random-id}.json` and blocks execution (exit 2)
4. `/review` reads the queue and allows approve/reject decisions
5. `/disable` removes the marker file

### Queue Format

Each queued action is stored as JSON:

```json
{
  "schema_version": 2,
  "id": "random-proposal-id",
  "tool": "Write",
  "timestamp": "2026-10-24T12:00:00+00:00",
  "status": "pending",
  "request_sha256": "64 hexadecimal characters",
  "requires_fresh_review": true
}
```

### Limitations

- Read operations (Read, Glob, Grep) are not intercepted -- shadow mode only affects mutations
- The queue stores only digests and safe metadata. Fresh operator review of the original request is mandatory; metadata is not execution approval.
- Hooks cover configured Claude Code events only and supply guidance, with no universal execution boundary or protection against same-user bypass.
- Missing Python or storage failure blocks the action without claiming a queue record.
- Shadow mode is project-scoped (the marker file is in the project root)
