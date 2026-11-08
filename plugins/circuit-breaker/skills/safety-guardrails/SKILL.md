---
name: safety-guardrails
description: Configure and manage pre-built safety guardrails for agent workflows including deploy gates, test requirements, per-session tool budgets and bounded completion loops. Use when the user asks to set up deployment safety checks, enforce test requirements before commits, monitor agent tool usage budgets, or configure circuit breaker patterns for autonomous agent operations.
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
- User wants the agent to "keep going until tests pass" without an unbounded loop

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

Asks for confirmation when per-session tool usage reaches a configurable threshold.

**How it works:**

- Counts tool calls per `session_id` (from the hook payload on stdin), so parallel sessions never share a budget
- Stored in a user-isolated, owner-only directory: `${TMPDIR:-/tmp}/circuit-breaker-${UID:-$(id -u)}/counter-<session_id>`
- At the threshold (default 100), and every 25 calls past it, returns `permissionDecision: "ask"` so a human decides whether the run continues
- Helps prevent runaway agent sessions that consume excessive resources

### 4. Loop Guard (`loop-guard`)

A `Stop` hook that turns "keep working until done" into a deterministic, bounded loop.

**How it works:**

- Opt-in per project via `.agenthaus/loop.json` (`completionCommand`, `maxIterations`, `timeoutSec`, `chain`)
- Must be armed with `/circuit-breaker:loop arm`; the config's sha256 is pinned, so any edit (or a config planted by a cloned repo) is ignored until re-armed
- On Stop, runs `completionCommand`: exit 0 lets the agent stop; otherwise it returns `{"decision":"block","reason":...}` with the failing output, up to `maxIterations` (clamped to 1..8, inside Claude Code's own continuation cap)
- Iteration state resets on `SessionStart` (startup/clear) and on every `UserPromptSubmit`, so each user turn has a fresh, reproducible budget
- Fails safe: a missing tool, missing config or internal error lets the agent stop rather than spin

### Loop engineering contract

| Concern | Mechanism |
| --- | --- |
| Cadence (run every N minutes) | Claude Code `/loop [interval] <prompt>` |
| Termination | loop-guard `Stop` hook + `maxIterations` |
| Runaway tool use | budget-guard `ask` at threshold |
| Idempotent shared state across agents | `agent-handoff` blackboard (SQLite leases, fencing tokens) |
| Subagent turn limits | `maxTurns` in agent frontmatter |

## Steps

### Configuration

To configure guardrails:

1. **Check current status**: Read `.circuit-breaker-config.json` if it exists
2. **Enable/disable breakers**: Toggle individual guardrails on or off
3. **Set thresholds**: Adjust the budget-guard threshold (default: 100)
4. **Reset counters**: Clear the tool usage counter via `${CLAUDE_PLUGIN_ROOT}/hooks/scripts/reset-counter.sh` or by removing `${TMPDIR:-/tmp}/circuit-breaker-${UID:-$(id -u)}/counter`

### Configuration File Format

```json
{
  "breakers": {
    "block-prod-deploy": { "enabled": true },
    "require-tests": { "enabled": true },
    "budget-guard": { "enabled": true, "threshold": 100 },
    "loop-guard": { "enabled": true }
  },
  "updated_at": "2026-03-15T10:00:00Z"
}
```

### Available Operations

| Operation | Description |
| ----------- | ------------- |
| `enable <name>` | Enable a specific guardrail |
| `disable <name>` | Disable a specific guardrail |
| `enable all` | Enable all guardrails |
| `disable all` | Disable all guardrails |
| `reset` | Reset counters and config to defaults |
| `threshold <n>` | Set budget-guard threshold |
| `status` | Show current configuration |

## Integration with Hooks

All guardrails ship in this plugin's `hooks/hooks.json` and load automatically:

| Event | Matcher | Script |
| --- | --- | --- |
| `PreToolUse` | `Bash` | `block-prod-deploy.sh` (exit 2 blocks) |
| `PreToolUse` | `Bash` + `if: Bash(git commit *)` | `require-tests.sh` (exit 2 blocks) |
| `PreToolUse` | `.*` | `budget-guard.sh` (`ask` at threshold) |
| `Stop` | (all) | `loop-guard.sh` (`decision: block` while the check fails) |
| `SessionStart` | `startup\|clear` | `loop-reset.sh` |
| `UserPromptSubmit` | (all) | `loop-reset.sh` |

Every script reads the hook payload as JSON on stdin and runs from `${CLAUDE_PLUGIN_ROOT}/hooks/scripts/`.

## Best Practices

- Enable all guardrails by default for new projects
- Adjust the budget-guard threshold based on task complexity
- Review the deploy window schedule for your team's time zone
- Use `status` to verify configuration before critical operations
- Reset counters at the start of each new task or session


## AgentHaus guarded execution coverage

The optional AgentHaus stdio proxy is the single execution owner only for MCP
servers explicitly wrapped with `guardPlugin` (from `src/safety-wiring.js` in the
AgentHaus repository checkout, not this installed plugin). Default installation remains native.
Direct shell commands, WP-CLI, SDK/HTTP calls, and agent instructions are outside
that boundary. Native hooks supply guidance; they do not intercept those paths.

Use an operator-owned policy and pinned Ed25519 public key. Approval receipts
bind the complete request, policy, actor, provider, scope and 60-second expiry;
the proxy consumes each nonce once before forwarding. An independent operator
may issue a receipt with `scripts/approve-guard-request.js` from an AgentHaus
repository checkout, in a terminal.
Without that broker or a valid receipt, approval-required calls stay blocked.
Keep signing keys, pinned configuration and consumed-nonce storage outside the
agent's OS identity. File mode 0700 alone does not isolate same-user processes.
This proxy does not provide an OS sandbox, native provider approval UI, or remote
transport enforcement. Local fixtures verify protocol behavior; live provider
discovery and operator UX still require validation.
