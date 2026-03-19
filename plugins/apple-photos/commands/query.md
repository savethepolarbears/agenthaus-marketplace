---
description: Search and filter photos by person, keyword, album, place, date, or EXIF data. Usage: `/apple-photos:query <filters>`
---
When invoked with "$ARGUMENTS" (filter criteria), build and execute an `osxphotos query` command.

## Parse Arguments

Extract filter criteria from the user input. Supported filters:

- `--person "Name"` — filter by person/face (repeatable; multiple = OR)
- `--keyword "tag"` — filter by keyword (repeatable; multiple = OR)
- `--album "Album Name"` — filter by album (repeatable; multiple = OR)
- `--place "Place"` — filter by place name
- `--from-date "YYYY-MM-DD"` — photos on or after this date
- `--to-date "YYYY-MM-DD"` — photos on or before this date
- `--label "label"` — filter by machine-learning label
- `--uti "public.image"` — filter by Uniform Type Identifier
- `--favorite` — only favorites
- `--hidden` — only hidden photos
- `--has-raw` — only RAW photos
- `--duplicate` — only possible duplicates
- `--not-in-album` — photos not in any album
- `--missing` — photos missing from disk

**Filter logic:** Repeated same-field filters are combined with OR. Different filters are combined with AND.

## Build the Command

Always include `--json` for structured output. Example:

```bash
osxphotos query --person "John" --person "Jane" --keyword "vacation" --json
```

## Present Results

1. Parse the JSON output from osxphotos.
2. Present results in a readable markdown table with columns: Filename, Date, Dimensions, Album(s), Keywords, Person(s), Location.
3. Show total count of matching photos.
4. If more than 50 results, show the first 20 and note the total count.
5. Suggest follow-up actions: export, inspect, batch-edit, or refine the query.
