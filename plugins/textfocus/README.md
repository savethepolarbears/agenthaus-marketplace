# TextFocus Plugin for AgentHaus Marketplace

SEO keyword analysis and semantic optimization powered by TextFocus. Get comprehensive keyword metrics, discover related keywords, score pages for SEO performance, and analyze semantic vocabulary for data-driven content strategy.

## Features

### 4 Slash Commands
- **`/textfocus:keyword`** — Analyze keyword metrics (volume, CPC, difficulty, competition)
- **`/textfocus:related`** — Find related keywords, long-tail variations, and content clusters
- **`/textfocus:seo`** — Score a URL's SEO performance against target keyword (0-100)
- **`/textfocus:semantic`** — Get semantic vocabulary and coverage analysis

### SEO Analyst Subagent
Specialized AI agent for keyword strategy, content optimization, competitive analysis, and topical authority building. Use for complex SEO workflows.

### Comprehensive Skill
Complete SEO analysis workflows: keyword research pipelines, page optimization audits, semantic content enrichment, competitive analysis, and topic clustering strategies.

## Installation

1. Install the plugin:
   ```bash
   /plugin install textfocus
   ```

2. Set your TextFocus API key in `.env`:
   ```bash
   TEXTFOCUS_API_KEY=your_api_key_here
   ```

3. Start using commands and the SEO analyst agent

## Required Environment Variables

