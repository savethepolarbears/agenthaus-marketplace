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

