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

