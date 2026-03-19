---
description: Compile a plugin manifest into cross-platform formats (MCP, Gemini Extensions, OpenAI Actions). Reads plugin.json as the Universal Source of Truth and generates target-specific output.
---

# /marketplace-cli:compile

Compile an AgentHaus plugin into cross-platform agent formats.

## Usage

```
/marketplace-cli:compile <plugin-directory> [--target mcp|gemini|openai|all]
```

## Behavior

1. **Read** the plugin's `.claude-plugin/plugin.json` and `.mcp.json` (if present)
2. **Validate** against `schemas/plugin.schema.json`
3. **Generate** target format(s) into `<plugin-directory>/dist/`:
   - `mcp-manifest.json` — MCP Tools, Resources, and Prompts manifest
   - `gemini-extension.yaml` — OpenAPI 3.1 spec for Gemini Extensions
   - `openai-actions.json` — OpenAI Custom Actions format

## Target Formats

### MCP Manifest (`--target mcp`)
Extracts `mcpServers` configuration and `capabilities_manifest` into a standalone MCP-compliant manifest.

### Gemini Extension (`--target gemini`)
Generates an OpenAPI 3.1 YAML from plugin commands. Each command becomes an API operation with:
- Operation ID from command filename
- Description from YAML frontmatter
- Request/response schemas inferred from command content

### OpenAI Actions (`--target openai`)
Generates OpenAI Custom Actions JSON (subset of OpenAPI 3.1) compatible with GPT Actions.

## Examples

```bash
# Compile all formats for the github-integration plugin
/marketplace-cli:compile plugins/github-integration --target all

# Generate only the MCP manifest
/marketplace-cli:compile plugins/cloudflare-platform --target mcp
```

## Requirements

- Plugin must have a valid `.claude-plugin/plugin.json`
- For Gemini/OpenAI targets, plugin should have commands with clear input/output descriptions

## Notes

This is a documentation-generation command — it does not deploy or register anything. The generated files are for use with external agent frameworks.
