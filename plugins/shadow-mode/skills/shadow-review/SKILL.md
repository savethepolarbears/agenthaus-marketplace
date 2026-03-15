---
name: shadow-review
description: Training mode where agent actions are drafted to a review queue instead of executing directly, enabling human-in-the-loop oversight and agent training. Use when the user asks to enable supervised agent execution, review pending agent actions, manage a review queue, or set up human approval gates for agent operations.
---

# Shadow Mode — Agent Review Queue

Route agent actions through a review queue for human approval before execution, enabling safe agent training and oversight.

## When to Use

- User wants agents to draft actions instead of executing them directly
- User needs human-in-the-loop oversight for agent operations
- User asks to review pending agent actions before approval
- User wants to train agents by reviewing and correcting their proposed actions
- User needs a safety layer for high-risk automated operations

## Steps

### 1. Enable Shadow Mode

When activating shadow mode:

1. Create a `.shadow-mode-enabled` marker file in the project root
2. Create the `review_queue/` directory if it doesn't exist
3. Create the `review_queue/rejected/` subdirectory for rejected actions
4. Confirm activation:

```
Shadow Mode: ACTIVE
All agent actions will be queued for review.
Use /shadow-mode:review to process the queue.
```

### 2. Action Queuing

When shadow mode is active, agent actions are intercepted:

1. **Capture**: The proposed action (file edit, command, API call) is serialized
2. **Queue**: Saved as a timestamped file in `review_queue/`
3. **Log**: Action type, target, description, and full payload are recorded

#### Queue Entry Format

```json
{
  "id": "action-20260315-120000",
  "timestamp": "2026-03-15T12:00:00Z",
  "type": "file_edit",
  "target": "src/components/Header.tsx",
  "description": "Add aria-label to navigation button",
  "payload": {
    "old_content": "...",
    "new_content": "..."
  },
  "status": "pending"
}
```

### 3. Review Queue

When reviewing pending actions:

1. **List pending**: Show all queued actions with summaries

```markdown
### Review Queue (3 pending)

| # | Time | Type | Target | Description |
|---|------|------|--------|-------------|
| 1 | 12:00 | file_edit | Header.tsx | Add aria-label to nav |
| 2 | 12:01 | bash | — | npm run test |
| 3 | 12:02 | file_edit | api.ts | Add error handling |
```

2. **Review each action**: Show the full details and diff for each
3. **Approve**: Execute the action and remove from queue
4. **Reject**: Move to `review_queue/rejected/` with optional reason
5. **Edit**: Modify the proposed action before approving

### 4. Disable Shadow Mode

When deactivating:

1. Remove the `.shadow-mode-enabled` marker file
2. Check for remaining pending items in `review_queue/`
3. If items remain, warn the user:
   ```
   Warning: {count} actions still pending in review_queue/.
   Run /review to process them before they are lost.
   ```
4. Confirm deactivation:
   ```
   Shadow Mode: INACTIVE
   All actions will now execute normally.
   ```

### 5. Training Workflow

Use shadow mode for agent training:

1. Enable shadow mode for a training session
2. Let the agent process tasks normally (actions are queued)
3. Review each proposed action:
   - **Approve**: Action was correct — reinforces good behavior
   - **Reject with feedback**: Action was wrong — add correction notes
   - **Edit and approve**: Action was close — show the correct approach
4. Analyze the approval/rejection ratio to measure agent accuracy
5. Use rejected actions to improve prompts and instructions

## Integration with Hooks

Shadow mode works through PreToolUse hooks that intercept actions:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash|Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/shadow-intercept.sh"
          }
        ]
      }
    ]
  }
}
```

## Best Practices

- Enable shadow mode when onboarding new plugins or workflows
- Use it for high-risk operations (database changes, deployments)
- Review and clear the queue regularly to prevent buildup
- Track approval rates to identify areas needing better instructions
- Disable shadow mode once confidence in the workflow is established
