---
name: dispatch
description: Launch a new headless agent task via the blackboard protocol
---

You are dispatching a new task to the agent fleet.

This command extends the agent-handoff /dispatch by adding fleet-level features.

Follow these steps:

1. **Parse arguments**: Take $ARGUMENTS which should contain the task description. Optional flags:
   - `--priority high|normal|low` -- Set task priority (default: normal)
   - `--assign <agent-id>` -- Pre-assign to a specific agent
   - `--timeout <minutes>` -- Set a maximum execution time

2. **Create the task** using the blackboard protocol format:
```json
{
  "task_id": "<generated-uuid>",
  "requirements": "<task description>",
  "status": "pending",
  "assigned_to": "<agent-id or null>",
  "created_at": "<ISO timestamp>",
  "completed_at": null,
  "result": null,
  "priority": "<priority>",
  "retries": 0,
  "max_retries": 3,
  "timeout_minutes": "<timeout or null>",
  "dispatched_by": "fleet-commander"
}
```

3. **Write to inbox**: Save to `.context/inbox/{task_id}.json`. Create directories if needed.

4. **If pre-assigned**: Move directly to `.context/active/` with status `"in_progress"`.

5. **Confirm dispatch**:
```
Task dispatched to fleet.
  ID: {task_id}
  Priority: {priority}
  Assigned: {agent-id or "awaiting pickup"}
  Timeout: {timeout or "none"}
```
