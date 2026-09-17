---
name: asset-generation
description: Comprehensive skill for generating images, PDFs, and social media assets with MarkupGo's 16 MCP tools. Use when rendering HTML to images, generating PDFs, managing templates, creating social media asset packs, or transforming images.
---

# Asset Generation with MarkupGo

MarkupGo enables professional visual asset creation through 16 MCP tools. This skill covers when to use each tool, common workflows, platform specifications, and best practices.

## Trigger Recognition

**Activate this skill when the user asks about:**

- Creating images from HTML, URLs, or Markdown
- Generating screenshots of websites
- Converting documents to PDF
- Creating social media assets for multiple platforms
- Building reusable template libraries
- Resizing or transforming images for specific platforms
- Generating branded headers, cards, banners
- Creating multi-platform content packs
- Batch generating assets with different data
- Optimizing images for web, email, or social media
- Converting PowerPoint, Word, Excel to images or PDFs

**Recognize these phrases:**

- "Generate image from...", "Create an image of...", "Take screenshot"
- "Make a PDF", "Convert to PDF", "Generate PDF"
- "Social media graphics", "Create Instagram post", "Pinterest pin"
- "Email header", "Blog header", "OG image"
- "Reusable template", "Save for later", "Template library"
- "Resize for Instagram", "Optimize for Facebook"
- "Batch create", "Generate multiple", "Create variants"
- "Document conversion", "HTML to image", "Markdown to PDF"

## 16 MCP Tools Overview

### Image Generation (4 tools)

#### 1. generate_image

- Creates images from HTML, URLs, Markdown, or templates
- Outputs: PNG, JPEG, WebP
- Supports viewport sizing, device scale, quality, delay
- Best for: Custom designs, branded graphics, web screenshots

#### 2. generate_image_from_template

- Renders template with dynamic data
- Uses Handlebars-style variables: `{{variable}}`
- Optimized for batch rendering
- Best for: Product cards, reusable designs, data-driven assets

#### 3. get_platform_specs

- Returns dimension guidelines for each platform
- Includes safe areas, aspect ratios, text safe zones
- Helps choose correct dimensions upfront
- Best for: Compliance with platform requirements

#### 4. generate_social_asset_pack

- Creates multi-platform assets in one call
- Generates optimized versions for: Facebook, Instagram, Pinterest, Twitter, LinkedIn
- Includes captions and hashtags per platform
- Best for: Coordinated campaigns, time-saving batch creation

### PDF Generation (3 tools)

#### 5. generate_pdf

- Creates PDFs from HTML, URLs, or Markdown
- Supports: A4, Letter, Legal, A3, A5 formats
- Includes headers, footers, page numbers, margins
- Best for: Reports, invoices, documents, newsletters

#### 6. convert_file_to_pdf

- Converts DOCX, XLSX, PPTX to PDF
- Preserves formatting and layout
- Useful for document workflows
- Best for: Converting existing documents

#### 7. convert_url_to_pdf

- Captures website and converts to PDF
- Preserves styling and layout
- Best for: Archiving web pages, creating printable versions

### Template Management (5 tools)

#### 8. create_template

- Saves reusable HTML template with variables
- Enables batch rendering with different data
- Supports variables, conditionals, loops
- Best for: Product catalogs, newsletters, recurring designs

#### 9. list_templates

- Shows all user-created templates
- Filtering by tag or name
- Includes variable documentation
- Best for: Template discovery, auditing template library

#### 10. get_template

- Retrieves full template HTML and variable list
- Shows usage examples
- Best for: Understanding template structure before rendering

#### 11. delete_template

- Removes unused or outdated templates
- Irreversible action
- Best for: Cleaning up template library

#### 12. browse_design_templates

- Searches marketplace templates
- Filters by category, search terms
- Shows preview and variable list
- Best for: Finding pre-built designs to customize

### Image Transformation (3 tools)

#### 13. transform_image

- Resizes, crops, applies filters to existing images
- Supports: resize, crop, filter, format conversion
- Platform-specific shortcuts (instagram-feed, pinterest, etc.)
- Best for: Adapting assets for multiple platforms, optimization

#### 14. transform_social_image

- Specialized for social media optimization
- Auto-detects best aspect ratio for platform
- Applies platform-specific enhancements
- Best for: Preparing assets for specific social networks

#### 15. batch_transform_images

- Apply same transformation to multiple images
- Accepts list of image IDs or CSV batch file
- Efficient for bulk optimization
- Best for: Processing many assets quickly

### Utility (1 tool)

#### 16. validate_html

