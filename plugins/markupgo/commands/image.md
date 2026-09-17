---
description: Generate images from HTML, URLs, Markdown, or templates. Usage `/markupgo:image from-url https://example.com` or `/markupgo:image from-html '<h1>Hello</h1>'`
---

# Generate Images

Use the MarkupGo image generation command to create PNG, JPEG, or WebP images from various sources.

## Source Types

### From URL
Generate an image by capturing a website URL:
```
/markupgo:image from-url https://example.com
/markupgo:image from-url https://example.com --viewport 1200x630 --device-scale 2 --format webp
```

### From HTML
Generate an image from inline HTML:
```
/markupgo:image from-html '<h1>Hello World</h1><p>This is a test</p>'
/markupgo:image from-html '<h1>Hello</h1>' --viewport 1200x800 --quality 95
```

### From Markdown
Convert markdown to HTML and generate an image:
```
/markupgo:image from-markdown '# My Title\n\nThis is content'
/markupgo:image from-markdown '# Blog Post\n\nContent here' --viewport 1200x630
```

### From Template
Use a saved template with data:
```
/markupgo:image from-template my-card-template --data '{"title":"Hello","color":"blue"}'
/markupgo:image from-template social-banner --data '{"text":"New Product Launch"}' --viewport 1200x630
```

## Options

**Viewport Dimensions**
- `--viewport WIDTHxHEIGHT` — Set the capture viewport (default: 1280x720)
- Common sizes: 1200x630 (OG image), 1080x1080 (Instagram square), 1080x1920 (Instagram story)

**Device Scale**
- `--device-scale N` — Pixel ratio for high-DPI output (default: 1, use 2 for 2x retina)

**Format**
- `--format [png|jpeg|webp]` — Output format (default: png)

**Quality**
- `--quality 1-100` — Compression quality for JPEG/WebP (default: 85)

**Full Page**
- `--full-page` — Capture entire page height instead of viewport

**Delay**
- `--delay MS` — Wait milliseconds before capture for animations/fonts to load (default: 0)

## Common Use Cases

**Blog Header Image**
```
/markupgo:image from-html '<div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:60px;text-align:center"><h1 style="color:white;font-size:48px">SEO Best Practices</h1></div>' --viewport 1200x400 --device-scale 2
```

**Social Media Card**
```
/markupgo:image from-html '<div style="width:1080px;height:1080px;background:#fff;display:flex;align-items:center;justify-content:center"><h1>New Blog Post</h1></div>' --viewport 1080x1080 --format webp
```

**Website Screenshot**
```
/markupgo:image from-url https://mysite.com --viewport 1280x1024 --full-page --quality 90
```

**Template-Based Card**
```
/markupgo:image from-template product-card --data '{"name":"Premium Plan","price":"$99/mo","color":"gold"}' --device-scale 2
```

## Output

The command returns:
- Image ID for reference
- Download URL or file path
- Dimensions and file size
- Format used
- Generation time

Save the image ID for further transformations (crop, resize, filter) with the `/markupgo:transform` command.
