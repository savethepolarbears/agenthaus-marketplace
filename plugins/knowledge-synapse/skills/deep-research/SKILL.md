---
name: deep-research
description: Synthesize comprehensive research by combining official library documentation, internal knowledge bases, and note storage. Use when researching a software library, API, framework, or technical concept that benefits from cross-referencing official docs with internal documents. Covers Context7 doc lookup, Google Drive internal search, and Notion research note creation.
---

# Deep Research

Combine official documentation with internal knowledge to produce comprehensive, source-attributed research summaries.

## Workflow

### Step 1: Resolve Official Documentation

Query the Context7 MCP server to find canonical docs for the target library or API:

1. Call `resolve-library-id` with the library name to get the Context7 ID
2. Call `query-docs` with that ID and the specific topic or function

If Context7 is unavailable, fall back to web search or `WebFetch` on the library's official documentation site.

### Step 2: Search Internal Knowledge

Query Google Drive for internal design documents, meeting notes, or RFCs related to the topic:

1. Search with the library name and relevant keywords
2. Summarize the most relevant results with their URLs

If Google Drive is unavailable, skip this step and note that only official sources were consulted.

### Step 3: Synthesize and Attribute

Combine findings into a structured summary. **Always clearly delineate**:

- **Official sources**: Documentation, changelogs, API references
- **Internal sources**: Design docs, meeting notes, prior decisions

### Step 4: Persist to Notion (Optional)

If Notion is available, create a page under the "Research Notes" database:

- Title: `{Library Name} — Research {YYYY-MM-DD}`
- Body: The synthesized summary with source links

If Notion is unavailable, output the summary directly.

## Quick Reference

| Step | MCP Tool | Fallback |
|------|----------|----------|
| Resolve docs | `context7:resolve-library-id` | Web search |
| Query docs | `context7:query-docs` | `WebFetch` on official docs |
| Internal search | `google-drive:search` | Skip, note limitation |
| Save notes | `notion:create_page` | Output to conversation |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Mixing official and internal info without attribution | Always label each finding with its source type |
| Failing silently when an MCP tool is unavailable | Use the fallback strategy; inform the user which sources were consulted |
| Creating a Notion page with a vague title | Include the library name and date in the title |
| Querying Context7 with vague terms like "auth" | Use specific library names and function/concept names |
| Not checking for existing research notes before creating duplicates | Search Notion first for prior notes on the same topic |
