# Apple Photos Plugin

## Overview

The **apple-photos** plugin brings Apple Photos library management to Claude Code using the [osxphotos](https://github.com/RhetTbull/osxphotos) CLI tool (v0.75.6+). It provides ten slash commands for querying, exporting, importing, backing up, and editing photo metadata, plus two specialist subagents and comprehensive skills for photo management and migration workflows.

### Features

* **Query and search** — Filter photos by person, keyword, album, place, date, EXIF data, duplicates, and more with `/apple-photos:query`.
* **Export and backup** — Export photos with embedded metadata and XMP sidecars using `/apple-photos:export`, or run incremental backups with `/apple-photos:backup`.
* **Import** — Import photos and videos into Apple Photos with metadata and album placement using `/apple-photos:import`.
* **Metadata editing** — Batch edit titles, captions, keywords, favorites, locations, and albums with `/apple-photos:metadata`.
* **Date and timezone fixing** — Correct timestamps, parse dates from filenames, and fix timezones with `/apple-photos:fix-dates`.
* **Location backfill** — Add missing GPS data from nearby photos with `/apple-photos:fix-locations`.
* **Duplicate detection** — Find possible duplicate photos with `/apple-photos:duplicates`.
* **Library exploration** — List albums, people, places, labels, and keywords with `/apple-photos:albums`.
* **Photo inspection** — View detailed metadata for any photo with `/apple-photos:info`.
* **Subagents** — `photo-librarian` for library auditing and organization, `migration-specialist` for importing/exporting with metadata preservation.
* **Safety hooks** — Write operations are logged to `apple_photos_audit.log` for audit trail.

### Prerequisites

* **macOS** with Photos.app
* **osxphotos** installed: `pip install osxphotos` or `uv tool install osxphotos`
* **macOS compatibility**: Tested on 10.12.6 through Sequoia 15.7.2. macOS 26.x is not fully supported; shared albums cannot be read and not all features work reliably. Test carefully with a small batch first.

### Installation

```bash
/plugin install apple-photos@AgentHaus
```

The plugin will be available under the `/apple-photos:` namespace.

### Usage Examples

```bash
# Query photos of a specific person
/apple-photos:query person "John Doe", keyword "vacation"

# Incremental backup to external drive
/apple-photos:backup /Volumes/PhotoBackup

# List all albums
/apple-photos:albums

# Find duplicate photos
/apple-photos:duplicates

# Fix timezones on travel photos
/apple-photos:fix-dates timezone "America/New_York", album "NYC Trip"

# Add missing GPS from nearby photos
/apple-photos:fix-locations window "2 hr"

# Inspect a specific photo
/apple-photos:info IMG_1234.jpg

# Batch add keywords
/apple-photos:metadata keyword "travel", album "Europe 2024"

# Export an album with metadata
/apple-photos:export /Volumes/Export, album "Best Of 2024"

# Import photos into an album
/apple-photos:import /path/to/photos, album "New Import"
```

### Safety

All write operations (export, import, metadata editing, date fixing, location fixing) run with `--dry-run` first and require explicit confirmation before executing. Write operations are logged to `apple_photos_audit.log`.

**Important warnings:**
* `push-exif` modifies original files and is not recommended for iCloud-managed libraries.
* Timezone setting uses an undocumented Apple Photos API — back up your library before bulk changes.
* macOS 26.x is not fully supported; shared albums cannot be read.
* Downloading missing iCloud originals is slow and experimental.

### Customization

Extend the plugin by adding commands in `commands/`, agents in `agents/`, or skills in `skills/`. Update the `commands`, `agents`, or `skills` arrays in `.claude-plugin/plugin.json` after adding files.
