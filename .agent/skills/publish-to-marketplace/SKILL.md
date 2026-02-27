---
name: publish-to-marketplace
description: Use when registering a validated Claude plugin with the AgentHaus marketplace, adding a plugin entry to marketplace.json, or updating the web storefront catalog. Triggers on "publish plugin", "add to marketplace", "register plugin", "submit plugin".
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

- `content` - Content creation, social media
- `devops` - CI/CD, infrastructure
- `cloud` - Cloud platform integrations
- `deployment` - Deploy and hosting tools
- `knowledge` - Note-taking, wikis
- `docs` - Documentation, knowledge retrieval
- `rag` - RAG patterns, knowledge synthesis
- `productivity` - Task management, scheduling
- `qa` - Quality assurance
- `testing` - Automated testing, E2E
- `database` - Database operations
- `utility` - General-purpose tools
- `ux` - UI/UX audits, accessibility
- `orchestration` - Agent coordination, handoff
- `safety` - Deploy gates, circuit breakers
- `memory` - Persistent recall, session memory
- `training` - Agent review queues
- `security` - Code scanning, plugin auditing
- `integration` - Cross-platform bridges

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

1. Read the storefront page at `agenthaus-web/src/app/page.tsx`

2. Add the new plugin to the plugins data array with:
   - `name`: Plugin display name
   - `description`: User-facing description (same as marketplace.json)
   - `category`: Matching category from Step 2
   - `tags`: Array of relevant tags from plugin.json
   - `icon`: Appropriate Lucide React icon name

3. Verify the plugin card renders correctly in the storefront grid

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

## Common Mistakes

| Mistake | Fix |
| ------- | --- |
| Plugin name mismatch between plugin.json and marketplace.json | Copy the exact `name` value from plugin.json |
| Using developer jargon in the marketplace description | Write user-facing language — "Manage GitHub issues and PRs" not "MCP server wrapper for GitHub API" |
| Forgetting to stage marketplace.json in the commit | Always `git add .claude-plugin/marketplace.json` alongside the plugin directory |
| Using an absolute path for `source` in marketplace.json | Source must be relative: `"./plugins/<name>"` not `"/Users/.../plugins/<name>"` |
| Not validating JSON after editing marketplace.json | Parse with `jq` or a JSON validator before committing — a single trailing comma breaks everything |
| Skipping the storefront update | If `agenthaus-web/` exists, the plugin should appear in the web catalog too |

## Rollback

If issues are found:

```bash
git checkout -- .claude-plugin/marketplace.json
```
