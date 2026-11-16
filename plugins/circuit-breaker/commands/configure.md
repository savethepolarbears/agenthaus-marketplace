---
description: Enable or disable specific circuit breaker guardrails, set the budget threshold, or reset counters
argument-hint: "[status | enable <name> | disable <name> | enable all | disable all | threshold <n> | reset]"
---

# Configure Circuit Breakers

You are configuring circuit breaker safety guardrails.

Follow these steps:

1. **List available breakers**: Present the four built-in circuit breakers:
   - `block-prod-deploy` -- Blocks deployments outside business hours (Mon-Fri 9am-5pm)
   - `require-tests` -- Requires test files in staged changes before committing
   - `budget-guard` -- Asks for confirmation when per-session tool usage reaches the threshold (default: 100 calls)
   - `loop-guard` -- Bounded Stop-hook loop driven by `.agenthaus/loop.json` (see `/circuit-breaker:loop`)

2. **Read current config**: Check if `.circuit-breaker-config.json` exists. If it does, load and display current state. If not, all breakers default to enabled.

3. **Process arguments**: Based on $ARGUMENTS:
   - `enable <breaker-name>` -- Enable the specified breaker
   - `disable <breaker-name>` -- Disable the specified breaker
   - `enable all` -- Enable all breakers
   - `disable all` -- Disable all breakers
   - `reset` -- Run `${CLAUDE_PLUGIN_ROOT}/hooks/scripts/reset-counter.sh` (or remove `${TMPDIR:-/tmp}/circuit-breaker-${UID:-$(id -u)}/counter`) and reset config to defaults
   - `threshold <number>` -- Set the budget-guard threshold
   - `status` or no args -- Show current configuration

4. **Write config**: Save the updated configuration to `.circuit-breaker-config.json`:

```json
{
  "breakers": {
    "block-prod-deploy": { "enabled": true },
    "require-tests": { "enabled": true },
    "budget-guard": { "enabled": true, "threshold": 100 }
  },
  "updated_at": "<ISO timestamp>"
}
```

1. **Confirm**: Display which breakers are now active and their settings.
