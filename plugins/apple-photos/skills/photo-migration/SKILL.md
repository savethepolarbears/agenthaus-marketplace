---
name: photo-migration
description: Migrate photos in and out of Apple Photos with full metadata preservation using osxphotos. Use when the user asks about exporting their photo library, migrating to another photo manager, importing photos with metadata, or syncing between libraries.
---

# Photo Migration

Migrate photos into and out of Apple Photos with full metadata preservation using `osxphotos`.

## When to Use

- User wants to migrate out of Apple Photos to another DAM (PhotoPrism, Lightroom, etc.)
- User wants to import photos into Apple Photos from external sources
- User wants to back up their Photos library to a portable folder structure
- User wants to compare or sync two Photos libraries
- User asks about preserving metadata during photo transfers

## Migration Out of Apple Photos

### Full Library Export

Export everything with maximum metadata preservation:

```bash
osxphotos export /Volumes/Export \
  --directory "{folder_album}" \
  --exiftool \
  --sidecar xmp \
  --sidecar json \
  --update \
  --dry-run
```

**What each flag does:**
- `--directory "{folder_album}"` — Preserves album/folder hierarchy on disk
- `--exiftool` — Writes title, description, keywords, GPS, date into file EXIF/IPTC/XMP tags
- `--sidecar xmp` — Creates XMP sidecar for each file (readable by Lightroom, PhotoPrism, etc.)
- `--sidecar json` — Creates JSON sidecar with full osxphotos metadata (people, labels, UUIDs)
- `--update` — Enables incremental exports on subsequent runs

### Date-Based Export

For a flat, chronological archive:

```bash
osxphotos export /Volumes/Archive \
  --export-by-date \
  --exiftool \
  --sidecar xmp \
  --update
```

### Selective Export

Export specific subsets:

```bash
# Export one album
osxphotos export /destination --album "Vacation 2024" --exiftool --sidecar xmp

# Export one person's photos
osxphotos export /destination --person "Jane Doe" --exiftool --sidecar xmp

# Export by date range
osxphotos export /destination --from-date "2024-01-01" --to-date "2024-12-31" --exiftool
```

## Migration Into Apple Photos

### Basic Import

```bash
osxphotos import /path/to/photos \
  --album "Imported Photos" \
  --skip-duplicates \
  --dry-run
```

### Import with Metadata Restoration

If photos were previously exported with osxphotos:

```bash
osxphotos import /path/to/photos \
  --exportdb /path/to/.osxphotos_export.db \
  --skip-duplicates \
  --dry-run
```

The export database can restore: title, description, keywords, location, album placement, date/time, timezone, and favorites.

### Import with Sidecar Metadata

```bash
osxphotos import /path/to/photos \
  --sidecar \
  --exiftool \
  --skip-duplicates \
  --dry-run
```

## Library Comparison and Sync

### Compare Two Libraries

```bash
osxphotos compare --json /path/to/library1 /path/to/library2
```

Outputs differences in CSV, TSV, or JSON format for review before migration.

### Sync Metadata Between Libraries

```bash
osxphotos sync \
  --export /path/shared/computer1.db \
  --merge all \
  --import /path/shared/computer2.db
```

Syncs: keywords, albums, title, description, favorites, and location.

## Target DAM Guides

### PhotoPrism
1. Export with `--exiftool --sidecar xmp --sidecar json`
2. Copy exported folder to PhotoPrism's originals directory
3. Run PhotoPrism indexing — it reads EXIF, XMP, and Google JSON metadata automatically
4. PhotoPrism's Apple Photos migration guide recommends exporting unmodified originals + XMP sidecars

### Adobe Lightroom
1. Export with `--exiftool --sidecar xmp`
2. Import into Lightroom — it reads XMP sidecars natively
3. Keywords, titles, descriptions, and GPS data transfer automatically

### Google Photos
1. Export with `--exiftool` to embed all metadata into files
2. Upload to Google Photos — it reads embedded EXIF metadata
3. Note: album structure is not preserved; Google Photos auto-organizes by date

### Folder/NAS Backup
1. Use the backup workflow: `--export-by-date --update --exiftool --sidecar xmp`
2. rsync the destination folder to your NAS
3. Re-run periodically for incremental updates

## Important Caveats

### iCloud Libraries
- `--download-missing` forces Photos to download originals from iCloud via AppleScript. This is slow.
- `--use-photokit` is a faster alternative but marked "highly experimental alpha."
- `push-exif` modifies originals and is **not recommended** for iCloud-managed libraries — changes may not sync back.

### macOS 26.x
- osxphotos does not fully support macOS 26.x.
- Shared albums cannot be read on macOS 26.x.
- Test exports with a small batch before running a full migration.

### Write Operations
- Timezone setting on import uses an undocumented Photos API — small risk of database corruption.
- `push-exif` changes original files directly — back up the library first.
- Imports happen one photo at a time, creating separate import groups.

## Migration Checklist

1. [ ] Assess library size and metadata completeness
2. [ ] Choose export format (folder structure, metadata sidecars)
3. [ ] Run a test export with 10-20 photos
4. [ ] Verify metadata integrity on exported files (use ExifTool to spot-check)
5. [ ] Run full export with `--dry-run` first
6. [ ] Execute full export
7. [ ] Verify file counts match (source vs destination)
8. [ ] Import into target DAM and verify metadata transferred
9. [ ] Spot-check 5-10 photos for correct dates, locations, keywords, people
