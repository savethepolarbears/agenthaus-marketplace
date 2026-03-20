---
name: enable
description: Enable shadow mode to queue all actions for review
---

You are enabling shadow mode. In this mode, destructive actions (file writes, edits, shell commands) are intercepted and queued for human review instead of executing immediately.

Follow these steps:

1. Create the `.shadow-mode-enabled` marker file in the project root. Write the current ISO timestamp and session identifier into it:
```
enabled_at: <ISO timestamp>
enabled_by: <session identifier>
```

2. Create the `review_queue/` directory if it does not exist.

3. Confirm activation by displaying:
```
Shadow Mode: ACTIVE
Actions will be queued to review_queue/ for approval.
Use /review to inspect and approve/reject queued actions.
Use /disable to deactivate shadow mode.
```

Note: The hooks in this plugin intercept Write, Edit, and Bash tool calls. While shadow mode is active, these actions will be logged to the review queue instead of executing.
