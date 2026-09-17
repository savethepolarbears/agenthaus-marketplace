---
description: Publish optimized content to WordPress from NeuronWriter. Usage: `/neuronwriter:publish <query-id> --site mysite.com --status draft`
---

# Publish to WordPress

Publish optimized content directly to WordPress using the NeuronWriter orchestrator pipeline.

## Full Publish Workflow

The publish workflow combines analysis, generation, and WordPress publishing:

1. **Analyze** — Create query via nw_create_query (already done)
2. **Generate** — AI generates content based on recommendations
3. **Evaluate** — NeuronWriter scores the generated content
4. **Publish** — Push to WordPress in draft or published state

## Publish Command

```
/neuronwriter:publish <query-id> --site mysite.com --status draft
```

Parameters:
- **query-id** (required) — The query_id from your nw_create_query call
- **--site** — Target WordPress site domain (e.g., mysite.com)
- **--status** — "draft" (default) or "publish" for immediate publication
- **--title** (optional) — Override auto-generated post title
- **--excerpt** (optional) — Custom post excerpt/summary
- **--featured-image** (optional) — URL to set as featured image
- **--category** (optional) — WordPress category ID or name
- **--tags** (optional) — Comma-separated tags

## Orchestrator Pipeline

The publish command triggers:

1. **Get Query Data** — Retrieves NeuronWriter analysis and recommendations
2. **Generate Content** — Creates full article via Ollama LLM (llama3.3, deepseek-r1, or qwen2.5)
   - Uses recommended outline and semantic terms
   - Targets 2000-4000 words for SEO optimization
   - Incorporates E-E-A-T principles
3. **Evaluate** — Scores generated content (aims for 80+)
4. **Publish** — Posts to WordPress via REST API
   - Sets title, content, excerpt, category, tags
   - Creates featured image if provided
   - Saves as draft by default for review

## Draft vs. Publish

```
# Create as draft for review
/neuronwriter:publish <query-id> --site mysite.com --status draft

# Publish immediately (use with caution)
/neuronwriter:publish <query-id> --site mysite.com --status publish
```

Draft workflow:
1. Content is saved as "Draft" in WordPress
2. Review in WordPress editor before publication
3. Add featured image, customize categories, adjust content
4. Publish manually when ready

Publish workflow:
1. Content goes live immediately
2. Suitable for established content calendars
3. Requires careful planning and testing

## Content Generation Options

Generation uses local Ollama with configurable models:

```
/neuronwriter:publish <query-id> --site mysite.com --model qwen2.5
```

Available models:
- **llama3.3** — Fast, good quality (default)
- **deepseek-r1** — Advanced reasoning, slower but comprehensive
- **qwen2.5** — Multilingual, efficient
- **gemma3** — Lightweight, suitable for low-resource environments

## WordPress Configuration

Before publishing, ensure:

1. **WordPress REST API** is enabled
2. **Application password** is set for your user account (not regular password)
3. **Site domain** is accessible
4. **NEURONWRITER_WP_SITES** env var configured with credentials:

```
NEURONWRITER_WP_SITES={
  "mysite.com": {
    "url": "https://mysite.com",
    "username": "your-username",
    "password": "application-password-here"
  }
}
```

## Post-Publication Workflow

After publishing:

1. **Review Draft** — Check generated content in WordPress editor
2. **Customize** — Add featured image, adjust categories, fine-tune copy
3. **Preview** — Use WordPress preview to check layout
4. **Publish** — Move from Draft to Published status
5. **Monitor** — Track keyword rankings and organic traffic

## Environment Variables

Required:
- `NEURONWRITER_API_KEY` — Your NeuronWriter API key
- `NEURONWRITER_WP_SITES` — WordPress site credentials (JSON)

Optional:
- `NEURONWRITER_LLM_MODEL` — Default LLM for content generation
- `NEURONWRITER_OLLAMA_URL` — Ollama server endpoint (default: http://localhost:11434)
- `NEURONWRITER_WP_DEFAULT_SITE` — Default site for publishing

## Tips for Success

- **Always use draft first** — Review generated content before going live
- **Test with one keyword** — Ensure workflow works, then scale
- **Customize titles** — Generated titles are good starting points but may need brand voice adjustments
- **Add featured images** — Improves CTR and engagement in search results
- **Verify SEO score** — Aim for 80+ before publishing
- **Monitor rankings** — Track keyword positions after publication (typically 1-4 weeks for new content)

## Troubleshooting

**Generation timeout**: Content generation can take 2-5 minutes for long-form content. Be patient or increase timeout.

**WordPress auth error**: Verify REST API is enabled and using application password (not login password).

**Low SEO score**: Re-run evaluation with feedback, regenerate with different model, or manually edit content.

**Missing recommendations**: Ensure query status is "ready" and has been fully processed by NeuronWriter.
