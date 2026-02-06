# Fleet Commander

Visualization and control of running agent sessions. Monitor active agents, view task queues, take over stuck sessions, and dispatch new work to the fleet.

## Prerequisites

No external dependencies required. This plugin builds on the blackboard protocol from the `agent-handoff` plugin. Install `agent-handoff` for the full multi-agent workflow.

## Installation

```bash
/plugin install fleet-commander
```

## Usage

### View Fleet Status

```
/fleet-status
```

Displays a dashboard showing active agents, pending tasks, and recent completions with timing information.

### Take Over a Session

```
/takeover abc123-task-id
```

Attaches to an active task, reads its current state, and continues execution from where the previous agent left off. Useful for rescuing stuck tasks.

Without arguments, lists all active tasks for selection:
```
/takeover
```

### Dispatch a Task

```
/dispatch Write integration tests for the payment module
/dispatch --priority high Fix the production auth bug
/dispatch --assign claude-agent-1 --timeout 15 Quick config update
```

Creates a task with fleet-level features like priority, pre-assignment, and timeout.

### Fleet Monitor Agent

The `fleet-monitor` agent (runs on haiku for cost efficiency) performs health checks:

- Detects stuck tasks (active > 30 minutes)
- Reports recent failures
- Warns on queue buildup (> 5 pending)
- Flags retry storms (retries >= 2)

## Architecture

Fleet Commander operates on the blackboard protocol's filesystem-based task system:

```
.context/
  inbox/      # Pending tasks (fleet-commander reads for queue depth)
  active/     # In-progress tasks (fleet-commander monitors for stuck agents)
  completed/  # Finished tasks (fleet-commander reads for completion stats)
```

### Commands

| Command | Purpose |
|---------|---------|
| `/fleet-status` | Dashboard view of all agents and tasks |
| `/takeover` | Attach to and resume an active task |
| `/dispatch` | Create a new task with fleet features |

### Agents

| Agent | Model | Purpose |
|-------|-------|---------|
| `fleet-monitor` | haiku | Background health monitoring |

### Integration with Agent Handoff

Fleet Commander is designed as a companion to `agent-handoff`. It adds monitoring, visualization, and session control on top of the blackboard protocol:

- `agent-handoff` provides: dispatch, claim, status
- `fleet-commander` adds: fleet-status dashboard, takeover, priority dispatch, health monitoring
