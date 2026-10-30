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

