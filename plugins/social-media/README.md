# Social Media Plugin

## Platform Support

| Feature | Claude Code | Codex CLI | Gemini CLI | Cursor | Windsurf | Claude Desktop |
|---------|-------------|-----------|------------|--------|----------|----------------|
| Commands/Agents | full | partial | partial | partial | partial | n/a |
| Skills | full | full | full | full | full | n/a |
| MCP | n/a | n/a | n/a | n/a | n/a | n/a |
| Hooks | full | none | none | none | none | n/a |

## Overview

The **social‑media** plugin equips Claude with everything needed to craft compelling posts across major platforms.  It provides platform‑specific slash commands for Twitter, LinkedIn, Instagram and Facebook, a trend‑analysis command, two specialist subagents, and a logging hook.

### Features

* **Platform‑specific commands** – Generate tailored posts for each network.  Commands include `/social-media:tweet`, `/social-media:linkedin`, `/social-media:instagram`, `/social-media:facebook` and `/social-media:analyze-trend`.  Each command accepts a topic (and optionally a tone) and returns a ready‑to‑post message.
* **Subagents** – Two subagents are included: `content-writer`, which writes polished posts, and `trend-analyzer`, which researches current trends and proposes strategies.
* **Logging hook** – After any social‑media command executes, the plugin appends the output to `social_audit.log` in your project directory.  This makes it easy to audit or reuse generated content later.

### Installation

Add the plugin from AgentHaus via the `/plugin` command:

```bash
/plugin install social-media@AgentHaus
```

The plugin will be available under the `/social-media:` namespace.  Use `/help` to view the available commands.

### Usage Examples

```bash
/social-media:tweet AI breakthroughs, witty
/social-media:linkedin Sustainability best practices, professional
/social-media:instagram Weekend getaway ideas, inspirational
/social-media:facebook Community gardening tips
/social-media:analyze-trend Renewable energy adoption
```

### Customization

You can extend the plugin by adding additional commands (for example, `/social-media:threads` for Meta Threads), tweaking the agent prompts, or creating new hooks.  To add a new command, place a markdown file in the `commands/` directory and update the `commands` array in `.claude-plugin/plugin.json`.
