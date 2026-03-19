---
description: Add missing GPS location data to photos using nearby photos as reference. Usage: `/apple-photos:fix-locations [--window "2 hr"]`
---
When invoked with "$ARGUMENTS" (optional time window and filters), run `osxphotos add-locations` to backfill missing GPS data.

## How It Works

`add-locations` finds photos without GPS coordinates and infers their location from nearby photos (within the specified time window) that do have GPS data. This is ideal when:
- Your iPhone had GPS but your camera did not
- Both devices were shooting at the same time and place

## Build the Command

```bash
osxphotos add-locations --window "2 hr" --verbose --dry-run
```

### Options
- `--window "N hr"` or `--window "N min"` — Time window for finding nearby photos with GPS (default: 2 hours)
- `--verbose` — Show detailed output for each photo
- `--dry-run` — Preview changes without applying them

### Scope Filters
- `--album "Album Name"` — Only process photos in a specific album
- `--from-date` / `--to-date` — Only process photos in a date range

## Safety Protocol

1. **Always run with `--dry-run` first.** Show which photos will receive location data and the source photo used for each.
2. Ask the user to review the proposed changes.
3. Run without `--dry-run` only after explicit confirmation.

## Present Results

Show a table of affected photos:

| Photo | Date | Location Source | GPS Coordinates |
|-------|------|----------------|-----------------|
| DSC_1234.jpg | 2024-06-15 14:30 | IMG_5678.jpg | 40.7128, -74.0060 |

After execution, summarise:
- Number of photos updated
- Number of photos skipped (no nearby GPS source found)
- Any errors