| Variable | Description |
| --- | --- |
| `TEXTFOCUS_API_KEY` | Your TextFocus API key (get from https://www.textfocus.io/) |

## Quick Start

### Analyze a Single Keyword
```
/textfocus:keyword "project management software"
```

Get: search volume, CPC, keyword difficulty, competition level, trends

### Find Related Keywords
```
/textfocus:related "email marketing" --lang en
```

Get: long-tail variations, question-format queries, semantic synonyms, content clusters

### Score a Page for SEO
```
/textfocus:seo "https://example.com/page" "target keyword" --lang en
```

Get: SEO score (0-100), component breakdown, improvement recommendations

### Analyze Semantic Vocabulary
```
/textfocus:semantic "machine learning" --lang en
```

Get: semantic vocabulary categories, coverage percentage, gaps vs. competitors

### Use the SEO Analyst Subagent
```
@seo-analyst help me build a keyword strategy for "content marketing"
```

The seo-analyst agent handles complex workflows:
- Keyword research and prioritization
- Content gap analysis
- Competitive page optimization
- Topical authority building
- Content cluster planning

## Language Support

All commands support multiple languages via the `--lang` parameter:

| Code | Language |
| --- | --- |
| `en` | English (default) |
| `de` | German |
| `fr` | French |
| `es` | Spanish |
| `it` | Italian |
| `nl` | Dutch |
| `pt` | Portuguese |
| `ru` | Russian |
| `zh` | Simplified Chinese |
| `ja` | Japanese |

## Typical Workflows

### Keyword Research Pipeline
1. Analyze seed keyword with `/textfocus:keyword`
2. Find related keywords with `/textfocus:related`
3. Compare difficulty across variations
4. Identify high-opportunity keywords
5. Plan content strategy
6. Use @seo-analyst to prioritize targets

### Page Optimization Audit
1. Score page with `/textfocus:seo`
2. Review score components
3. Identify critical issues
4. Implement high-priority changes
5. Get semantic vocabulary to enrich content
6. Re-analyze to confirm improvements
7. Monitor rankings (2-4 weeks)

### Semantic Content Optimization
1. Get semantic vocabulary with `/textfocus:semantic`
2. Analyze current content vs. vocabulary
3. Identify missing semantic terms
4. Plan content sections
5. Naturally incorporate new terms
6. Re-analyze semantic coverage
7. Ensure topical comprehensiveness

### Competitive Analysis
1. Analyze your page with `/textfocus:seo`
2. Get competitor URLs from search results
3. Analyze top 3 competitor pages
4. Compare scores and strategies
5. Identify optimization gaps
6. Plan differentiation strategy
7. Implement improvements

## Understanding Metrics

### Keyword Difficulty (0-100)
- **0-20**: Very easy (new sites can rank)
- **21-40**: Easy (achievable with good content)
- **41-60**: Moderate (requires quality content + links)
- **61-80**: Hard (needs established authority)
- **81-100**: Very hard (requires domain authority)

**Best targets**: KD 20-40 for new sites, KD 40-60+ for established sites

### Search Volume
Higher = more traffic potential. Balance with difficulty:
- 500-5000 volume: Ideal sweet spot
- 100-500: Long-tail (easier to rank)
- 5000+: Competitive (harder to rank)

### CPC (Cost-Per-Click)
Indicates commercial value and audience quality:
- **$0-1**: Low commercial intent
- **$1-2**: Medium intent
- **$2-5**: High intent
- **$5+**: Very high value

### SEO Score (0-100)
Page optimization level:
- **80-100**: Excellent, ready to rank
- **60-79**: Good, minor improvements
- **40-59**: Moderate, significant work
- **20-39**: Poor, major optimization needed
- **0-19**: Critical issues blocking ranking

### Semantic Coverage
- **90-100%**: Comprehensive, competitive advantage
- **75-90%**: Strong, well-optimized
- **60-75%**: Moderate, missing key concepts
- **< 60%**: Weak, significant gaps

## Tips for Success

### Choose Keywords Wisely
- Target keywords matching your site authority
- Balance volume with difficulty
- Consider commercial value (CPC)
- Plan long-tail strategy alongside high-volume targets
- Build keyword portfolio approach

### Optimize for Users
- Write comprehensive, valuable content
- Naturally incorporate semantic terms
- Maintain 1-2% keyword density
- Answer all user intent variations
- Keep content updated and fresh

### Build Topical Authority
- Create pillar pages with depth
- Build content clusters around topics
- Interlink related semantic topics
- Develop topic expertise
- Expand clusters over time

### Measure & Iterate
- Re-analyze pages after optimization
- Expect 4-8 weeks for ranking movement
- Monitor traffic and engagement
- Update content regularly
- Plan continuous improvement

## Configuration

### Multi-Language Setup
Set language for specific analyses:

```
/textfocus:keyword "Schlagwort" --lang de
/textfocus:seo "https://example.de/page" "Zielwort" --lang de
```

### Advanced Usage with SEO Analyst
For complex analysis, delegate to the SEO analyst subagent:

```
@seo-analyst analyze these 10 keywords and create a content strategy:
1. content marketing
2. content strategy
3. content creation
4. content calendar
...
```

## Example Results

### Keyword Analysis
```
Keyword: "project management software"
Search Volume: 12,500/month
CPC: $4.25
Difficulty: 52 (Moderate)
Competition: High
Trend: Stable
```

### SEO Score
```
URL: https://example.com/pm-guide
Target Keyword: "project management"
Overall Score: 68/100

Title Tag: Good (keyword present, 58 chars)
Meta Description: Fair (150 chars, needs keyword)
H1: Excellent (keyword optimized)
Content: Good (1800 words, semantic coverage 78%)
Internal Links: Fair (8 relevant links)
Technical SEO: Good (mobile-responsive, SSL)

Recommendations:
1. Update meta description (High Priority)
2. Add semantic terms: "agile", "scrum", "methodology" (Medium)
3. Strengthen internal linking (Medium)
4. Add schema markup (Low)
```

### Semantic Vocabulary
```
Keyword: "machine learning"
Coverage: 82%

Core Concepts:
- Artificial intelligence (High)
- Deep learning (High)
- Neural networks (High)
- Algorithm (High)
- Training data (High)

Technical Terms:
- Supervised learning (Medium)
- Unsupervised learning (Medium)
- Feature extraction (Medium)
- Model optimization (Low)

Related Fields:
- Data science
- Statistics
- Python programming
- Big data

Missing Terms (Gaps):
- Reinforcement learning
- Transfer learning
- Hyperparameter tuning
```

## Support

For issues or feature requests, visit the plugin repository:
https://github.com/savethepolarbears/agenthaus-marketplace/issues

For TextFocus documentation and API details:
https://www.textfocus.io/docs

## License

MIT License - See LICENSE file in repository
