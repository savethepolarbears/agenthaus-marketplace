---
description: Export photos from Apple Photos with flexible filtering and output options. Usage: `/apple-photos:export <destination> [options]`
---
When invoked with "$ARGUMENTS" (destination path and optional flags), build and execute an `osxphotos export` command.

## Parse Arguments

Extract from the user input:
- **Destination path** (required) — where to export files
- **Filters** — person, keyword, album, date range, label, or other criteria
- **Output structure** — date-based (`--export-by-date`), album-based (`--directory "{folder_album}"`), or flat
- **Metadata options** — embed with ExifTool (`--exiftool`), write sidecars (`--sidecar xmp`), or both
- **Incremental** — use `--update` for subsequent runs against the same destination
- **Other flags** — `--skip-edited`, `--skip-raw-jpeg`, `--download-missing`, `--convert-to-jpeg`, `--jpeg-quality`

## Build the Command

Construct the `osxphotos export` command from parsed arguments. Example:

```bash
osxphotos export /Volumes/Backup/Photos --export-by-date --exiftool --sidecar xmp --update --dry-run
```

## Safety Protocol

1. **Always run with `--dry-run` first.** Show the user the full command and the dry-run output.
2. Ask the user to confirm before running without `--dry-run`.
3. If `--download-missing` is requested, warn: "Downloading missing iCloud originals uses AppleScript and can be slow. The `--use-photokit` alternative is faster but marked as experimental."

## macOS Compatibility

- Warn if the user mentions macOS 26.x: "osxphotos does not fully support macOS 26.x. Shared albums cannot be read."
- osxphotos is tested on macOS 10.12.6 through macOS Sequoia 15.7.2.

## Present Results

After export completes, summarise:
- Number of photos/videos exported
- Destination path and folder structure used
- Any skipped or failed items
- Location of the export database (`.osxphotos_export.db`) for future `--update` runs
