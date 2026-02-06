---
name: takeover
description: Attach to a running agent session and take over execution
---

You are taking over an active agent session.

Follow these steps:

1. **Identify the target**: Take $ARGUMENTS as a task ID (full or partial match). If no argument provided, list active tasks from `.context/active/` and ask which one to take over.

2. **Read the task state**: Load the task JSON file from `.context/active/{task_id}.json`. Display:
   - Task ID and requirements
   - Current agent assignment
   - How long it has been running
   - Any partial results or progress notes

3. **Take over**: Update the task file:
   - Set `assigned_to` to the current session identifier
   - Add a `takeover_history` array entry with the previous agent ID and timestamp
   - Keep the status as `"in_progress"`

4. **Resume execution**: Based on the task requirements and any partial results:
   - Assess what has been completed so far
   - Determine remaining work
   - Continue execution from where the previous agent left off

5. **Complete normally**: Follow the same completion protocol as `/claim` -- update status, result, and move to `.context/completed/`.

If the task ID is not found in `.context/active/`, check `.context/inbox/` and offer to claim it instead.
