# AgentHaus to OpenClaw Conversion

Step-by-step workflow for converting AgentHaus plugins to OpenClaw skill format.

## Step 1: Read Source Plugin Structure

Parse the AgentHaus plugin directory:

```
source-plugin/
  .claude-plugin/plugin.json    -> Extract metadata (name, version, description, tags)
  .mcp.json                     -> Extract MCP server configurations
  commands/*.md                 -> Extract command definitions
  agents/*.md                   -> Extract agent definitions
  skills/*/SKILL.md             -> Extract skill instructions
  hooks/*.json                  -> Extract hook definitions
```

Read `plugin.json` first to get the manifest, then read each referenced file.

## Step 2: Map Commands to OpenClaw Actions

For each command markdown file:

| AgentHaus | OpenClaw |
|-----------|----------|
| YAML `name` | Action `name` |
| YAML `description` | Action `description` |
| Markdown body | Action `instructions` |
| `$ARGUMENTS` | Input parameter `args: string` |

Output format (YAML):
```yaml
name: <command-name>
description: <description>
inputs:
  - name: args
    type: string
    required: false
    description: Command arguments
instructions: |
  <instruction body with $ARGUMENTS replaced by {{args}}>
```

## Step 3: Map Agents to OpenClaw Personas

For each agent markdown file:

| AgentHaus | OpenClaw |
|-----------|----------|
| YAML `name` | Persona `name` |
| YAML `description` | Persona `description` |
| YAML `model` | Persona `model` (mapped) |
| Markdown body | Persona `system_prompt` |

Model mapping:
- `sonnet` -> `claude-3-sonnet`
- `haiku` -> `claude-3-haiku`
- `opus` -> `claude-3-opus`
- `claude-3-7-sonnet` -> `claude-3.7-sonnet`

## Step 4: Map MCP Servers to OpenClaw Tool Providers

For each entry in `.mcp.json` `mcpServers`:

| AgentHaus | OpenClaw |
|-----------|----------|
| Server key | Provider `name` |
| `command` | Provider `command` |
| `args` | Provider `args` |
| `${ENV_VAR}` | `{{env.ENV_VAR}}` |

Output format (YAML):
```yaml
providers:
  - name: <server-key>
    type: mcp
    command: <command>
    args: <args with env var syntax converted>
```

## Step 5: Generate Output Files

Write to `openclaw-output/<plugin-name>/`:

```
openclaw-output/<plugin-name>/
  skill.yaml          # Main skill definition combining all components
  actions/
    <action-name>.yaml  # Individual action files
  personas/
    <persona-name>.yaml # Individual persona files
  providers.yaml       # Tool provider configurations
  README.md            # Migration notes
```

## Step 6: Validate Conversion

Check for completeness:

- [ ] All commands have corresponding actions
- [ ] All agents have corresponding personas
- [ ] All MCP servers have corresponding providers
- [ ] Environment variable syntax is converted (`${VAR}` to `{{env.VAR}}`)
- [ ] No AgentHaus-specific syntax remains in output files
- [ ] All file references are valid

## Known Limitations

These features require manual conversion:

1. **Hooks**: OpenClaw does not have a direct equivalent to PreToolUse/PostToolUse hooks. Convert to middleware or event handlers manually.
2. **Shell scripts**: Hook scripts need to be rewritten as OpenClaw middleware functions.
3. **Blackboard protocol**: Filesystem-based task handoff needs adaptation to OpenClaw's native task system.
4. **Plugin marketplace references**: Internal cross-plugin references need updating.
