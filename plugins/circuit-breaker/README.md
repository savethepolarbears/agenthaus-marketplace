# Circuit Breaker

Pre-built safety guardrails as reusable hooks for Claude Code workflows. Prevents common mistakes like deploying outside business hours, committing without tests, or running excessive tool calls.

## Prerequisites

No external dependencies or environment variables required. Shell scripts use standard POSIX utilities.

## Installation

```bash
/plugin install circuit-breaker
```

After installation, all three breakers are enabled by default.

## Usage

### View Configuration

```
/configure status
```

### Enable/Disable Breakers

```
/configure disable block-prod-deploy
/configure enable require-tests
/configure disable all
/configure enable all
```

### Set Budget Threshold

```
/configure threshold 200
```

### Reset Counters

```
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
- **Counter location**: `/tmp/circuit-breaker-counter`

## Architecture

Circuit breakers are implemented as PreToolUse hooks that run shell scripts before tool execution:

```
hooks/
  hooks.json                    # Hook definitions with matchers
  scripts/
    block-prod-deploy.sh       # Time-of-day and day-of-week check
    require-tests.sh           # Staged file pattern matching
    budget-guard.sh            # Counter-based usage tracking
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
