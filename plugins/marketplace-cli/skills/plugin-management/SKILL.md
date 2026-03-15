---
name: plugin-management
description: Search, browse, install, validate, and manage AgentHaus marketplace plugins. Use when the user asks to find plugins, install new capabilities, validate plugin structure, check compatibility, or migrate plugins between formats.
---

# Plugin Management (Marketplace CLI)

Search, install, validate, and manage plugins from the AgentHaus marketplace.

## When to Use

- User asks to find or search for plugins by keyword or capability
- User wants to install a plugin from the marketplace
- User needs to validate a plugin's structure and configuration
- User asks to list installed plugins or check for updates
- User wants to migrate a plugin to a different format

## Steps

### 1. Search Plugins

When searching for plugins:

1. Accept search terms: keywords, categories, tags, or capability descriptions
2. Search the marketplace catalog (`marketplace.json`)
3. Present matching plugins with:

```markdown
| Plugin | Category | Description |
|--------|----------|-------------|
| social-media | content | Generate social media posts with trend analysis |
| github-integration | devops | Manage GitHub issues and PRs |
```

4. Suggest related plugins based on the user's workflow

### 2. Install Plugins

When installing a plugin:

1. Verify the plugin exists in the marketplace
2. Check for required environment variables
3. Download/link the plugin to the local plugins directory
4. Validate the plugin structure after installation
5. Report success and list available commands/skills

```
### Installed: social-media v2.0.0

Commands: /tweet, /linkedin, /instagram, /facebook, /analyze-trend
Skills: social-content
Agents: content-writer, trend-analyzer
Required env: (none)
```

### 3. Validate Plugins

When validating a plugin:

1. **Manifest check**: Verify `.claude-plugin/plugin.json` exists and contains required fields (name, version, description)
2. **Command check**: Verify all referenced command files exist and have YAML frontmatter with `description`
3. **Agent check**: Verify agent files have `name`, `description`, `model` fields
4. **Skill check**: Verify SKILL.md files have `name` and `description` frontmatter
5. **Hook check**: Verify hooks use object format with `"hooks"` key (not array)
6. **MCP check**: Verify `.mcp.json` has valid `mcpServers` configuration
7. **Security check**: Scan for hardcoded secrets or unsafe patterns

#### Validation Report

```
### Plugin Validation: social-media

- [PASS] Manifest: valid plugin.json
- [PASS] Commands: 5/5 valid
- [PASS] Agents: 2/2 valid
- [PASS] Skills: 1/1 valid
- [PASS] Hooks: valid format
- [PASS] Security: no issues found

Overall: PASS (7/7 checks)
```

### 4. Migration

When migrating plugins between formats:

1. Identify source format (AgentHaus, OpenClaw, generic SKILL.md)
2. Map capabilities to target format
3. Convert configuration files
4. Validate the converted output
5. Report any capabilities that couldn't be mapped

## Available Categories

| Category | Description |
|----------|-------------|
| content | Content creation and social media |
| devops | Development operations and CI/CD |
| cloud | Cloud platform management |
| deployment | Hosting and deployment |
| database | Database management |
| productivity | Task and project management |
| qa | Testing and quality assurance |
| knowledge | Documentation and knowledge bases |
| orchestration | Multi-agent coordination |
| safety | Guardrails and safety checks |
| security | Security scanning and auditing |
| integration | Cross-platform compatibility |
| utility | Tools and utilities |
| ux | UI/UX design and accessibility |
| seo | Search optimization and discoverability |

## Error Handling

- Plugin not found: Suggest similar plugins or check spelling
- Invalid manifest: Report specific validation errors with fix suggestions
- Missing dependencies: List required environment variables
- Network errors: Retry with exponential backoff for remote installations
