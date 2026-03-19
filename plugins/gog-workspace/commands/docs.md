---
description: Create, read, and export Google Docs. Usage: `/gog-workspace:docs create "My Document"` or `/gog-workspace:docs export <doc_id> --format pdf`
---

Given "$ARGUMENTS" as user input, execute Google Docs operations using the `gog` CLI.

## Supported Operations

### Read & List
- **Read document**: `gog docs read <doc_id>`
- **Read as markdown**: `gog docs read <doc_id> --markdown`
- **List tabs**: `gog docs tabs <doc_id>`

### Create & Import
- **Create empty doc**: `gog docs create '<title>'`
- **Import from markdown**: `gog docs create --file <path.md>`
- **Import with images**: `gog docs create --file <path.md>` (inline images auto-uploaded)

### Export
- **Export as PDF**: `gog docs export <doc_id> --format pdf --out <path>`
- **Export as DOCX**: `gog docs export <doc_id> --format docx --out <path>`
- **Export as Markdown**: `gog docs export <doc_id> --format md --out <path>`
- **Export as plain text**: `gog docs export <doc_id> --format txt --out <path>`

### Comments
- **List comments**: `gog docs comments <doc_id>`
- **Add comment**: `gog docs comment <doc_id> '<text>'`
- **Reply to comment**: `gog docs comment reply <comment_id> '<text>'`
- **Resolve comment**: `gog docs comment resolve <comment_id>`

## Instructions

1. Parse the user's intent from `$ARGUMENTS`
2. Use `--json` for structured output
3. When creating from markdown, verify the file exists first
4. For exports, suggest appropriate file extensions based on format
