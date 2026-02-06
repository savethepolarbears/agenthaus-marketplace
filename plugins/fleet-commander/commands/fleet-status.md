---
name: fleet-status
description: Show all active agent sessions and their current tasks
---

You are displaying the fleet status of all running agent sessions.

Follow these steps:

1. **Read the blackboard**: Check the following directories for task files:
   - `.context/inbox/` -- pending tasks awaiting assignment
   - `.context/active/` -- tasks currently being executed by agents
   - `.context/completed/` -- recently completed tasks (last 10)

   If directories do not exist, report "No blackboard protocol initialized. Run /dispatch to create your first task."

2. **Check running processes**: Use `ps aux | grep -i claude` to detect any running Claude agent processes. Parse the output for PIDs and uptime.

3. **Display the fleet dashboard**:
```
=== FLEET COMMANDER ===

ACTIVE AGENTS ({count})
| Agent ID       | Task                | Status      | Duration | PID   |
|---------------|---------------------|-------------|----------|-------|
| claude-agent-1 | Fix auth module    | in_progress | 5m 23s   | 12345 |
| claude-agent-2 | Write API tests    | in_progress | 2m 10s   | 12346 |

TASK QUEUE ({count} pending)
| Task ID  | Requirements          | Priority | Waiting  |
|----------|-----------------------|----------|----------|
| abc123   | Refactor database ... | normal   | 10m ago  |

RECENT COMPLETIONS ({count})
| Task ID  | Agent          | Result     | Duration |
|----------|---------------|------------|----------|
| def456   | claude-agent-1 | Success   | 8m 15s   |

Fleet Health: {active}/{total} agents active | {pending} queued | {completed} done today
```

4. If $ARGUMENTS contains `--watch`, suggest the user re-run the command periodically to monitor changes.
