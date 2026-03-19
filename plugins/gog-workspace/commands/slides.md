---
description: Create and manage Google Slides presentations. Usage: `/gog-workspace:slides create "Presentation Title"` or `/gog-workspace:slides list <presentation_id>`
---

Given "$ARGUMENTS" as user input, execute Google Slides operations using the `gog` CLI.

## Supported Operations

### Read
- **List slides**: `gog slides list <presentation_id>`
- **Read slide**: `gog slides read <presentation_id> --slide <number>`
- **Get metadata**: `gog slides info <presentation_id>`

### Create
- **Create presentation**: `gog slides create '<title>'`
- **Create from markdown**: `gog slides create --file <path.md>`
- **Create from template**: `gog slides create --template <template_id> --title '<title>'`
- **Add slide**: `gog slides add <presentation_id> --layout '<layout>'`

### Export
- **Export as PDF**: `gog slides export <presentation_id> --format pdf --out <path>`
- **Export as PPTX**: `gog slides export <presentation_id> --format pptx --out <path>`
- **Export slide as PNG**: `gog slides export <presentation_id> --slide <n> --format png --out <path>`

## Instructions

1. Parse the user's intent from `$ARGUMENTS`
2. For markdown-to-slides, verify the file exists and is properly formatted
3. Use `--json` for structured output
4. Present slide summaries with titles and content previews
