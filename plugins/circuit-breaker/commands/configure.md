---
name: configure
description: Enable or disable specific circuit breaker guardrails
---

You are configuring circuit breaker safety guardrails.

Follow these steps:

1. **List available breakers**: Present the three built-in circuit breakers:
   - `block-prod-deploy` -- Blocks deployments outside business hours (Mon-Fri 9am-5pm)
   - `require-tests` -- Requires test files in staged changes before committing
   - `budget-guard` -- Warns when tool usage exceeds threshold (default: 100 calls)

2. **Read current config**: Check if `.circuit-breaker-config.json` exists. If it does, load and display current state. If not, all breakers default to enabled.

3. **Process arguments**: Based on $ARGUMENTS:
   - `enable <breaker-name>` -- Enable the specified breaker
   - `disable <breaker-name>` -- Disable the specified breaker
   - `enable all` -- Enable all breakers
   - `disable all` -- Disable all breakers
   - `reset` -- Delete the counter file at `/tmp/circuit-breaker-counter` and reset config to defaults
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

5. **Confirm**: Display which breakers are now active and their settings.
