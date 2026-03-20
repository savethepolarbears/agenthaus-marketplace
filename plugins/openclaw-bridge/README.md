# OpenClaw Bridge

Convert AgentHaus plugins to OpenClaw skill format and send commands to remote OpenClaw instances. Enables interoperability between the two agent platforms.

## Platform Support

| Feature | Claude Code | Codex CLI | Gemini CLI | Cursor | Windsurf | Claude Desktop |
|---------|-------------|-----------|------------|--------|----------|----------------|
| Commands | full | partial | partial | partial | partial | n/a |
| Skills | full | full | full | full | full | n/a |
| MCP | n/a | n/a | n/a | n/a | n/a | n/a |
| Hooks | n/a | n/a | n/a | n/a | n/a | n/a |

## Prerequisites

| Variable | Description | Required For |
|----------|-------------|--------------|
| `OPENCLAW_API_KEY` | API key for remote OpenClaw instance | `/remote` command only |

No environment variables are needed for the `/migrate` command.

## Installation

```bash
/plugin install openclaw-bridge
```

## Usage

### Migrate a Plugin

```
/migrate plugins/social-media
/migrate ./path/to/any-plugin
```

Reads the AgentHaus plugin structure and generates an OpenClaw-compatible skill definition in `openclaw-output/<plugin-name>/`.

The conversion maps:
- Commands to OpenClaw actions
- Agents to OpenClaw personas
- MCP servers to OpenClaw tool providers
- Environment variable syntax (`${VAR}` to `{{env.VAR}}`)

### Send Remote Command

```
/remote https://openclaw.example.com run skill greeting --name "World"
/remote https://openclaw.local:8080 list skills
```

Sends a command to a remote OpenClaw instance via its REST API. Requires `OPENCLAW_API_KEY` to be set.

## Architecture

```
commands/
  migrate.md              # Plugin format conversion command
  remote.md               # Remote OpenClaw execution command
skills/
  conversion/
    SKILL.md              # Step-by-step conversion workflow
```

### Conversion Mapping

| AgentHaus | OpenClaw |
|-----------|----------|
| `.claude-plugin/plugin.json` | `skill.yaml` |
| `commands/*.md` | `actions/*.yaml` |
| `agents/*.md` | `personas/*.yaml` |
| `.mcp.json` | `providers.yaml` |
| `$ARGUMENTS` | `{{args}}` |
| `${ENV_VAR}` | `{{env.ENV_VAR}}` |

### Output Structure

```
openclaw-output/<plugin-name>/
  skill.yaml             # Main skill definition
  actions/               # Individual action files
  personas/              # Persona definitions
  providers.yaml         # Tool provider configs
  README.md              # Migration notes and manual steps
```

### Known Limitations

- **Hooks**: No direct OpenClaw equivalent. Require manual conversion to middleware.
- **Shell scripts**: Must be rewritten as OpenClaw middleware functions.
- **Blackboard protocol**: Filesystem-based task system needs adaptation.
- **Cross-plugin references**: Internal references need manual updating.
