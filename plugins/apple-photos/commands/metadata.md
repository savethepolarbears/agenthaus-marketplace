---
description: Batch edit photo metadata — titles, captions, keywords, favorites, locations, and albums. Usage: `/apple-photos:metadata <operation> [options]`
---
When invoked with "$ARGUMENTS" (operation and options), build and execute an `osxphotos batch-edit` command.

## Parse Arguments

Extract the operation type and scope:

### Set Title
```bash
osxphotos batch-edit --title "Beach Day" --album "Vacation" --dry-run
```

### Set Description/Caption
```bash
osxphotos batch-edit --description "Family trip to the coast" --keyword "vacation" --dry-run
```

### Add Keywords
```bash
osxphotos batch-edit --keyword "travel" --keyword "summer" --album "Europe Trip" --dry-run
```

### Set Favorite
```bash
osxphotos batch-edit --set-favorite --person "John" --from-date "2024-06-01" --dry-run
```

### Add to Album
```bash
osxphotos batch-edit --add-to-album "Best Of 2024" --favorite --dry-run
```

### Set Location
```bash
osxphotos batch-edit --location 40.7128 -74.0060 --album "NYC Trip" --dry-run
```

## Scope Filters

Always require at least one scope filter to prevent accidental bulk edits:
- `--album "Name"` — Target a specific album
- `--keyword "tag"` — Target photos with a keyword
- `--person "Name"` — Target a person's photos
- `--from-date` / `--to-date` — Target a date range
- `--favorite` — Target favorites only
- `--query-eval "expression"` — Custom Python filter expression

If no scope filter is provided, ask the user to specify one.

## Safety Protocol

1. **Always run with `--dry-run` first.** Show the number of affected photos and a sample of changes.
2. **Require explicit confirmation** before running without `--dry-run`.
3. Warn if the operation affects more than 100 photos: "This will modify [N] photos. Are you sure?"

## Present Results

After execution, summarise:
- Number of photos updated
- What metadata was changed
- Any errors or skipped items
