---
name: migrate
description: Convert an AgentHaus plugin to OpenClaw skill format
---

You are converting an AgentHaus plugin to the OpenClaw skill format.

Take $ARGUMENTS as the path to the AgentHaus plugin directory. If not provided, ask for the plugin path.

Follow these conversion steps:

1. **Read source plugin**: Parse `.claude-plugin/plugin.json` to extract:
   - Plugin name, version, description
   - Commands list
   - Agents list
   - Skills list
   - MCP server configurations from `.mcp.json`

2. **Map commands to OpenClaw actions**: For each command markdown file:
   - Extract the YAML frontmatter (name, description)
   - Convert the instruction body to an OpenClaw action definition
   - Map `$ARGUMENTS` references to OpenClaw input parameters
   - Generate the action schema:
   ```yaml
   actions:
     - name: <command-name>
       description: <command-description>
       inputs:
         - name: args
           type: string
           required: false
       instructions: |
         <converted instructions>
   ```

3. **Map agents to OpenClaw personas**: For each agent markdown file:
   - Extract name, description, model from frontmatter
   - Convert the system prompt to an OpenClaw persona definition
   - Map the model field to OpenClaw model references

4. **Map MCP servers to OpenClaw tool providers**: For each MCP server in `.mcp.json`:
   - Convert to OpenClaw tool provider format
   - Preserve environment variable references
   - Map the command/args structure to OpenClaw's provider config

5. **Generate output files**: Write to `openclaw-output/<plugin-name>/`:
   - `skill.yaml` -- Main OpenClaw skill definition
   - `actions/` -- Individual action files
   - `personas/` -- Persona definitions
   - `providers.yaml` -- Tool provider configurations
   - `README.md` -- Migration notes and manual steps needed

6. **Validate**: Check the generated output for completeness and list any features that could not be automatically converted (require manual intervention).

7. **Report**:
```
=== MIGRATION REPORT ===
Source: {plugin-name} v{version} (AgentHaus)
Target: OpenClaw skill format

Converted:
  - {n} commands -> {n} actions
  - {n} agents -> {n} personas
  - {n} MCP servers -> {n} tool providers

Manual steps required:
  - {list of items needing manual attention}

Output: openclaw-output/{plugin-name}/
```
