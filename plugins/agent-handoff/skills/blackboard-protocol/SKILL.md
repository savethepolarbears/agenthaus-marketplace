# Blackboard Protocol

A shared-state coordination protocol for multi-agent task handoff using the filesystem as a message bus.

## Task Spec Schema

Every task is a JSON file with this structure:

```json
{
  "task_id": "string (UUID v4)",
  "requirements": "string (what needs to be done)",
  "status": "pending | in_progress | completed | failed",
  "assigned_to": "string | null (agent identifier)",
  "created_at": "string (ISO 8601 timestamp)",
  "completed_at": "string | null (ISO 8601 timestamp)",
  "result": "string | null (outcome summary or error message)",
  "priority": "low | normal | high",
  "retries": "number (current retry count)",
  "max_retries": "number (default 3)"
}
```

## Protocol Lifecycle

### Step 1: Dispatch

A coordinating agent creates a task spec and writes it to `.context/inbox/{task_id}.json`. The task starts with `status: "pending"` and `assigned_to: null`.

- Validate that requirements are clear and actionable
- Set appropriate priority based on urgency
- Generate a unique task_id to avoid collisions

### Step 2: Claim

A worker agent scans `.context/inbox/` for pending tasks, selects one, and claims it:

1. Read the task JSON
2. Set `status` to `"in_progress"`
3. Set `assigned_to` to the agent's identifier
4. Move the file to `.context/active/{task_id}.json`

Important: Only one agent should claim a task. The move operation serves as a simple lock -- if the file is gone from inbox, another agent already claimed it.

### Step 3: Execute

The claiming agent reads the `requirements` field and performs the work. During execution:

- The task file remains in `.context/active/`
- The agent may update the file with progress notes
- Other agents can read (but should not modify) active task files

### Step 4: Report Results

On completion, the agent updates the task:

1. Set `status` to `"completed"`
2. Set `completed_at` to the current timestamp
3. Set `result` to a summary of what was accomplished
4. Move the file to `.context/completed/{task_id}.json`

### Step 5: Handle Failures

If execution fails:

1. Increment `retries`
2. If `retries < max_retries`: set `status` back to `"pending"`, move to `.context/inbox/` for another attempt
3. If `retries >= max_retries`: set `status` to `"failed"`, write the error to `result`, move to `.context/completed/`

## Directory Structure

```
.context/
  inbox/        # Pending tasks awaiting pickup
  active/       # Tasks currently being executed
  completed/    # Finished tasks (success or failure)
  audit.log     # Append-only log of all task transitions
```

## Concurrency Notes

This protocol uses filesystem operations for coordination. It works well for sequential agent handoffs and low-concurrency scenarios. For high-concurrency multi-agent systems, consider adding:

- File locking with `flock` or advisory locks
- A claim timeout to detect stuck agents
- A heartbeat file that active agents update periodically
