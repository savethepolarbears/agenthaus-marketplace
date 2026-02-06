---
name: publish-to-marketplace
description: Register and publish a Claude plugin to the AgentHaus marketplace. Triggers on "publish plugin", "add to marketplace", "register plugin".
---

# Publish to Marketplace Skill

## Goal

Register a validated Claude Code/Cowork plugin with the AgentHaus marketplace and update the storefront.

## Prerequisites

Before publishing, ensure:

- [ ] Plugin directory exists under `plugins/<plugin-name>/`
- [ ] Valid `plugin.json` manifest in `.claude-plugin/`
- [ ] At least one command or agent defined
- [ ] README.md with installation instructions
- [ ] All environment variables documented

## Procedure

### Step 1: Validate Plugin Structure

1. Verify plugin directory exists:

   ```bash
   ls -la plugins/<plugin-name>/
   ```

2. Validate plugin.json:

   ```bash
   cat plugins/<plugin-name>/.claude-plugin/plugin.json | jq .
   ```

3. Check for required files:
   - `.claude-plugin/plugin.json` ✓
   - `README.md` ✓
   - At least one of: `commands/`, `agents/`, `skills/` ✓

### Step 2: Determine Category

Select the appropriate category from:

- `devops` - CI/CD, deployment, infrastructure
- `productivity` - Task management, scheduling
- `content` - Content creation, social media
- `qa` - Testing, quality assurance
- `docs` - Documentation, knowledge retrieval
- `cloud` - Cloud platform integrations
- `database` - Database operations
- `rag` - RAG patterns, knowledge synthesis
- `knowledge` - Note-taking, wikis
- `utility` - General-purpose tools

### Step 3: Add to Marketplace Registry

1. Open `.claude-plugin/marketplace.json`

2. Add new plugin entry to the `plugins` array:

   ```json
   {
     "name": "<plugin-name>",
     "source": "./plugins/<plugin-name>",
     "category": "<category>",
     "description": "<user-facing description>"
   }
   ```

3. Ensure the `source` path is relative to marketplace.json

### Step 4: Update Web Storefront (if applicable)

1. Check if storefront needs updating:

   ```bash
   ls agenthaus-web/src/
   ```

2. Add plugin card to the storefront catalog if present

### Step 5: Commit Changes

1. Stage all plugin files:

   ```bash
   git add plugins/<plugin-name>/ .claude-plugin/marketplace.json
   ```

2. Commit with descriptive message:

   ```bash
   git commit -m "feat(marketplace): add <plugin-name> plugin"
   ```

## Output Format

- Updated `marketplace.json` with new plugin entry
- Commit ready for push to repository
- Plugin ready for installation via `/plugin install <name>@agenthaus`

## Constraints

- Plugin name MUST match between plugin.json and marketplace.json
- Category MUST be one of the standard categories
- Description MUST be user-facing (not developer jargon)
- Source path MUST be relative to marketplace.json location

## Verification Checklist

After publishing:

- [ ] Plugin appears in marketplace.json
- [ ] JSON is valid (no syntax errors)
- [ ] git status shows expected changes
- [ ] Commit message follows conventional commits

## Rollback

If issues are found:

```bash
git checkout -- .claude-plugin/marketplace.json
```
