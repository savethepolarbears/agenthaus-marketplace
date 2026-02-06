---
name: search
description: Search your Notion workspace for pages or database entries.
---
Use the `notion` MCP tools to find pages or database rows matching the user’s query.  Call the `search` tool with the provided arguments and return a concise list of results, including the title and URL of each page or entry.  If the search returns many items, summarize and highlight the most relevant ones.  Always respect the user’s workspace permissions.