---
description: List albums, folders, people, places, labels, and keywords in your Photos library. Usage: `/apple-photos:albums [albums|persons|places|labels|keywords]`
---
When invoked with "$ARGUMENTS" (optional subcommand), run the appropriate osxphotos listing command.

## Subcommands

Based on the argument, run one of:

| Argument | Command | Description |
|----------|---------|-------------|
| `albums` (default) | `osxphotos albums --json` | List all albums and folders |
| `persons` or `people` | `osxphotos persons --json` | List all recognized people/faces |
| `places` | `osxphotos places --json` | List all places with photo counts |
| `labels` | `osxphotos labels --json` | List machine-learning labels |
| `keywords` | `osxphotos keywords --json` | List all keywords/tags |
| `list` | `osxphotos list` | Quick summary of library contents |
| `orphans` | `osxphotos orphans` | Find orphaned assets |

If no argument is provided, default to `osxphotos albums --json`.

## Present Results

1. Parse JSON output where available.
2. Present results as a formatted markdown table or list.
3. Include counts (number of photos per album, per person, etc.) where available.
4. For albums, show the folder hierarchy if nested folders exist.

## Follow-up Suggestions

After listing, suggest relevant next steps:
- "Use `/apple-photos:query --album \"Album Name\"` to see photos in a specific album."
- "Use `/apple-photos:query --person \"Name\"` to find photos of a specific person."
- "Use `/apple-photos:export` to export a specific album or person's photos."
