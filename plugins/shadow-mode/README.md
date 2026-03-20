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

No external dependencies or environment variables required.

## Installation

```bash
/plugin install shadow-mode
```

## Usage

### Enable Shadow Mode

```
/enable
```

Once active, all Write, Edit, and Bash tool calls are intercepted and saved to `review_queue/` as JSON files instead of executing.

### Disable Shadow Mode

```
/disable
```

Returns to normal execution. Warns if there are unreviewed actions in the queue.

### Review Queued Actions

```
/review
```

Displays all pending actions with details and allows you to:
- **Approve** individual actions (executes them)
- **Reject** individual actions (moves to `review_queue/rejected/`)
- **Skip** for later review
- **Approve all** or **Reject all** for batch processing

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
3. If the marker exists, the hook writes action details to `review_queue/{timestamp}-{tool}.json` and blocks execution (exit 1)
4. `/review` reads the queue and allows approve/reject decisions
5. `/disable` removes the marker file

### Queue Format

Each queued action is stored as JSON:

```json
{
  "tool": "Write",
  "timestamp": "2025-01-15T10:30:00Z",
  "status": "pending",
  "input_file": "src/main.ts",
  "input_command": ""
}
```

### Limitations

- Read operations (Read, Glob, Grep) are not intercepted -- shadow mode only affects mutations
- The queue stores metadata about actions; full content reconstruction depends on the agent re-executing approved actions
- Shadow mode is project-scoped (the marker file is in the project root)
