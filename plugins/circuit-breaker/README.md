# Circuit Breaker

Pre-built safety guardrails as reusable hooks for Claude Code workflows. Prevents common mistakes like deploying outside business hours, committing without tests, or running excessive tool calls.

## Platform Support

| Feature | Claude Code | Codex CLI | Gemini CLI | Cursor | Windsurf | Claude Desktop |
| --------- | ------------- | ----------- | ------------ | -------- | ---------- | ---------------- |
| Commands | full | partial | partial | partial | partial | n/a |
| Skills | full | full | full | full | full | n/a |
| MCP | n/a | n/a | n/a | n/a | n/a | n/a |
| Hooks | full | none | none | none | none | n/a |

## Prerequisites

No environment variables are required. The hooks are POSIX shell plus:

- **python3**: required by `require-tests` and by the `git push` check in `block-prod-deploy`, which compute what a git command will really do (`hooks/scripts/git_intent.py`). Without it, both fail closed: commits are blocked and pushes are treated as deploys.
- **jq**: required by the `/loop` guard (`loop-arm.sh`, `loop-guard.sh`). Without it `/loop arm` refuses to arm and the Stop hook never continues a session. Hook payloads are parsed with python3 when jq is missing, but `.circuit-breaker-config.json` (the `/configure` overrides and budget thresholds) is read with jq: without jq every breaker stays enabled with its default settings.

## Installation

```bash
/plugin install circuit-breaker
```

After installation, all three breakers are enabled by default.

## Usage

### View Configuration

```bash
/configure status
```

### Enable/Disable Breakers

```bash
/configure disable block-prod-deploy
/configure enable require-tests
/configure disable all
/configure enable all
```

### Set Budget Threshold

```bash
/configure threshold 200
```

### Reset Counters

```bash
/configure reset
```

## Breakers

### block-prod-deploy

Intercepts deployment commands (`deploy`, `push`, `publish`, `release`) and blocks them outside business hours:

- **Allowed**: Monday-Friday, 9:00 AM - 5:00 PM local time
- **Blocked**: Weekends and outside 9-17 hours
- **Override**: `/configure disable block-prod-deploy`

### require-tests

Intercepts `git commit` and checks if any test files (`*.test.*` or `*.spec.*`) are in the staged changes:

- **Passes**: At least one test file is staged
- **Blocks**: No test files found in `git diff --cached`
- **Override**: `/configure disable require-tests`

### budget-guard

Tracks total tool usage per session and warns when the count exceeds a threshold:

- **Default threshold**: 100 tool calls
- **Behavior**: Warning only (never blocks)
- **Repeats**: Warns again every 25 calls after threshold
- **Counter location**: `${TMPDIR:-/tmp}/circuit-breaker-${UID:-$(id -u)}/counter`
- **Reset**: Run `hooks/scripts/reset-counter.sh` or remove `${TMPDIR:-/tmp}/circuit-breaker-${UID:-$(id -u)}/counter`

## Architecture

Circuit breakers are implemented as PreToolUse hooks that run shell scripts before tool execution:

```text
hooks/
  hooks.json                    # Hook definitions with matchers
  scripts/
    block-prod-deploy.sh       # Time-of-day and day-of-week check
    require-tests.sh           # Staged file pattern matching
    budget-guard.sh            # Counter-based usage tracking
    reset-counter.sh           # Counter cleanup and reset
```

Each script reads `.circuit-breaker-config.json` to check if it is enabled before executing its logic. Scripts exit 0 to allow the action or exit 1 to block it.

### Configuration File

The config is stored as `.circuit-breaker-config.json` in the project root:

```json
{
  "breakers": {
    "block-prod-deploy": { "enabled": true },
    "require-tests": { "enabled": true },
    "budget-guard": { "enabled": true, "threshold": 100 }
  },
  "updated_at": "2025-01-15T10:30:00Z"
}
```