- Checks HTML validity before generation
- Reports rendering issues
- Catches missing tags, broken CSS
- Best for: Debugging HTML generation failures

## Workflow Patterns

### Pattern 1: HTML-to-Image (Basic)

User: "Create an Instagram post graphic with my quote: 'Simplicity is the soul of efficiency' with a dark theme"

**Steps:**

1. Get platform specs: `/get_platform_specs` → Instagram = 1080×1080
2. Design HTML with user's branding (colors, fonts, logo)
3. Generate image: `/generate_image from-html [html] --viewport 1080x1080`
4. Return image download link

**MCP Tool Sequence:**

```text
1. get_platform_specs(platform="instagram")
   → Returns: 1080×1080 is optimal, 1080×1350 alternative
2. generate_image(source="html", html="<div>...</div>", viewport="1080x1080")
   → Returns: image_id, download_url, dimensions
```

### Pattern 2: URL-to-Image (Website Screenshot)

User: "Take a screenshot of my website and make it 1200x630 for sharing"

**Steps:**

1. Generate image from URL
2. Optionally transform to exact dimensions

**MCP Tool Sequence:**

```text
1. generate_image(source="url", url="https://example.com", viewport="1200x630")
   → Returns: image_id, download_url
2. (If cropping needed) transform_image(image_id, crop="center", resize="1200x630")
   → Returns: transformed_image_id
```

### Pattern 3: Template + Batch Render (Product Catalog)

User: "Generate product cards for 50 products with dynamic pricing and images"

**Steps:**

1. Check if template exists, if not create one
2. Prepare data file (JSON or CSV with product data)
3. Batch render template with all data
4. (Optional) Transform each for different platforms

**MCP Tool Sequence:**

```text
1. browse_design_templates(category="product") OR create_template(name="product-card", html="<div>{{product}}...</div>")
2. batch_render_templates(template_id="product-card", data_file="products.json")
   → Returns: [image_ids] for all 50 products
3. (Optional) batch_transform_images(image_ids=[...], platform="instagram-feed")
   → Returns: [transformed_image_ids] optimized for Instagram
```

### Pattern 4: Social Media Pack (Multi-Platform)

User: "Create social media graphics for our blog post launch on Instagram, Facebook, and Pinterest"

**Steps:**

1. Create design as HTML
2. Generate social pack (auto-creates all platform variants)
3. Get captions and hashtags
4. Return all assets with posting recommendations

**MCP Tool Sequence:**

```text
1. generate_social_asset_pack(html="<div>Blog Post Announcement</div>", 
                               platforms=["instagram", "facebook", "pinterest"],
                               caption="Check out our latest insights...",
                               hashtags=["#marketing", "#seo"])
   → Returns: {
       "instagram": { "feed": image_id, "story": image_id },
       "facebook": { "feed": image_id },
       "pinterest": { "pin": image_id },
       "captions": { "instagram": "...", "facebook": "..." },
       "hashtags": { "instagram": [...], "pinterest": [...] }
     }
```

### Pattern 5: Document Conversion (PDF)

User: "Convert this blog post to PDF and add page numbers and a header"

**Steps:**

1. Generate PDF from Markdown or HTML
2. Add header, footer, page numbers
3. Return PDF download

**MCP Tool Sequence:**

```text
1. generate_pdf(source="markdown", 
                markdown="# Blog Title\n\nContent...",
                format="a4",
                header="<h3>My Blog</h3>",
                footer="<p>Page <span class='page'></span></p>",
                page_numbers=true)
   → Returns: pdf_id, download_url, page_count
```

### Pattern 6: Template Library (Recurring Designs)

User: "I need to generate email headers every week with different content"

**Steps:**

1. Create reusable template once with variables
2. Render template weekly with new data
3. Transform if needed for different platforms

**MCP Tool Sequence:**

```text
1. create_template(name="email-header", 
                   html="<div>{{title}}</div><p>{{date}}</p><p>{{content}}</p>")
   → Returns: template_id

2. (Weekly) render_template(template_id="email-header",
                            data={"title": "Weekly Updates", "date": "April 10", "content": "..."})
   → Returns: image_id

3. (If needed) transform_image(image_id, resize="600x400")
   → Returns: transformed for email
```

### Pattern 7: Image Transformation (Platform Optimization)

User: "I have one hero image but need it for Instagram, Pinterest, and email. Make it the right size for each"

**Steps:**

1. Use platform shortcuts to transform for each channel

**MCP Tool Sequence:**

```text
1. transform_image(image_id, platform="instagram-feed")
   → Returns: 1080×1080 Instagram-optimized
2. transform_image(image_id, platform="pinterest")
   → Returns: 1000×1500 Pinterest-optimized
3. transform_image(image_id, platform="email")
   → Returns: 600×400 email-optimized
```

