---
description: Run an incremental backup of your Photos library to a folder with full metadata. Usage: `/apple-photos:backup <destination>`
---
When invoked with "$ARGUMENTS" (destination path), run an opinionated incremental backup of the Apple Photos library.

## Backup Strategy

This command uses a proven backup workflow:

```bash
osxphotos export <destination> \
  --export-by-date \
  --update \
  --exiftool \
  --sidecar xmp \
  --skip-raw-jpeg \
  --dry-run
```

**What this does:**
- `--export-by-date` — Organizes exports into `YYYY/MM/DD/` folder structure
- `--update` — Only exports new or changed photos since last run (uses `.osxphotos_export.db`)
- `--exiftool` — Writes Photos metadata directly into exported file EXIF/IPTC/XMP tags
- `--sidecar xmp` — Creates XMP sidecar files alongside each photo for maximum metadata portability
- `--skip-raw-jpeg` — Skips the JPEG when a RAW+JPEG pair exists (exports only the RAW)

## Execution Flow

1. **Show the command** with `--dry-run` and present the planned backup summary.
2. **Ask for confirmation** before running the actual backup.
3. **Run the backup** without `--dry-run`.
4. **Report results**: number of files exported, skipped, and any errors.

## First Run vs Subsequent Runs

- **First run**: All photos are exported. An `.osxphotos_export.db` database is created at the destination.
- **Subsequent runs**: Only new or modified photos are exported. Previously exported files are skipped.

## Tips

- Run this command periodically (weekly/monthly) to maintain an up-to-date backup.
- The backup destination can be a local drive, NAS, or any mounted volume.
- The exported folder tree is a normal directory structure — you can browse it, rsync it, or feed it into another DAM.
- To also clean up files that were deleted from Photos, add `--cleanup` to remove orphaned exports.
