# MarkupGo Plugin

Generate professional images, PDFs, and social media asset packs from HTML, URLs, Markdown, and reusable templates using MarkupGo's 16 production-ready MCP tools.

## Features

**Image Generation**
- Create images from HTML, URLs, Markdown, or templates
- Output formats: PNG, JPEG, WebP
- Configurable viewport, device scale, quality
- Perfect for OG images, blog headers, social cards

**PDF Creation**
- Generate PDFs from HTML, URLs, or Markdown
- Support for A4, Letter, Legal formats
- Headers, footers, page numbers, custom margins
- Convert DOCX, XLSX, PPTX documents to PDF

**Social Media Packs**
- Generate platform-optimized assets in one call
- Supports: Facebook, Instagram, Pinterest, Twitter, LinkedIn
- Auto-generates captions and hashtags per platform
- Saves time on multi-platform campaigns

**Template Management**
- Create reusable HTML templates with Handlebars variables
- Batch render with different data (CSV, JSON)
- Browse marketplace templates
- Save for recurring designs (newsletters, product cards, etc.)

**Image Transformation**
- Resize, crop, apply filters to images
- Platform-specific shortcuts (instagram-feed, pinterest, facebook, etc.)
- Batch transform multiple images
- Quality optimization and format conversion

## Installation

