---
description: Import photos and videos into Apple Photos with metadata and album placement. Usage: `/apple-photos:import <path> [--album "Name"]`
---
When invoked with "$ARGUMENTS" (file/directory path and options), build and execute an `osxphotos import` command.

## Parse Arguments

Extract from the user input:
- **Source path** (required) — file or directory to import
- **Album** — `--album "Album Name"` to place imported items into an album
- **Duplicate handling** — `--skip-duplicates` to avoid re-importing existing photos
- **Metadata sources** — `--sidecar` to read XMP/JSON sidecars, `--exiftool` to read embedded metadata
- **Export database** — `--exportdb <path>` to restore metadata from a previous osxphotos export
- **Resume** — `--resume` to continue an interrupted import

## Build the Command

Example:

```bash
osxphotos import /path/to/photos --album "Vacation 2025" --skip-duplicates --dry-run
```

## Safety Protocol

1. **Always run with `--dry-run` first.** Show the user the planned imports.
2. Ask the user to confirm before running without `--dry-run`.
3. Warn: "Imports happen one photo at a time. Each photo creates a separate import group in the Imports album."

## Warnings

- **macOS 26.x**: "osxphotos does not fully support macOS 26.x. Test with a small batch first."
- **Timezone**: "If using `--exportdb` to restore timezone data, note that the timezone API is undocumented and may corrupt the Photos database in rare cases. Back up your library first."
- **AAE edits**: "If `.AAE` adjustment files are present alongside photos, osxphotos will attempt to preserve non-destructive edits."

## Present Results

After import completes, summarise:
- Number of photos/videos imported
- Album placement
- Any skipped duplicates
- Any failures or warnings
