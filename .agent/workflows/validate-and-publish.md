---
description: End-to-end plugin validation and marketplace publishing workflow
---

# Validate and Publish Plugin

Full pipeline from validation through marketplace registration.

// turbo-all

## Step 1: Validate Plugin Structure

1. Confirm the plugin directory exists and has required files:

```bash
ls -la plugins/<plugin-name>/.claude-plugin/plugin.json plugins/<plugin-name>/README.md
```

## Step 2: Run Automated Validation

1. Run the full validation suite against all plugins:

```bash
bash scripts/validate-plugins.sh
```

## Step 3: Validate JSON Syntax

1. Validate the plugin manifest:

```bash
python3 -m json.tool plugins/<plugin-name>/.claude-plugin/plugin.json > /dev/null && echo "VALID"
```

1. If the plugin has MCP config, validate it:

```bash
[ -f plugins/<plugin-name>/.mcp.json ] && python3 -m json.tool plugins/<plugin-name>/.mcp.json > /dev/null && echo "VALID"
```

## Step 4: Check for Common Issues

1. Verify no glob patterns in plugin.json paths:

```bash
grep -E '\*\.' plugins/<plugin-name>/.claude-plugin/plugin.json && echo "WARNING: Glob patterns detected — use explicit file paths" || echo "OK: No glob patterns"
```

1. Verify environment variables use `${VAR}` syntax:

```bash
grep -rn 'api_key\|api_token\|password\|secret' plugins/<plugin-name>/ --include="*.json" -i | grep -v '\${'
```

## Step 5: Add to Marketplace Registry

1. Edit `.claude-plugin/marketplace.json`
2. Add new plugin entry to the `plugins` array with: `name`, `source`, `category`, `description`
3. Validate the updated marketplace.json:

```bash
python3 -m json.tool .claude-plugin/marketplace.json > /dev/null && echo "VALID"
```

## Step 6: Update Web Storefront (if applicable)

1. If the plugin should appear in the web catalog, update `agenthaus-web/src/app/page.tsx`
2. Add plugin data with matching category, tags, and Lucide icon

## Step 7: Commit

1. Stage all changes:

```bash
git add plugins/<plugin-name>/ .claude-plugin/marketplace.json
git status
```

1. Commit with conventional commit message:

```bash
git commit -m "feat(marketplace): add <plugin-name> plugin"
```
