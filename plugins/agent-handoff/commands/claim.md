---
name: claim
description: Claim a pending task from the blackboard and execute it
---

You are claiming and executing a task from the agent blackboard.

Follow these steps exactly:

1. **List pending tasks**: Read all JSON files from `.context/inbox/` directory. If the directory does not exist or is empty, report "No pending tasks available" and stop.

2. **Select a task**: If $ARGUMENTS contains a task ID, claim that specific task. Otherwise, display all pending tasks and select the oldest one (by `created_at`).

3. **Claim the task**:
   - Update the task JSON: set `status` to `"in_progress"` and `assigned_to` to `"claude-agent-<session>"` (use a short identifier for the current session).
   - Move the file from `.context/inbox/{task_id}.json` to `.context/active/{task_id}.json`.
   - Create the `.context/active/` directory if it does not exist.

4. **Execute the task**: Read the `requirements` field and perform the requested work. This is the core execution phase -- carry out whatever the requirements describe.

5. **Complete the task**:
   - Update the task JSON: set `status` to `"completed"`, `completed_at` to the current ISO timestamp, and `result` to a summary of what was accomplished.
   - Move the file from `.context/active/{task_id}.json` to `.context/completed/{task_id}.json`.
   - Create the `.context/completed/` directory if it does not exist.

6. **Handle failures**: If execution fails:
   - Increment the `retries` counter.
   - If `retries` < `max_retries`, set `status` back to `"pending"` and move the file back to `.context/inbox/`.
   - If `retries` >= `max_retries`, set `status` to `"failed"` and move to `.context/completed/` with the error in `result`.

7. **Report**: Display the task ID, what was done, and the final status.
