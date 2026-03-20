---
name: safety-guardrails
description: Configure and manage pre-built safety guardrails for agent workflows including deploy gates, test requirements, and budget warnings. Use when the user asks to set up deployment safety checks, enforce test requirements before commits, monitor agent tool usage budgets, or configure circuit breaker patterns for autonomous agent operations.
---

# Safety Guardrails (Circuit Breaker)

Pre-built safety hooks that prevent risky agent actions: deployment gates, test requirements, and budget guards.

## When to Use

- User asks to add safety checks to their agent workflow
- User wants to prevent deployments outside business hours
- User needs to enforce test coverage requirements before commits
- User wants to monitor and limit agent tool usage
- User asks to configure or manage circuit breaker patterns
- User needs to reset or adjust safety thresholds

## Available Guardrails

### 1. Block Production Deploys (`block-prod-deploy`)

Prevents deployments outside business hours (Monday-Friday, 9 AM - 5 PM local time).

**How it works:**
- Intercepts deployment tool calls via PreToolUse hooks
- Checks the current day and time against the allowed window
- Blocks the deployment with a clear message if outside hours
- Can be overridden by disabling the breaker

### 2. Require Tests (`require-tests`)

Ensures test files are included in staged changes before allowing commits.

**How it works:**
- Intercepts git commit operations via PreToolUse hooks
- Scans staged files for test patterns (`*.test.*`, `*.spec.*`)
- Blocks the commit if no test files are staged alongside code changes
- Encourages test-driven development practices

### 3. Budget Guard (`budget-guard`)

Warns when agent tool usage exceeds a configurable threshold.

**How it works:**
- Tracks the number of tool calls made in the current session
- Stored in `/tmp/circuit-breaker-counter`
- Issues a warning when the threshold is reached (default: 100 calls)
- Helps prevent runaway agent sessions that consume excessive resources

## Steps

### Configuration

To configure guardrails:

1. **Check current status**: Read `.circuit-breaker-config.json` if it exists
2. **Enable/disable breakers**: Toggle individual guardrails on or off
3. **Set thresholds**: Adjust the budget-guard threshold (default: 100)
4. **Reset counters**: Clear the tool usage counter at `/tmp/circuit-breaker-counter`

### Configuration File Format

```json
{
  "breakers": {
    "block-prod-deploy": { "enabled": true },
    "require-tests": { "enabled": true },
    "budget-guard": { "enabled": true, "threshold": 100 }
  },
  "updated_at": "2026-03-15T10:00:00Z"
}
```

### Available Operations

| Operation | Description |
|-----------|-------------|
| `enable <name>` | Enable a specific guardrail |
| `disable <name>` | Disable a specific guardrail |
| `enable all` | Enable all guardrails |
| `disable all` | Disable all guardrails |
| `reset` | Reset counters and config to defaults |
| `threshold <n>` | Set budget-guard threshold |
| `status` | Show current configuration |

## Integration with Hooks

The guardrails work through Claude Code's hook system:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash|Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/check-guardrails.sh"
          }
        ]
      }
    ]
  }
}
```

## Best Practices

- Enable all guardrails by default for new projects
- Adjust the budget-guard threshold based on task complexity
- Review the deploy window schedule for your team's time zone
- Use `status` to verify configuration before critical operations
- Reset counters at the start of each new task or session
