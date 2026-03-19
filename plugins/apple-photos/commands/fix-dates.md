---
description: Fix incorrect timestamps, dates, or timezones on photos using osxphotos timewarp. Usage: `/apple-photos:fix-dates <options>`
---
When invoked with "$ARGUMENTS" (date/time correction options), build and execute an `osxphotos timewarp` command.

## Parse Arguments

Extract the correction type from user input:

### Timezone Correction
```bash
osxphotos timewarp --timezone "America/New_York" --match-time --album "Travel/NYC" --dry-run
```
- `--timezone "TZ"` — Set the timezone (IANA format)
- `--match-time` — Adjust the time to match the new timezone (keeps the displayed time the same)

### Parse Date from Filename
```bash
osxphotos timewarp --parse-date "IMG_%Y%m%d_%H%M%S" --album "Old Imports" --dry-run
```
- `--parse-date "pattern"` — Extract date/time from the filename using strftime format

### Set Specific Date
```bash
osxphotos timewarp --date "2024-06-15" --time "14:30:00" --album "Scanned Photos" --dry-run
```
- `--date "YYYY-MM-DD"` — Set the date
- `--time "HH:MM:SS"` — Set the time

### Shift Date/Time
```bash
osxphotos timewarp --date-delta "+1 day" --album "Wrong Dates" --dry-run
```
- `--date-delta` — Shift dates by a relative amount

## Scope Filters

Always scope the operation to specific photos using:
- `--album "Album Name"` — Target a specific album
- `--keyword "tag"` — Target photos with a specific keyword
- `--from-date` / `--to-date` — Target a date range

## Safety Protocol

1. **Always run with `--dry-run` first.** Show which photos will be affected and what changes will be made.
2. **Warn the user**: "The timezone setting uses an undocumented Apple Photos API. While it works reliably in most cases, there is a small risk of database corruption. Back up your Photos library before proceeding."
3. Ask for explicit confirmation before running without `--dry-run`.
4. Recommend running on a small batch first to verify correctness.

## Present Results

After execution, summarise:
- Number of photos updated
- Before/after dates for a sample of affected photos
- Any errors or skipped items
