---
description: Find possible duplicate photos in your Photos library. Usage: `/apple-photos:duplicates`
---
When invoked, run `osxphotos query --duplicate --json` to find possible duplicate photos.

## How Duplicates Are Detected

osxphotos compares photo signatures based on: date created, file size, height, width, and edited status. Photos with matching signatures are flagged as possible duplicates.

## Build the Command

```bash
osxphotos query --duplicate --json
```

To narrow the search:
- `--album "Album Name"` — Search within a specific album
- `--from-date` / `--to-date` — Search within a date range
- `--person "Name"` — Search within a specific person's photos

## Present Results

1. Parse the JSON output and group photos by duplicate sets.
2. For each duplicate group, show a comparison table:

| # | Filename | Date | Dimensions | Size | Albums | Keywords |
|---|----------|------|------------|------|--------|----------|
| 1 | IMG_1234.jpg | 2024-06-15 | 4032x3024 | 3.2 MB | Vacation | beach |
| 2 | IMG_1234 (1).jpg | 2024-06-15 | 4032x3024 | 3.2 MB | — | — |

3. Show total number of duplicate groups and total duplicate count.

## Suggested Next Steps

After showing duplicates, suggest:
- "Review each group manually in Photos.app to decide which to keep."
- "Use `/apple-photos:metadata` to mark duplicates with a keyword for later cleanup."
- "Use `/apple-photos:export` with `--duplicate` to export one copy of each for comparison."
- Note: osxphotos can detect duplicates but does not delete them — deletion must be done in Photos.app.
