---
description: "Analyze a URL's SEO performance against a target keyword. Usage: `/textfocus:seo 'https://example.com/page' 'target keyword' --lang en`"
---

# Analyze URL SEO Performance

Use this command to score a webpage's SEO performance against a target keyword, including on-page optimization analysis, keyword usage metrics, and actionable improvement recommendations.

## Usage

```
/textfocus:seo "https://example.com/page" "target keyword" [--lang en]
```

## Parameters

- **url** (required): The full URL of the page to analyze (must start with http/https)
- **keyword** (required): The target keyword to optimize the page for
- **--lang** (optional): Language code (default: en). Examples: en, de, fr, es, it, nl, pt, ru, zh, ja

## On-Page SEO Scoring

### Overall Score (0-100)
- **80-100**: Excellent SEO optimization
- **60-79**: Good optimization with minor improvements
- **40-59**: Moderate optimization, improvement needed
- **20-39**: Poor optimization, significant work needed
- **0-19**: Critical issues preventing ranking

### Score Components

**Title Tag**
- Presence of target keyword
- Length (50-60 characters optimal)
- Brand inclusion
- Compelling messaging

**Meta Description**
- Target keyword presence
- Length (150-160 characters optimal)
- Call-to-action inclusion
- Click-through appeal

**H1 & Headings**
- H1 presence and keyword relevance
- Heading hierarchy (H1 → H2 → H3)
- Keyword distribution in headers
- User readability

**Content Quality**
- Word count (1500+ words recommended)
- Keyword density (1-2% optimal)
- Semantic term coverage
- Content freshness
- Readability score

**Internal Linking**
- Anchor text relevance
- Number of internal links
- Link authority distribution
- Related content linking

**Images & Media**
- Image alt text optimization
- Keyword-rich filenames
- Image size optimization
- Multimedia presence

**Technical SEO**
- Mobile responsiveness
- Page load speed
- SSL/HTTPS encryption
- Structured data (Schema markup)
- Crawlability

## Interpreting Results

### Keyword Presence
- **Excellent**: Keyword in title, H1, meta description, and naturally throughout content
- **Good**: Keyword in title and H1, present in content
- **Needs Work**: Keyword missing from key elements
- **Critical**: No keyword presence in main elements

### Content Depth
- **Comprehensive**: 2000+ words with semantic variations
- **Adequate**: 1500-2000 words with keyword focus
- **Minimal**: 500-1500 words without depth
- **Insufficient**: < 500 words

### Semantic Relevance
- **Strong**: Related terms and semantic variations present
- **Moderate**: Some related terms present
- **Weak**: Few semantic variations
- **Missing**: No semantic enrichment

## Example Analysis Workflow

1. **Input URL and target keyword**
2. **Review overall score and components**
3. **Identify critical issues** (title, H1, content)
4. **Check keyword usage** (density, placement)
5. **Review semantic coverage** (related terms)
6. **Analyze technical elements** (speed, mobile, schema)
7. **Implement recommendations** (priorities first)
8. **Re-analyze after changes** (measure improvement)

## Actionable Recommendations

The analysis provides specific recommendations organized by priority:

### High Priority (Quick Wins)
- Missing H1 tag
- No target keyword in title
- Missing meta description
- Critical heading hierarchy issues

### Medium Priority (Important)
- Low keyword density
- Missing semantic terms
- Weak internal linking
- Image alt text missing

### Low Priority (Enhancements)
- Readability improvements
- Additional content sections
- Related content linking
- Schema markup additions

## Tips for SEO Optimization

**Before Optimization**
- Analyze current state to establish baseline
- Document current rankings for target keyword
- Note competitor pages ranking for keyword

**During Optimization**
- Focus on high-priority recommendations first
- Maintain natural keyword usage (avoid stuffing)
- Ensure semantic terms fit naturally
- Update internal links strategically
- Improve content depth and quality

**After Optimization**
- Re-analyze to confirm improvements
- Monitor ranking progress (2-4 weeks)
- Track traffic and engagement metrics
- Make additional improvements as needed
- Update content regularly to maintain freshness

## Competitive Analysis

Compare multiple pages:
- Analyze your page
- Analyze top 3 competitor pages
- Identify SEO gaps
- Implement missing elements
- Create differentiated content
