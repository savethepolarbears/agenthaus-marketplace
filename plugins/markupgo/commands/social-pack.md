---
description: Generate platform-optimized social media asset packs for Facebook, Instagram, and Pinterest. Usage `/markupgo:social-pack '<html>' --platforms facebook,instagram`
---

# Generate Social Media Asset Packs

Use the MarkupGo social pack command to automatically generate platform-optimized images, captions, and hashtags for multiple social networks at once.

## Basic Usage

Generate a social media pack from HTML:
```
/markupgo:social-pack '<h1>New Product Launch</h1><p>Available now</p>' --platforms facebook,instagram
```

Specify which platforms:
```
/markupgo:social-pack '<h1>Blog Post</h1>' --platforms instagram,pinterest,facebook --caption 'Check out our latest insights' --hashtags '#SEO #Marketing'
```

## Platform Support

**Facebook**
- Dimensions: 1200x628 (feed), 1200x1500 (story)
- Supports: image, link, carousel
- Caption: 63,206 character limit

**Instagram**
- Feed Post: 1080x1080 (square), 1080x1350 (portrait), 1080x566 (landscape)
- Story: 1080x1920 (vertical)
- Reel/Video: 1080x1920 or 9:16
- Caption: 2,200 character limit
- Hashtags: up to 30 recommended

**Pinterest**
- Pin: 1000x1500 (vertical), 1200x630 (standard)
- Video Pin: 1080x1920 (vertical) or 1080x1080 (square)
- Tall pins perform best (2:3 ratio)
- Description: 500 character limit with pin-optimized keywords

## Options

**Platforms**
- `--platforms PLATFORM1,PLATFORM2,...` — Comma-separated list (facebook, instagram, pinterest, twitter, linkedin)
- Default: facebook,instagram,pinterest

**Content**
- `--caption TEXT` — Base caption text (platform-specific versions auto-generated)
- `--hashtags TEXT` — Hashtags to include (#marketing #seo #business)
- `--cta TEXT` — Call-to-action (e.g., "Learn More", "Shop Now", "Sign Up")

**Design**
- `--brand-color HEX` — Primary brand color (#667eea)
- `--theme [light|dark|gradient]` — Visual theme
- `--logo-url URL` — Brand logo to include
- `--watermark TEXT` — Watermark text

**Output Format**
- `--include-metadata` — Return platform specs with each asset
- `--include-captions` — Return optimized captions for each platform
- `--package-format [zip|json|separate]` — Delivery format

## Common Use Cases

**Blog Post Promotion Pack**
```
/markupgo:social-pack '<div style="background:#667eea;color:white;padding:40px;text-align:center"><h1>SEO in 2026</h1><p>5 Trends to Know</p></div>' \
  --platforms instagram,pinterest,facebook \
  --caption 'New blog post: SEO trends for 2026. Read our latest insights on algorithm updates and optimization strategies.' \
  --hashtags '#SEO #DigitalMarketing #ContentMarketing #Blogging' \
  --cta 'Read Full Post'
```

**Product Launch Pack**
```
/markupgo:social-pack '<h1>Meet Our New Feature</h1><p>Faster. Smarter. Better.</p>' \
  --platforms instagram,facebook,pinterest \
  --brand-color '#FF6B6B' \
  --theme gradient \
  --cta 'Try Now' \
  --include-captions
```

**Event Promotion**
```
/markupgo:social-pack '<h1>Join Us Live</h1><p>May 15, 2026 @ 2pm EST</p><p>Marketing Mastermind Webinar</p>' \
  --platforms facebook,instagram,pinterest \
  --caption 'Secure your spot for our exclusive webinar featuring industry experts sharing strategies for 2026' \
  --cta 'Register Free'
```

**Newsletter Announcement**
```
/markupgo:social-pack '<div style="text-align:center;padding:30px"><h2>New Newsletter Issue</h2><p>Your Monthly Marketing Digest is Here</p></div>' \
  --platforms instagram,facebook,pinterest,linkedin \
  --caption 'Subscribe to our monthly newsletter for actionable marketing tips and industry insights.' \
  --hashtags '#Newsletter #Marketing #Strategy'
```

## Output

The command returns a manifest containing:

**Per-Platform Assets:**
- Image ID and download URL
- Exact dimensions used
- File format and size
- Platform-specific caption (length-optimized)
- Recommended hashtags (platform-appropriate count)
- Design metadata (colors, fonts used)

**Batch Information:**
- Total number of assets generated
- Creation timestamp
- Package ID for reference
- Optimization notes per platform

**Example Response:**
```json
{
  "package_id": "pkg_abc123",
  "created_at": "2026-04-10T14:32:00Z",
  "platforms": {
    "instagram": {
      "feed_square": {
        "asset_id": "img_001",
        "url": "https://...",
        "dimensions": "1080x1080",
        "caption": "New blog post: SEO trends for 2026...",
        "hashtags": ["#SEO", "#DigitalMarketing", ...],
        "file_size": "245KB"
      },
      "story": {
        "asset_id": "img_002",
        "url": "https://...",
        "dimensions": "1080x1920"
      }
    },
    "facebook": {
      "feed": {
        "asset_id": "img_003",
        "url": "https://...",
        "dimensions": "1200x628",
        "caption": "Longer version optimized for Facebook...",
        "file_size": "312KB"
      }
    },
    "pinterest": {
      "standard": {
        "asset_id": "img_004",
        "url": "https://...",
        "dimensions": "1000x1500",
        "description": "SEO optimization tips...",
        "file_size": "198KB"
      }
    }
  }
}
```

Use the individual asset IDs to transform (crop, resize, add filters) or download directly.
