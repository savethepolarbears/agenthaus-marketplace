---
name: create-page
description: Create a new page or database entry in Notion.
---
When the user invokes this command, prompt for the necessary details: parent page or database ID, title, content, and optional properties such as tags or status.  Use the `notion` MCP tool to create the page or entry.  Confirm success and return the URL of the new page.  If the target is a database, ensure the required fields are provided.