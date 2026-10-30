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
Configured Write, Edit and Bash proposals will be recorded as digests for review.
Use /shadow-mode:review to process the queue.
```

### 2. Action Queuing

Configured Claude Code Write, Edit and Bash events are blocked while the marker
is active. The hook keeps request bytes in memory, records their SHA-256 digest,
and atomically publishes a private, collision-resistant JSON file. No raw
command, file path, content, or redacted payload is retained. Python 3 is required;
missing dependencies or queue failures block without claiming a saved record.

```json
{
  "schema_version": 2,
  "id": "random-proposal-id",
  "tool": "Bash",
  "timestamp": "2026-10-24T12:00:00+00:00",
  "status": "pending",
  "request_sha256": "64 hexadecimal characters",
  "requires_fresh_review": true
}
```

### 3. Review Queue

Follow [the review procedure](../../commands/review.md). Show only safe metadata.
Require the operator to review the original request afresh in the current session
and separately approve its exact target and parameters. A digest does not permit
reconstruction or replay. Never execute legacy raw payloads or approve all unseen
operations. Reject or skip records whose original request is unavailable.

Keep the marker active unless the operator explicitly changes mode. A newly
blocked execution remains pending; report execution and durable readback separately.

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
   - **Revise and review again**: Correct the original request and obtain fresh approval
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
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/shadow-intercept.sh"
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


## AgentHaus guarded execution coverage

The optional AgentHaus stdio proxy is the single execution owner only for MCP
servers explicitly wrapped with `guardPlugin` from
`scripts/generate-cross-platform.js`. Default installation remains native.
Direct shell commands, WP-CLI, SDK/HTTP calls, and agent instructions are outside
that boundary. Native hooks supply guidance; they do not intercept those paths.

Use an operator-owned policy and pinned Ed25519 public key. Approval receipts
bind the complete request, policy, actor, provider, scope and 60-second expiry;
the proxy consumes each nonce once before forwarding. An independent operator
may issue a receipt with `scripts/approve-guard-request.js` from a terminal.
Without that broker or a valid receipt, approval-required calls stay blocked.
Keep signing keys, pinned configuration and consumed-nonce storage outside the
agent's OS identity. File mode 0700 alone does not isolate same-user processes.
This proxy does not provide an OS sandbox, native provider approval UI, or remote
transport enforcement. Local fixtures verify protocol behavior; live provider
discovery and operator UX still require validation.
