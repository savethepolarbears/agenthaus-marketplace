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

