# Notion Workspace Plugin

The **notion-workspace** plugin connects Claude to Notion, allowing you to search your workspace and create new pages or database entries without leaving the conversation.

## Platform Support

| Feature | Claude Code | Codex CLI | Gemini CLI | Cursor | Windsurf | Claude Desktop |
|---------|-------------|-----------|------------|--------|----------|----------------|
| Commands | full | partial | partial | partial | partial | n/a |
| Skills | full | full | full | full | full | n/a |
| MCP | full | none | full | full | partial | full |
| Hooks | n/a | n/a | n/a | n/a | n/a | n/a |

## Features

* **Search** – Use `/notion-workspace:search <query>` to find pages or database entries matching your query.  Claude will call the Notion MCP search API and return a list of results with titles and links.
* **Create pages** – Use `/notion-workspace:create-page` to create a new page or database entry.  Claude will prompt you for required fields (parent location, title, content) and then call the Notion API to create the record.
* **Secure integration** – Authentication is handled via the Notion MCP server.  Provide your Notion API key as the `NOTION_API_KEY` environment variable when starting Claude.

## Installation

```bash
/plugin install notion-workspace@AgentHaus
```

After installation, authorize the plugin with Notion (if prompted).  You can then use the `/notion-workspace:` namespace commands.
