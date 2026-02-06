# Testing Rules

Verification standards for plugins and marketplace changes.

## Plugin Validation

Before publishing any plugin:

1. **Structure Check**: Run `find plugins/<name> -type f` to verify files
2. **JSON Validation**: Run `cat plugins/<name>/.claude-plugin/plugin.json | jq .`
3. **README Exists**: Verify `plugins/<name>/README.md` is present

## Marketplace Validation

Before updating `marketplace.json`:

1. Validate JSON: `cat .claude-plugin/marketplace.json | jq .`
2. Verify source paths exist
3. Check plugin names match their manifest

## Manual Testing

- Test plugin commands before publishing
- Verify MCP server connections work
- Confirm environment variable documentation is complete
