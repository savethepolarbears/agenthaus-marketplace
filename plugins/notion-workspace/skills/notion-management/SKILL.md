---
name: notion-management
description: Search, read, create, and update Notion pages and databases through the Notion MCP server. Use when the user asks to find information in Notion, create new pages or database entries, update existing content, or organize their Notion workspace programmatically.
---

# Notion Workspace Management

Search, create, and manage Notion pages and databases for knowledge management and documentation.

## When to Use

- User asks to search for content in their Notion workspace
- User wants to create a new Notion page or database entry
- User needs to update existing Notion content
- User asks to query or filter a Notion database
- User wants to organize or restructure Notion pages
- User needs to export or reference Notion content in their code

## Prerequisites

- `NOTION_API_KEY` environment variable must be set
- Notion MCP server (`@modelcontextprotocol/server-notion`) must be available
- Notion integration must have access to the relevant pages/databases

## Steps

### 1. Search Content

When searching Notion:

1. Accept search terms from the user
2. Use the `notion` MCP tools to search across pages and databases
3. Present results with: title, type (page/database), last edited date, parent
4. Offer to open or display the content of matching results

```markdown
### Search Results for "project roadmap"

| Title | Type | Last Edited | Parent |
|-------|------|-------------|--------|
| Q2 Project Roadmap | Page | 2026-03-14 | Engineering |
| Roadmap Database | Database | 2026-03-10 | Product |
```

### 2. Create Pages

When creating new content:

1. **Gather details**: Title, parent page/database, content
2. **Format content**: Convert the user's input to Notion block format
3. **Create the page**: Use `notion` MCP tools to create
4. **Confirm**: Return the page title and URL

#### Content Formatting

Support these Notion block types:
- Headings (H1, H2, H3)
- Paragraphs with rich text (bold, italic, code)
- Bulleted and numbered lists
- Code blocks with language syntax
- To-do checkboxes
- Callout blocks
- Dividers

### 3. Update Pages

When modifying existing content:

1. Find the page by title or ID
2. Show the current content for confirmation
3. Apply the requested changes
4. Confirm the update was successful

### 4. Database Operations

When working with Notion databases:

1. **Query**: Filter and sort database entries by properties
2. **Create entry**: Add new items with the correct property schema
3. **Update entry**: Modify properties on existing entries
4. **Aggregate**: Summarize database contents (counts, groupings)

### 5. Knowledge Integration

When integrating Notion with development workflows:

1. Reference Notion documentation in code comments
2. Create Notion pages from code documentation
3. Sync project status between code and Notion
4. Pull requirements or specifications from Notion into development tasks

## Output Format

Present Notion content in clean markdown that mirrors the page structure. Include the page URL for reference.

## Error Handling

- API key invalid: Verify `NOTION_API_KEY` and integration permissions
- Page not found: Check if the integration has access to the page
- Rate limited: Back off and retry after the indicated interval
- Schema mismatch: Report which properties don't match the database schema
