# Agent Handoff

State-based task handoff between agents using a shared blackboard protocol. Enables multi-agent workflows where one agent dispatches work and others claim and execute it.

## Platform Support

| Feature | Claude Code | Codex CLI | Gemini CLI | Cursor | Windsurf | Claude Desktop |
|---------|-------------|-----------|------------|--------|----------|----------------|
| Commands | full | partial | partial | partial | partial | n/a |
| Skills | full | full | full | full | full | n/a |
| MCP | n/a | n/a | n/a | n/a | n/a | n/a |
| Hooks | full | none | none | none | none | n/a |

## Prerequisites

No external dependencies or environment variables required. This plugin uses the local filesystem for coordination.

## Installation

```bash
/plugin install agent-handoff
```

## Usage

### Dispatch a Task

```
/dispatch Write unit tests for the authentication module
```

Creates a task spec in `.context/inbox/` with a unique ID, the requirements, and pending status.

### Claim and Execute a Task

```
/claim
```

Lists pending tasks, claims the oldest one, executes the requirements, and moves the task through `active` to `completed`.

To claim a specific task:

```
/claim abc123-task-id
```

### View Task Board

```
/status
```

Displays all tasks across pending, in-progress, completed, and failed states in a formatted table.

For raw JSON output:

```
/status json
```

## Architecture

The blackboard protocol uses three filesystem directories as a state machine:

```
.context/
  inbox/        # pending tasks (dispatched, awaiting pickup)
  active/       # in_progress tasks (claimed by an agent)
  completed/    # completed or failed tasks
  audit.log     # append-only transition log
```

Each task is a JSON file that moves between directories as its status changes:

```
pending -> in_progress -> completed
                       -> failed (after max retries)
```

The move operation serves as a simple mutex -- if a file is gone from `inbox/`, another agent already claimed it.

### Task Spec Fields

| Field | Type | Description |
|-------|------|-------------|
| task_id | string | UUID v4 identifier |
| requirements | string | What needs to be done |
| status | enum | pending, in_progress, completed, failed |
| assigned_to | string/null | Agent identifier |
| created_at | ISO timestamp | When dispatched |
| completed_at | ISO timestamp/null | When finished |
| result | string/null | Outcome or error |
| priority | enum | low, normal, high |
| retries | number | Current retry count |
| max_retries | number | Maximum attempts (default 3) |

### Hooks

A PostToolUse hook logs all task file writes to `.context/audit.log` for traceability.
