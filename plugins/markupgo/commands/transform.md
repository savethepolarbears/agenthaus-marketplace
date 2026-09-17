---
description: Transform and resize generated images — crop, filter, resize for specific platforms. Usage `/markupgo:transform <image-id> --resize 1200x630`
---

# Transform Images

Use the MarkupGo transform command to resize, crop, apply filters, and adapt generated images for different platforms and use cases.

## Basic Transformations

Resize an image:
```
/markupgo:transform img_abc123 --resize 1200x630
/markupgo:transform img_abc123 --resize 1080x1080 --format webp
```

Crop an image:
```
/markupgo:transform img_abc123 --crop top-left --width 600 --height 400
/markupgo:transform img_abc123 --crop center --width 1000 --height 1500
```

Apply filters:
```
/markupgo:transform img_abc123 --filter grayscale
/markupgo:transform img_abc123 --filter sepia --intensity 0.5
/markupgo:transform img_abc123 --filter blur --intensity 5
```

## Resize Options

**Resize Method**
- `--resize WxH` — Exact dimensions (with padding if aspect ratio doesn't match)
- `--resize WxH --fit contain` — Fit within bounds, maintain aspect ratio
- `--resize WxH --fit cover` — Fill bounds, crop excess, maintain aspect ratio
- `--resize WxH --fit fill` — Stretch to exact dimensions (may distort)

**Scale**
- `--scale 2` — 2x upscale (increase dimensions)
- `--scale 0.5` — 0.5x downscale (reduce dimensions)

**Aspect Ratio**
- `--aspect-ratio 16:9` — Enforce aspect ratio during resize
- `--aspect-ratio 1:1` — Square format
- `--aspect-ratio 2:3` — Portrait (common for Pinterest)

## Crop Options

**Crop Position**
- `--crop top-left` — Crop from top-left corner
- `--crop center` — Crop from center
- `--crop smart` — AI-detect focal point and crop around it
- `--crop top-center`, `--crop bottom-center` — Other positions

**Crop Dimensions**
- `--width W --height H` — Explicit dimensions
- `--width W` — Specify width, auto-calculate height (maintains aspect)
- `--height H` — Specify height, auto-calculate width

## Filter Options

**Available Filters**
- `grayscale` — Convert to black and white
- `sepia` — Vintage brown tone
- `blur` — Gaussian blur
- `sharpen` — Increase sharpness
- `brightness` — Adjust lightness
- `contrast` — Increase/decrease contrast
- `saturate` — Adjust color intensity
- `hue-rotate` — Shift color palette
- `invert` — Invert colors

**Filter Intensity**
- `--intensity 0-1` — Filter strength (0 = none, 1 = full)
- Sepia: 0.5 for subtle, 1.0 for strong
- Blur: 1-10 pixels of blur radius
- Brightness: 0.5 = 50% darker, 1.5 = 50% brighter

## Platform-Specific Shortcuts

Automatically format for specific platforms:
```
/markupgo:transform img_abc123 --for instagram-feed
/markupgo:transform img_abc123 --for instagram-story
/markupgo:transform img_abc123 --for facebook
/markupgo:transform img_abc123 --for pinterest
/markupgo:transform img_abc123 --for twitter
/markupgo:transform img_abc123 --for linkedin
/markupgo:transform img_abc123 --for og-image
```

These shortcuts automatically apply the correct dimensions and settings.

## Chained Transformations

Apply multiple transformations in sequence:
```
/markupgo:transform img_abc123 \
  --resize 1200x630 \
  --crop center \
  --filter brightness --intensity 1.1 \
  --filter contrast --intensity 1.2 \
  --format webp
```

This will:
1. Resize to 1200x630
2. Crop from center if needed
3. Increase brightness by 10%
4. Increase contrast by 20%
5. Output as WebP

## Output Options

**Format**
- `--format [png|jpeg|webp|avif]` — Output format
- WebP and AVIF offer better compression than PNG
- JPEG best for photos, PNG for graphics

**Quality**
- `--quality 1-100` — Compression quality (default: 85)
- Higher = better quality, larger file
- 85-90 recommended for web

**Metadata**
- `--strip-metadata` — Remove EXIF and other metadata
- `--keep-metadata` — Preserve original metadata

## Common Use Cases

**Adapt Blog Image for All Platforms**
```
/markupgo:transform img_abc123 --for og-image
/markupgo:transform img_abc123 --for pinterest
/markupgo:transform img_abc123 --for instagram-feed
/markupgo:transform img_abc123 --for twitter
```

**Resize to Responsive Breakpoints**
```
/markupgo:transform img_abc123 --resize 1200x630 --format webp --quality 85  # Desktop
/markupgo:transform img_abc123 --resize 800x420 --format webp --quality 85   # Tablet
/markupgo:transform img_abc123 --resize 600x400 --format webp --quality 85   # Mobile
```

**Darken and Add Contrast**
```
/markupgo:transform img_abc123 \
  --filter brightness --intensity 0.8 \
  --filter contrast --intensity 1.3 \
  --resize 1200x630
```

**Crop to Instagram Square**
```
/markupgo:transform img_abc123 \
  --crop smart \
  --resize 1080x1080 \
  --filter saturate --intensity 1.2 \
  --format webp
```

**Convert to Grayscale for B&W**
```
/markupgo:transform img_abc123 \
  --filter grayscale \
  --resize 1000x1000 \
  --filter contrast --intensity 1.1
```

**Sepia Tone Vintage Effect**
```
/markupgo:transform img_abc123 \
  --filter sepia --intensity 0.8 \
  --filter brightness --intensity 0.9
```

**High-DPI Export**
```
/markupgo:transform img_abc123 \
  --resize 600x400 \
  --scale 2 \
  --format png
```

This creates a 1200x800 PNG for retina displays.

## Batch Transform

Apply the same transformation to multiple images:
```
/markupgo:transform batch --input-file image-ids.txt --resize 1200x630 --format webp
/markupgo:transform batch --images "img_001,img_002,img_003" --for instagram-feed
```

## Output

Each transformation returns:
- Transformed image ID
- Download URL
- New dimensions
- File size
- Format used
- Processing time
- Optimization details

The transformed image can be downloaded, used in workflows, or further transformed.