## Platform Specifications

### Instagram

- **Feed Post Square**: 1080×1080 px
- **Feed Post Portrait**: 1080×1350 px
- **Feed Post Landscape**: 1080×566 px
- **Story**: 1080×1920 px
- **Reel/Video**: 1080×1920 px (9:16)
- **Carousel**: Multiple 1080×1350 images
- **Caption Limit**: 2,200 characters
- **Hashtag Limit**: Up to 30 (but 5-10 recommended)
- **Safe Area**: Leave 20px margin from edges

### Facebook

- **Feed Post**: 1200×628 px (16:9 aspect ratio)
- **Story**: 1080×1920 px (9:16 aspect ratio)
- **Event Image**: 1200×628 px
- **Cover Photo**: 820×312 px (ratio 16:6.15)
- **Video**: 1200×675 px
- **Caption Limit**: 63,206 characters (rarely used fully)
- **Link Preview Image**: 1200×628 px

### Pinterest

- **Standard Pin**: 1000×1500 px (2:3 aspect ratio)
- **Tall Pin**: 1000×1500+ px (better for feeds)
- **Video Pin**: 1080×1920 px (9:16)
- **Wide Pin**: 1000×750 px
- **Square Pin**: 1000×1000 px
- **Description Limit**: 500 characters
- **Best Practice**: Tall (2:3) pins outperform square pins
- **Hashtag Limit**: Up to 20

### Twitter/X

- **Post Image**: 1200×628 px (16:9 aspect ratio recommended)
- **Video**: 1200×675 px (16:9)
- **Animated GIF**: 1200×675 px
- **Quote Limit**: 280 characters (excluding media)
- **No hashtag limit**, but 1-3 recommended for clarity

### LinkedIn

- **Feed Post**: 1200×627 px (1.91:1 aspect ratio)
- **Video**: 1200×675 px or 1080×1080 px
- **Document**: 1200×1500 px
- **Company Logo**: 200×200 px
- **Post Caption Limit**: ~2,000 characters

### Email

- **Header Image**: 600×200-400 px
- **Content Image**: 600px wide (responsive)
- **Call-to-Action Button**: Minimum 44×44 px (touch-friendly)
- **Safe Width**: 600px for most email clients
- **Safe Area**: 20px padding on sides

### Blog/Web (OG Images)

- **Open Graph Image**: 1200×630 px (1.91:1 aspect ratio)
- **Twitter OG**: 1200×675 px (16:9)
- **Favicon**: 16×16, 32×32, 64×64 px
- **Hero Image**: 1200×400-600 px
- **Featured Image**: 1200×800 px (3:2)

## Common HTML Patterns

### Product Card

```html
<div style="width:300px;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);background:white">
  <img src="{{image_url}}" style="width:100%;height:200px;object-fit:cover">
  <div style="padding:16px">
    <h3 style="margin:0 0 8px;font-size:18px">{{product_name}}</h3>
    <p style="color:#666;margin:0 0 12px;font-size:14px">{{description}}</p>
    <div style="display:flex;justify-content:space-between;align-items:center">
      <span style="font-weight:bold;font-size:18px">${{price}}</span>
      <button style="background:#667eea;color:white;border:none;padding:8px 12px;border-radius:4px;cursor:pointer">Shop</button>
    </div>
  </div>
</div>
```

### Hero Banner

```html
<div style="width:1200px;height:400px;background:linear-gradient(135deg,{{color1}} 0%,{{color2}} 100%);display:flex;align-items:center;justify-content:center;text-align:center;padding:40px;box-sizing:border-box">
  <div>
    <h1 style="font-size:48px;margin:0 0 16px;color:white">{{headline}}</h1>
    <p style="font-size:18px;margin:0;color:rgba(255,255,255,0.9)">{{subtitle}}</p>
  </div>
</div>
```

### Social Media Card

```html
<div style="width:1080px;height:1080px;background:{{bg_color}};display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px;color:white;box-sizing:border-box">
  {{#if logo_url}}<img src="{{logo_url}}" style="width:80px;margin-bottom:20px">{{/if}}
  <h1 style="font-size:56px;margin:0 0 16px">{{headline}}</h1>
  <p style="font-size:24px;margin:0">{{subheading}}</p>
  {{#if cta}}<p style="font-size:16px;margin-top:24px;opacity:0.9">{{cta}}</p>{{/if}}
</div>
```

### Blog Header

