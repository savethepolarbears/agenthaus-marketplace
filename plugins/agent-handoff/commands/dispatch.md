---
name: dispatch
description: Dispatch a new task to the blackboard for agent pickup
---

You are dispatching a new task to the agent blackboard protocol.

Follow these steps exactly:

1. Generate a unique task ID using a UUID v4 format. Use the current timestamp milliseconds combined with a random suffix to create a unique identifier.

2. Create the task spec as a JSON object:
```json
{
  "task_id": "<generated-uuid>",
  "requirements": "<user's $ARGUMENTS>",
  "status": "pending",
  "assigned_to": null,
  "created_at": "<ISO 8601 timestamp>",
  "completed_at": null,
  "result": null,
  "priority": "normal",
  "retries": 0,
  "max_retries": 3
}
```

3. Ensure the `.context/inbox/` directory exists. Create it (and `.context/active/`, `.context/completed/`) if they do not exist.

4. Write the JSON file to `.context/inbox/{task_id}.json`.

5. Confirm dispatch by displaying the Task ID, Requirements summary, File path written, and Timestamp.

If no $ARGUMENTS are provided, ask the user what task they want to dispatch.
