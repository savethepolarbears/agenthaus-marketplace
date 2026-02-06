---
name: status
description: Display the task board showing all pending, active, and completed tasks
---

You are displaying the agent task board from the blackboard protocol.

Follow these steps:

1. **Read all task directories**:
   - `.context/inbox/` -- pending tasks
   - `.context/active/` -- in-progress tasks
   - `.context/completed/` -- finished tasks (completed or failed)

   If a directory does not exist, treat it as empty.

2. **Parse each JSON file** in each directory and extract: `task_id`, `requirements` (truncated to 80 chars), `status`, `assigned_to`, `created_at`, `completed_at`.

3. **Display the task board** in this format:

```
=== TASK BOARD ===

PENDING ({count})
| Task ID (short) | Requirements          | Created     |
|------------------|-----------------------|-------------|
| abc123...        | Fix the login ...     | 2 min ago   |

IN PROGRESS ({count})
| Task ID (short) | Requirements          | Assigned To    | Started     |
|------------------|-----------------------|----------------|-------------|
| def456...        | Build the API ...    | claude-agent-1 | 1 min ago   |

COMPLETED ({count})
| Task ID (short) | Requirements          | Result         | Duration    |
|------------------|-----------------------|----------------|-------------|
| ghi789...        | Update the docs ...  | Done: updated  | 3 min       |

FAILED ({count})
| Task ID (short) | Requirements          | Error          | Retries     |
|------------------|-----------------------|----------------|-------------|
```

4. **Summary line**: Total tasks, breakdown by status, average completion time if available.

If $ARGUMENTS contains "json", output the raw JSON instead of the formatted table.
