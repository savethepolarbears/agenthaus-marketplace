# NeuronWriter Plugin

SEO content analysis and optimization with NeuronWriter — keyword research, content scoring, AI generation, and WordPress publishing via 7 MCP tools.

## Overview

This plugin provides complete integration with NeuronWriter's SEO analysis engine through 7 Model Context Protocol (MCP) tools. Analyze keywords, optimize content, score articles, and publish directly to WordPress with AI-powered generation.

**Key Capabilities:**

- Keyword research and competitor analysis (40+ languages)
- Content recommendations: outline, semantic terms, target length
- Real-time content scoring against NeuronWriter algorithm
- Competitor benchmarking and coverage gap analysis
- AI-powered content generation with Ollama LLM
- WordPress REST API publishing integration
- Multi-site and multi-language support

## Installation

```bash
/plugin marketplace add https://github.com/savethepolarbears/agenthaus-marketplace
/plugin install neuronwriter
```

Then configure environment variables (see below).

## Configuration

### 1. Set Your NeuronWriter API Key

```bash
export NEURONWRITER_API_KEY=your_api_key_here
```

Get your API key from [NeuronWriter Dashboard](https://app.neuronwriter.com/dashboard).

### 2. Configure WordPress Sites (Optional)

For publishing functionality, add WordPress site credentials:

```bash
export NEURONWRITER_WP_SITES='{"mysite.com":{"url":"https://mysite.com","username":"your-username","password":"app-password"}}'
```

**Important**: Use WordPress application passwords, not your login password.

### 3. Optional: Ollama Configuration

For local AI content generation:

```bash
export NEURONWRITER_OLLAMA_URL=http://localhost:11434
export NEURONWRITER_LLM_MODEL=llama3.3  # or qwen2.5, deepseek-r1, gemma3
```

## Quick Start

### 1. Analyze a Keyword

```
/neuronwriter:analyze 'best project management tools'
```

This creates a query and retrieves:
- Content outline and structure recommendations
- Semantic terms to incorporate
- Competitor analysis (top 10 results)
- Target word count and readability metrics

### 2. Get More Details

```
/neuronwriter:projects list
/neuronwriter:projects queries <project-id> --status ready
```

### 3. Score Your Content

After writing an article:

```
/neuronwriter:content evaluate <query-id> '<your-html>'
```

Returns SEO score (0-100) and specific recommendations for improvement.

### 4. Publish to WordPress

```
/neuronwriter:publish <query-id> --site mysite.com --status draft
```

Automatically generates optimized content and saves as WordPress draft for review.

## Commands

### /neuronwriter:analyze
Analyze a target keyword with full competitor insights.
```
/neuronwriter:analyze 'your keyword here'
```

### /neuronwriter:projects
List projects and queries.
```
/neuronwriter:projects list
/neuronwriter:projects queries <project-id> --status ready
```

### /neuronwriter:content
Get analysis recommendations and evaluate content.
```
/neuronwriter:content get <query-id>
/neuronwriter:content evaluate <query-id> '<html-content>'
/neuronwriter:content import <query-id> --url https://example.com
```

### /neuronwriter:publish
Publish optimized content to WordPress.
```
/neuronwriter:publish <query-id> --site mysite.com --status draft
```

## Agents

### seo-writer
AI agent specialized in SEO content optimization. Use for:
- Creating SEO-optimized articles from keyword analysis
- Analyzing competitors and planning content strategy
- Evaluating and improving content scores
- Managing WordPress publishing workflow

Invoke via:
```
@seo-writer Analyze the keyword "best project management tools" and create an article
```

## The 7 MCP Tools

1. **nw_create_query** — Initiate keyword analysis
2. **nw_get_query_data** — Retrieve analysis results (poll for status)
3. **get_content** — Fetch saved content from query
4. **nw_import_content** — Import content for evaluation
5. **evaluate_content** — Score content and get recommendations
6. **list_projects** — List all analysis projects
7. **list_queries** — List queries within a project

See the skill documentation for detailed tool signatures and workflows.

## Workflow Examples

### Single Keyword Article

```
1. /neuronwriter:analyze 'target keyword'
2. Wait 3-5 minutes for analysis
3. Use seo-writer agent to create article based on recommendations
4. /neuronwriter:content evaluate <query-id> '<your-draft>'
5. Iterate until score reaches 80+
6. /neuronwriter:publish <query-id> --site mysite.com --status draft
7. Review in WordPress, publish when ready
```

### Content Refresh

```
1. /neuronwriter:analyze 'existing article keyword'
2. /neuronwriter:content import <query-id> --url 'https://yoursite.com/article'
3. /neuronwriter:content evaluate <query-id> '<existing-html>'
4. Identify gaps and improvements
5. Update article with recommendations
6. Re-score and redeploy
```

### Batch Campaign (10+ Keywords)

```
1. Create 10-20 keyword queries in bulk
2. /neuronwriter:projects queries <project-id> --status ready
3. Process ready queries in parallel
4. Score each article (aim for 80+)
5. Schedule publishing across 2-4 weeks
```

## Understanding the Tools

### nw_create_query
Creates analysis request. Returns immediately with query_id. Actual analysis runs asynchronously (3-60 seconds).

### nw_get_query_data
Check status: "processing" → poll every 3-5 seconds, "ready" → full results available, "error" → retry or contact support.

### evaluate_content
Returns 0-100 score:
- 90-100: Excellent, competitive with top results
- 80-89: Good, should rank well
- 70-79: Fair, needs optimization
- Below 80: Significant gaps vs. competitors

Use save=False for draft iterations, save=True for final version.

## Best Practices

1. **Always analyze before writing** — Understand competitor landscape and recommendations
2. **Follow the outline exactly** — Structure matters for SEO
3. **Include all semantic terms** — Not just primary keyword
4. **Aim for 80+ score** — Sweet spot between optimization and readability
5. **Draft first, review, then publish** — Always review in WordPress before going live
6. **Monitor keywords 1-4 weeks post-publication** — Track ranking improvement
7. **Use content clusters** — Group related keywords around core topic

## Environment Variables

| Variable | Required | Example |
|----------|----------|---------|
| `NEURONWRITER_API_KEY` | Yes | `sk_live_...` |
| `NEURONWRITER_WP_SITES` | No | `{"site.com":{"url":"https://site.com","username":"user","password":"pass"}}` |
| `NEURONWRITER_OLLAMA_URL` | No | `http://localhost:11434` |
| `NEURONWRITER_LLM_MODEL` | No | `llama3.3` or `qwen2.5` |

## Troubleshooting

### Query takes too long
- Normal: 3-60 seconds
- Check: NeuronWriter API status
- Solution: Increase polling interval or reduce concurrent queries

### Low SEO scores
- Check: All semantic terms included naturally
- Verify: Content length meets or exceeds target
- Improve: Heading structure and keyword placement
- Try: Different content version or model

### WordPress connection fails
- Verify: REST API enabled on WordPress site
- Check: Using application password (not login password)
- Confirm: Site domain in .env matches target

## Support

- [NeuronWriter Documentation](https://neuronwriter.com/docs)
- [WordPress REST API](https://developer.wordpress.org/rest-api/)
- [AgentHaus Plugin Development](https://github.com/savethepolarbears/agenthaus-marketplace/blob/main/CONTRIBUTING.md)

## License

MIT — See LICENSE file in repository

---

**Version:** 1.0.0  
**Last Updated:** April 2026  
**Maintainer:** AgentHaus Team