```html
<div style="width:1200px;height:400px;background:url({{bg_image}}) center/cover;position:relative;display:flex;align-items:center;justify-content:center">
  <div style="position:absolute;inset:0;background:rgba(0,0,0,0.4)"></div>
  <div style="position:relative;z-index:1;text-align:center;color:white;max-width:800px;padding:20px">
    <h1 style="font-size:48px;margin:0 0 16px">{{title}}</h1>
    <p style="font-size:18px;margin:0 0 12px">{{subtitle}}</p>
    <p style="font-size:14px;opacity:0.9">By {{author}} • {{date}}</p>
  </div>
</div>
```

## Best Practices

### Design Quality

- **Typography**: Use clear hierarchy (h1 > h2 > h3)
- **Contrast**: Ensure text is readable against background (WCAG AA minimum)
- **Whitespace**: Leave breathing room (20-40px margins/padding)
- **Consistency**: Use 2-3 colors, 1-2 font families
- **Mobile-First**: Design for smallest viewport first

### HTML/CSS

- Use semantic HTML structure
- Inline CSS for reliability (external CSS sometimes doesn't load)
- Test in multiple viewport sizes
- Avoid JavaScript (MarkupGo renders static HTML)
- Use web-safe fonts or include font URLs (Google Fonts recommended)
- Keep file size under 1MB for fast rendering

### Template Variables

- Use descriptive variable names: `{{product_name}}` not `{{var1}}`
- Include conditional blocks for optional content: `{{#if sale_price}}...{{/if}}`
- Use loops for arrays: `{{#each items}}<li>{{name}}</li>{{/each}}`
- Document all variables with examples
- Provide sample data JSON

### Performance

- Use `--delay` option if content loads asynchronously
- Batch render templates instead of generating individually
- Use WebP or AVIF format for smaller file sizes
- Compress images referenced in HTML before embedding
- Cache templates after first creation

### Platform Compliance

- Always verify dimensions with `get_platform_specs`
- Follow platform safe areas (avoid placing text on edges)
- Don't include watermarks unless requested
- Test aspect ratios at actual platform size
- Use platform-native fonts when possible
- Check platform-specific image requirements (no transparency on some platforms)

## Troubleshooting

**Image generation fails or looks wrong:**

1. Validate HTML: `/validate_html`
2. Check for missing closing tags
3. Ensure all CSS is inline (no external stylesheets)
4. Try increasing `--delay` if content isn't rendering
5. Check viewport dimensions for platform

**Template rendering produces incorrect output:**

1. Verify data JSON matches variable names exactly (case-sensitive)
2. Check Handlebars syntax: `{{variable}}`, `{{#if}}...{{/if}}`, `{{#each}}...{{/each}}`
3. Test with sample data first
4. Use `get_template` to review variable list

**PDF output has formatting issues:**

1. Ensure margins don't clip content
2. Check font loading (may need to increase `--delay`)
3. Verify HTML structure for print (some CSS doesn't print)
4. Use `--print-background` if backgrounds should appear
5. Test page breaks for long documents

**Social media assets not optimized:**

1. Always get platform specs first
2. Use `transform_social_image` for platform-specific optimization
3. Check that text fits within safe areas
4. Verify aspect ratio matches platform
5. Preview at platform size before posting

## When to Use Each Tool

| Need | Tool | Best For |
| ------ | ------ | ---------- |
| Custom design | generate_image (HTML) | Full control, branded assets |
| Website capture | generate_image (URL) | Screenshots, archiving pages |
| Document to image | generate_image (Markdown) | Preserving formatted content |
| Reusable design | create_template | Recurring assets, batch jobs |
| Multi-platform | generate_social_asset_pack | Coordinated campaigns |
| Documents | generate_pdf | Reports, invoices, archives |
| Resize/optimize | transform_image | Platform adaptation |
| Pre-built design | browse_design_templates | Quick start, marketplace designs |
| Data-driven rendering | generate_image_from_template | Product catalogs, bulk assets |
| Batch processing | batch_transform_images | Bulk optimization |

## Tips for Success

1. **Get platform specs first** — Always check dimensions before designing
2. **Start with templates** — Browse marketplace templates before building from scratch
3. **Batch when possible** — Use batch tools for 3+ assets
4. **Test dimensions** — Generate at target platform size, then view on actual platform
5. **Save templates** — Create templates for recurring designs
6. **Use quality images** — Reference high-quality images in HTML
7. **Plan workflows** — Think multi-step (generate → transform → deliver)
8. **Document designs** — Add comments in HTML for future edits
9. **Version templates** — Name iterations (product-card-v1, product-card-v2)
10. **Monitor file size** — Keep generated images under 500KB for fast loading