### Prerequisites
- Claude Code with MCP support
- MarkupGo API key (get from [MarkupGo Dashboard](https://app.markupgo.com))

### Setup

1. **Install the plugin**
   ```bash
   /plugin install markupgo
   ```

2. **Set environment variable**
   Add your MarkupGo API key to your environment:
   ```bash
   export MARKUPGO_API_KEY="your_api_key_here"
   ```

3. **Verify installation**
   Use any command to test:
   ```
   /markupgo:image from-html '<h1>Test</h1>'
   ```

## Commands

### Generate Images
```
/markupgo:image from-html '<h1>Hello</h1>'
/markupgo:image from-url https://example.com
/markupgo:image from-markdown '# Title\n\nContent'
/markupgo:image from-template my-card-template --data '{"title":"Hello"}'
```

### Generate PDFs
```
/markupgo:pdf from-html '<h1>Invoice</h1>'
/markupgo:pdf from-url https://example.com/report
/markupgo:pdf convert-file document.docx
```

### Social Media Packs
```
/markupgo:social-pack '<h1>New Post</h1>' --platforms facebook,instagram,pinterest
```

### Template Management
```
/markupgo:template create 'product-card' '<div>{{product}}</div>'
/markupgo:template list
/markupgo:template render 'product-card' --data '{"product":"Widget"}'
/markupgo:template browse
```

### Transform Images
```
/markupgo:transform img_abc123 --resize 1200x630
/markupgo:transform img_abc123 --for instagram-feed
/markupgo:transform img_abc123 --filter grayscale
```

## Common Use Cases

### Generate Blog Header + Social Pack
```bash
# Design custom header and generate for all platforms
/markupgo:social-pack '<div style="...">Blog Post</div>' \
  --platforms instagram,facebook,pinterest \
  --caption 'Check out our latest insights' \
  --hashtags '#Marketing #SEO'
```

### Create Product Catalog
```bash
# Create template once, render 100+ products with batch data
/markupgo:template create 'product-card' '<div>{{name}} - {{price}}</div>'
/markupgo:template batch-render 'product-card' --data-file products.csv
```

### Screenshot and Optimize
```bash
# Capture website and generate for multiple platforms
/markupgo:image from-url https://mysite.com --viewport 1280x1024
/markupgo:transform img_id --for instagram
/markupgo:transform img_id --for pinterest
/markupgo:transform img_id --for email
```

### Generate Multi-Page PDF Report
```bash
/markupgo:pdf from-markdown '# Report Title\n\n## Section 1\n...' \
  --format a4 \
  --page-numbers \
  --header '<h3>Company Report</h3>'
```

## MCP Tools (16 Total)

**Image Generation (4)**
- `generate_image` — HTML/URL/Markdown → Image
- `generate_image_from_template` — Template + Data → Image
- `get_platform_specs` — Dimension guidelines
- `generate_social_asset_pack` — Multi-platform pack

**PDF Creation (3)**
- `generate_pdf` — HTML/URL/Markdown → PDF
- `convert_file_to_pdf` — DOCX/XLSX/PPTX → PDF
- `convert_url_to_pdf` — Website → PDF

**Template Management (5)**
- `create_template` — Save reusable template
- `list_templates` — View all templates
- `get_template` — Retrieve template details
- `delete_template` — Remove template
- `browse_design_templates` — Marketplace templates

**Image Transformation (3)**
- `transform_image` — Resize, crop, filter
- `transform_social_image` — Platform optimization
- `batch_transform_images` — Bulk transformation

**Utility (1)**
- `validate_html` — Check HTML validity

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MARKUPGO_API_KEY` | Your MarkupGo API key | Yes |

## Agents

**asset-designer** — Visual asset designer that orchestrates MarkupGo tools for professional image, PDF, and social media creation. Use for:
- Custom branded visuals
- Website screenshots
- Template-based batch generation
- Multi-platform social content packs
- Document conversion

## Skills

**asset-generation** — Comprehensive skill covering:
- When to trigger each of the 16 MCP tools
- Platform-specific dimension guidelines (Instagram, Facebook, Pinterest, Twitter, LinkedIn, Email, Blog)
- Common HTML design patterns
- Workflow patterns (HTML-to-image, URL-to-image, template+batch, social packs, PDF, etc.)
- Best practices for design quality, HTML/CSS, templates, performance
- Troubleshooting guide

## Examples

### Example 1: OG Image for Blog Post
```
User: "Create an OG image for my blog post about SEO"

/markupgo:image from-html \
  '<div style="background:linear-gradient(135deg,#667eea,#764ba2);width:1200px;height:630px;display:flex;align-items:center;justify-content:center;text-align:center;color:white">
    <div>
      <h1 style="font-size:48px">SEO Best Practices</h1>
      <p style="font-size:20px">The Complete 2026 Guide</p>
    </div>
  </div>' \
  --viewport 1200x630 \
  --format webp
```

### Example 2: Product Card Template
```
/markupgo:template create 'product-card' \
  '<div style="width:400px;border-radius:8px;overflow:hidden">
    <img src="{{image}}" style="width:100%;height:200px;object-fit:cover">
    <div style="padding:16px">
      <h3>{{product}}</h3>
      <p style="color:#666">{{description}}</p>
      <p style="font-size:18px;font-weight:bold">${{price}}</p>
    </div>
  </div>'

/markupgo:template batch-render 'product-card' \
  --data-file products.json
```

### Example 3: Social Media Campaign
```
/markupgo:social-pack \
  '<div style="width:1080px;height:1080px;background:#f8f9fa;display:flex;align-items:center;justify-content:center">
    <h1 style="font-size:72px">Spring Sale</h1>
  </div>' \
  --platforms facebook,instagram,pinterest \
  --caption 'Spring is here! Limited-time offers on all products' \
  --hashtags '#sale #spring #shopping' \
  --cta 'Shop Now'
```

## Pricing

MarkupGo offers usage-based pricing. Check your [account dashboard](https://app.markupgo.com) for current rates and quotas.

## Support

- **Documentation**: [MarkupGo Docs](https://docs.markupgo.com)
- **API Reference**: [REST API Docs](https://api.markupgo.com/docs)
- **Status Page**: [status.markupgo.com](https://status.markupgo.com)
- **Email**: support@markupgo.com

## License

MIT — See LICENSE file

## Contributing

Contributions welcome! See [CONTRIBUTING.md](../../CONTRIBUTING.md) for plugin development guidelines.
