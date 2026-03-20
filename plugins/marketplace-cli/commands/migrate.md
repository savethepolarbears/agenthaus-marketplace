---
name: migrate
description: Convert an AgentHaus plugin to OpenClaw skill format
---

When the user runs `/marketplace:migrate <plugin-path> [output-path]`, convert the specified AgentHaus plugin to OpenClaw format:

1. Read the plugin's `.claude-plugin/plugin.json` manifest
2. If the `openclaw-bridge` plugin is installed, delegate to its `/openclaw-bridge:migrate` command
3. Otherwise, perform a basic conversion:
   - Map each command to an OpenClaw action definition
   - Map each agent to an OpenClaw persona
   - Map MCP server configs to OpenClaw tool provider entries
   - Generate the output as a single OpenClaw skill YAML file
4. Write the result to `<output-path>` or `./openclaw-export/` by default
5. Report what was converted and any capabilities that require manual migration
