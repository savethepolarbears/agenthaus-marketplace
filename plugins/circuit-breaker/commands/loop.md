---
description: Set up, arm, inspect or disarm a bounded "work until the check passes" loop for this project
argument-hint: "[status | init <completion command> [max-iterations] | arm | disarm | disarm-all]"
allowed-tools: Read, Write, Bash(bash *loop-arm.sh*), Bash(cat .agenthaus/loop.json)
---

# Bounded completion loop (loop guard)

The circuit-breaker `Stop` hook can keep the agent working until a deterministic
completion check passes, with a hard iteration cap. It is **off** until a human
arms it. Arguments: `$ARGUMENTS`

## Contract

- Config: `.agenthaus/loop.json` in the project root:

  ```json
  { "completionCommand": "npm test", "maxIterations": 5, "timeoutSec": 120, "chain": true }
  ```

- `completionCommand` exit 0 means done. Anything else re-prompts the agent with the
  last 1500 bytes of output, until `maxIterations` (clamped to 1..8) is used up.
- The budget resets on every new user prompt and on session start/clear, so each
  turn is independent and reproducible.
- Arming pins this project's physical path plus the config's sha256. Editing the config, or the same
  config appearing in another checkout, is not trusted until armed there. Re-arm after every change.
- `chain: false` honours `stop_hook_active` and allows at most one re-prompt per turn.

## Steps

1. `status` (default): read `.agenthaus/loop.json` and report its settings. State
   lives in `${CLAUDE_PLUGIN_DATA}/loops/` (fallback `${TMPDIR:-/tmp}/circuit-breaker-<uid>/loops/`).
2. `init <cmd> [n]`: write `.agenthaus/loop.json` with `completionCommand` = `<cmd>` and
   `maxIterations` = `n` (default 5). Show the file to the user, then tell them to arm it.
3. `arm`: only after the user has explicitly confirmed the exact `completionCommand`,
   run `bash "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/loop-arm.sh"`.
4. `disarm`: run `bash "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/loop-arm.sh" --disarm-project` (this project only).
5. `disarm-all`: run `bash "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/loop-arm.sh" --disarm` (every project).

Never choose a completion command that is trivially true (`true`, `exit 0`) or that
skips or deletes tests. The point of the loop is that the check stays fixed and the
code changes.
