---
description: Inspect detailed metadata for a specific photo or selection of photos. Usage: `/apple-photos:info <filename or filter>`
---
When invoked with "$ARGUMENTS" (filename, UUID, or filter criteria), retrieve and display detailed metadata.

## Parse Arguments

Determine the lookup method:
- **By filename**: `osxphotos query --name "IMG_1234.jpg" --json`
- **By UUID**: `osxphotos query --uuid "ABCD-1234-..." --json`
- **By filter**: Use standard query filters (`--album`, `--person`, `--keyword`, etc.) with `--json`
- **Interactive**: If no argument, suggest using `osxphotos inspect` which shows metadata for the currently selected photo in Photos.app

## Build the Command

```bash
osxphotos query --name "IMG_1234.jpg" --json
```

For interactive inspection of the selected photo:
```bash
osxphotos inspect
```

## Present Results

Parse the JSON output and present a structured metadata view:

### Photo Details
- **Filename**: IMG_1234.jpg
- **UUID**: ABCD-1234-EFGH-5678
- **Date**: 2024-06-15 14:30:00 -0400
- **Dimensions**: 4032 x 3024
- **File Size**: 3.2 MB
- **Type**: JPEG (public.jpeg)
- **Edited**: Yes/No

### Location
- **Coordinates**: 40.7128, -74.0060
- **Place**: New York, NY, USA

### People & Tags
- **Persons**: John Doe, Jane Doe
- **Keywords**: vacation, beach, summer
- **Labels**: beach, water, sky, outdoor
- **Albums**: Summer 2024, Favorites

### EXIF Data
- **Camera**: iPhone 15 Pro
- **Lens**: 6.765mm f/1.78
- **ISO**: 50
- **Shutter**: 1/1000s
- **Aperture**: f/1.78

### File Paths
- **Original**: /path/to/original
- **Edited**: /path/to/edited (if applicable)

If multiple photos match, show a summary table first and offer to inspect individual photos.
