---
name: photo-management
description: Manage Apple Photos libraries using osxphotos CLI — querying, exporting, organizing, fixing metadata, finding duplicates, and performing backups. Use when the user asks about Apple Photos, photo management, photo metadata, photo backup, or photo organization on macOS.
---

# Apple Photos Management

Manage Apple Photos libraries using the `osxphotos` CLI tool (v0.75.6+).

## When to Use

- User asks about Apple Photos or Photos.app on macOS
- User wants to search, filter, or query their photo library
- User wants to export or back up photos
- User needs to fix photo metadata (dates, locations, keywords, titles)
- User wants to find duplicate photos
- User asks about organizing their photo library
- User wants to audit their library (albums, people, places, tags)

## Prerequisites

- **macOS** with Photos.app installed
- **osxphotos** installed via `pip install osxphotos` or `uv tool install osxphotos`
- **macOS compatibility**: Tested on 10.12.6 through Sequoia 15.7.2. macOS 26.x is not fully supported — shared albums cannot be read.

To check if osxphotos is installed:
```bash
osxphotos --version
```

## Core Workflows

### 1. Query Photos

Search and filter the Photos library:

```bash
# By person (multiple = OR)
osxphotos query --person "John" --person "Jane" --json

# By keyword and date range (different filters = AND)
osxphotos query --keyword "vacation" --from-date "2024-06-01" --to-date "2024-06-30" --json

# By album
osxphotos query --album "Summer 2024" --json

# Favorites only
osxphotos query --favorite --json

# Find duplicates
osxphotos query --duplicate --json

# Photos not in any album
osxphotos query --not-in-album --json
```

### 2. Export Photos

Export with metadata preservation:

```bash
# Basic export with embedded metadata and sidecars
osxphotos export /destination --exiftool --sidecar xmp --dry-run

# Date-based folder structure
osxphotos export /destination --export-by-date --dry-run

# Preserve album/folder hierarchy
osxphotos export /destination --directory "{folder_album}" --dry-run

# Incremental export (only new/changed since last run)
osxphotos export /destination --update --dry-run
```

### 3. Incremental Backup

The recommended backup workflow:

```bash
osxphotos export /Volumes/Backup/Photos \
  --export-by-date \
  --update \
  --exiftool \
  --sidecar xmp \
  --skip-raw-jpeg
```

Run periodically. The `--update` flag uses `.osxphotos_export.db` to export only new or changed items.

### 4. Fix Dates and Timezones

```bash
# Set timezone
osxphotos timewarp --timezone "America/New_York" --match-time --album "Travel" --dry-run

# Parse date from filename
osxphotos timewarp --parse-date "IMG_%Y%m%d_%H%M%S" --album "Old Imports" --dry-run
```

### 5. Fix Missing Locations

```bash
# Backfill GPS from nearby photos within 2-hour window
osxphotos add-locations --window "2 hr" --verbose --dry-run
```

### 6. Batch Edit Metadata

```bash
# Add keywords
osxphotos batch-edit --keyword "travel" --album "Europe Trip" --dry-run

# Set title
osxphotos batch-edit --title "Beach Day" --album "Vacation" --dry-run

# Add to album
osxphotos batch-edit --add-to-album "Best Of" --favorite --dry-run
```

### 7. Library Exploration

```bash
osxphotos albums --json     # List albums
osxphotos persons --json    # List people
osxphotos places --json     # List places
osxphotos labels --json     # List ML labels
osxphotos keywords --json   # List keywords
osxphotos list              # Quick library summary
osxphotos orphans           # Find orphaned assets
```

## Safety Rules

1. **Always use `--dry-run` first** for write operations (export, import, batch-edit, timewarp, add-locations).
2. **Scope write operations** — always use filters (album, date range, keyword) to target specific photos. Never modify the entire library at once.
3. **iCloud libraries**: Do not use `push-exif` on iCloud-managed libraries. Changes may not sync back and could cause conflicts.
4. **Back up before writes**: Especially before `push-exif`, `timewarp`, or bulk `batch-edit` operations.
5. **macOS 26.x**: Not fully supported. Shared albums cannot be read. Test carefully.
6. **Undocumented APIs**: Timezone setting on import uses an undocumented Photos API — small risk of database corruption.

## Template Variables

osxphotos supports template variables for custom directory and filename structures:

| Variable | Description |
|----------|-------------|
| `{folder_album}` | Photos folder/album hierarchy |
| `{created.year}` | Year photo was taken |
| `{created.month}` | Month (01-12) |
| `{created.day}` | Day (01-31) |
| `{person}` | Person name(s) |
| `{keyword}` | Keyword(s) |
| `{place.name}` | Place name |
| `{title}` | Photo title |
| `{original_name}` | Original filename |

Example: `--directory "{created.year}/{created.month}" --filename "{original_name}"`

## Output Format

- Use `--json` for structured output on query, albums, persons, places, labels, keywords.
- Present results in markdown tables for readability.
- For large result sets, show the first 20 items and note the total count.
