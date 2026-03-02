---
description: Map out the codebase and generate context for new agent sessions
---

# Codebase Onboarding

Generate or refresh persistent context for AI agents starting a new session.

## Step 1: Read Memory Bank

1. Read all files in `.agent/memory-bank/` to understand the current project context
2. Note any sections marked as outdated or needing updates

## Step 2: Verify Architecture

1. List all plugin directories and count them:

```bash
ls -d plugins/*/ | wc -l
```

1. Compare against the count stated in the architecture docs
2. Check for any new plugins not yet reflected in the memory bank

## Step 3: Validate Registry Alignment

1. Extract plugin names from marketplace.json:

```bash
python3 -c "import json; data=json.load(open('.claude-plugin/marketplace.json')); [print(p['name']) for p in data['plugins']]"
```

1. Cross-reference with actual plugin directories
2. Flag any mismatches

## Step 4: Check Web Storefront State

1. Verify `agenthaus-web/package.json` dependencies are current:

```bash
cat agenthaus-web/package.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'Next.js {d[\"dependencies\"][\"next\"]}'); print(f'React {d[\"dependencies\"][\"react\"]}')"
```

1. Note any dependency version discrepancies with the architecture docs

## Step 5: Update Memory Bank

1. If any discrepancies were found, update `.agent/memory-bank/architecture.md` with corrections
2. If new architectural decisions have been made, append them to `.agent/memory-bank/decision-log.md`

## Step 6: Generate Session Summary

1. Create a brief summary of the current project state
2. List any known issues, TODOs, or areas needing attention
3. Present this as the session context for the current conversation

## Expected Outcomes

- Memory bank is verified accurate and up-to-date
- Agent has full project context without reading every file
- Any drift between docs and reality is caught and corrected
