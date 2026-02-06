---
name: issue
description: Create or search GitHub issues. Usage: `/github-integration:issue <search query | issue title>`
---
If the argument appears to be a search query (contains multiple words or question marks), use the `github` MCP tools to search issues in the current repository and summarize the matching issues.  If the argument looks like a title for a new issue, ask the user for additional details (such as body text and labels) and then call the `github` MCP tool to create the issue.  Always confirm the repository context before creating an issue.