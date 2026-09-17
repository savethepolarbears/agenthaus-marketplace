---
name: seo-analysis
description: Comprehensive SEO analysis, keyword research, and semantic optimization using TextFocus. Use when analyzing keyword metrics, discovering related keywords, evaluating on-page SEO scores, or conducting semantic vocabulary analysis.
---

# TextFocus SEO Analysis Skill

This skill provides comprehensive SEO analysis capabilities powered by TextFocus, including keyword metrics, semantic analysis, and on-page scoring for data-driven content strategy.

## When to Activate This Skill

Trigger this skill when users ask about:

- **Keyword research**: "Find keywords for...", "What keywords should I target?", "Keyword analysis", "Keyword difficulty", "Search volume"
- **SEO analysis**: "Analyze this page for SEO", "SEO audit", "On-page optimization", "Check keyword ranking potential"
- **Semantic analysis**: "Semantic terms", "Topic vocabulary", "What words should I use?", "Semantic coverage", "LSI keywords"
- **Content optimization**: "How to optimize this content", "Content gap analysis", "Semantic optimization", "Content strategy"
- **Keyword difficulty**: "Can I rank for...", "Keyword difficulty", "How hard is it to rank", "Ranking potential"
- **Competitive analysis**: "What keywords are competitors targeting?", "SEO comparison", "How does this compare to competitors?"
- **Content planning**: "What should my content cover?", "Topic coverage", "Content structure", "Content hierarchy"
- **TextFocus**: Any mention of TextFocus tool or SEO analysis features

## Available MCP Tools

### 1. analyze_keyword

**Purpose**: Get comprehensive keyword metrics and performance data

**When to use**:

- Evaluating single keyword opportunity
- Comparing keyword difficulty across variations
- Assessing commercial value (CPC) of keywords
- Analyzing market saturation (competition level)
- Finding best keywords in a list

**Input**:

- keyword (required): The keyword phrase
- language (optional): Language code (en, de, fr, es, it, nl, pt, ru, zh, ja)

**Output**:

- Search volume (monthly)
- CPC (cost-per-click) range
- Keyword difficulty (0-100 scale)
- Competition level
- Trend data
- Related metrics

**Example workflow**:

```text
1. User asks: "Should I target 'project management software' or 'best project management tools'?"
2. Analyze both keywords
3. Compare: volume, difficulty, CPC
4. Recommend best opportunity
5. Explain reasoning (feasibility vs. value)
```

### 2. get_related_keywords

**Purpose**: Discover semantically related keywords and variations

**When to use**:

- Finding keyword cluster topics
- Discovering long-tail variations
- Identifying question-format queries
- Content gap analysis
- Building topic hierarchies
- Planning content clusters

**Input**:

- keyword (required): Seed keyword to find related terms
- language (optional): Language code

**Output**:

- Related keyword variations
- Long-tail opportunities
- Question-based formats
- Semantic synonyms
- Content cluster suggestions
- Search suggestion variations

**Example workflow**:

```text
1. User has pillar keyword: "project management"
2. Get related keywords
3. Identify clusters: tools, methodology, software, automation, team
4. Plan content structure (pillar + cluster pages)
5. Map internal linking strategy
```

### 3. analyze_seo

**Purpose**: Score a page's SEO performance for a target keyword

**When to use**:

- Optimizing existing content
- Competitive page analysis
- Finding on-page issues blocking rankings
- Creating optimization roadmaps
- Measuring improvement after changes
- Comparing your page vs. competitors

**Input**:

- url (required): Full URL to analyze (http/https)
- keyword (required): Target keyword for the page
- language (optional): Language code

**Output**:

- Overall SEO score (0-100)
- Title tag analysis
- Meta description evaluation
- H1 & heading structure
- Content quality metrics
- Keyword usage analysis
- Internal linking assessment
- Technical SEO elements
- Improvement recommendations (prioritized)

**Score interpretation**:

- 80-100: Excellent (ready to rank high)
- 60-79: Good (minor improvements needed)
- 40-59: Moderate (significant work required)
- 20-39: Poor (major optimization needed)
- 0-19: Critical (blocking rankings)

**Example workflow**:

```text
1. User: "Analyze my page for 'email marketing best practices'"
2. Get SEO score and component breakdown
3. Identify critical issues (missing H1, title tag optimization)
4. Suggest quick wins (meta description, keyword density)
5. Recommend deeper improvements (content expansion, semantic terms)
6. Provide implementation roadmap
```

### 4. get_semantic_analysis

**Purpose**: Identify semantic vocabulary and topic comprehensiveness

**When to use**:

- Understanding full semantic scope of topic
- Content enrichment and gap analysis
- Semantic optimization of existing content
- Building topically comprehensive articles
- Competitive semantic analysis
- Identifying missing vocabulary

**Input**:

- keyword (required): Main keyword to analyze
- language (optional): Language code

**Output**:

- Semantic vocabulary list (categorized)
- Core concepts and terms
- Technical terminology
- Related field vocabulary
- Question-format terms
- Semantic term frequency
- Coverage percentage metrics
- Gaps vs. competitors

**Semantic categories**:

- **Core concepts**: Essential vocabulary
- **Technical terms**: Industry-specific terminology
- **Related fields**: Adjacent topic areas
- **User intent terms**: Different search intents
- **Question formats**: "How to", "What is", "Why", etc.

**Example workflow**:

```text
1. User: "How can I make my article more comprehensive?"
2. Analyze semantic vocabulary for topic
3. Identify missing terms (gaps)
4. Suggest sections covering semantic concepts
5. Recommend natural incorporation of terms
6. Plan content structure improvements
```

## Keyword Research Pipeline

### Step 1: Analyze Seed Keyword

- Use `analyze_keyword` on main target
- Note: volume, difficulty, CPC, competition
- Assess opportunity viability
- Document baseline metrics

### Step 2: Find Related Variations

- Use `get_related_keywords` on seed
- Identify long-tail opportunities
- Discover question-format queries
- Find semantic clusters
- Organize by keyword intent

### Step 3: Compare & Prioritize

- Analyze top 5-10 related keywords
- Compare difficulty levels
- Assess relative volume
- Evaluate CPC across variations
- Create opportunity matrix

### Step 4: Plan Content Strategy

- Identify pillar keyword (broad topic)
- Select cluster keywords (subtopics)
- Plan internal linking structure
- Prioritize by opportunity score
- Create content roadmap

### Step 5: Execute & Measure

- Create content targeting keywords
- Optimize for semantic vocabulary
- Build internal linking
- Monitor rankings (2-4 weeks)
- Refine based on results

## Page Optimization Audit

### Step 1: Analyze Current State

- Use `analyze_seo` on target URL with keyword
- Get detailed score and component breakdown
- Document critical issues and quick wins
- Identify patterns across multiple pages

### Step 2: Prioritize Improvements

- Focus on high-priority items first
- Fix critical issues (title, H1, meta)
- Implement quick wins (keyword density, LSI)
- Plan deeper changes (content expansion)
- Create implementation checklist

### Step 3: Implement Changes

- Update title tag (50-60 characters, keyword-rich)
- Revise meta description (150-160 characters)
- Ensure proper H1 & heading structure
- Expand content with semantic terms
- Add/improve internal links
- Check technical elements (mobile, speed, schema)

### Step 4: Measure Improvement

- Re-analyze same URL after 1-2 weeks
- Compare old score vs. new score
- Verify all changes implemented
- Monitor ranking changes (2-4 weeks)
- Track traffic and CTR improvements
- Plan additional optimizations

### Step 5: Continuous Improvement

- Monitor rankings regularly
- Update content with fresh information
- Add new semantic terms as they emerge
- Strengthen internal linking
- Keep content evergreen
- Refresh based on seasonal trends

## Semantic Content Optimization

### Step 1: Understand Semantic Scope

- Use `get_semantic_analysis` on target keyword
- Review semantic vocabulary categories
- Note core concepts and technical terms
- Identify related field connections
- Assess coverage percentage

### Step 2: Analyze Current Content

- Review existing content structure
- Identify which semantic terms present
- Note missing vocabulary
- Assess depth of explanation
- Evaluate semantic comprehensiveness

### Step 3: Plan Content Enrichment

- List missing semantic terms (by priority)
- Plan sections covering key concepts
- Design explanations for technical terms
- Map relationships between concepts
- Outline internal linking opportunities

### Step 4: Implement Enrichment

- Add sections for major semantic concepts
- Naturally incorporate related vocabulary
- Explain technical terms clearly
- Show concept relationships
- Build internal links to related topics
- Ensure semantic term distribution

### Step 5: Measure Coverage

- Re-analyze semantic vocabulary
- Check coverage percentage increase
- Verify semantic term distribution
- Confirm internal linking proper
- Monitor ranking improvements
- Track engagement metrics

## Competitive Analysis Workflow

### Step 1: Analyze Your Page

- Use `analyze_seo` on your URL with target keyword
- Document score and key metrics
- Note strengths and weaknesses
- Identify optimization opportunities

### Step 2: Analyze Top Competitors

- Get URLs ranking for your target keyword
- Use `analyze_seo` on top 3 competitors
- Compare scores and components
- Identify their optimization strengths
- Note their semantic strategy

### Step 3: Identify Gaps

- Compare your page vs. competitors
- Find areas where you score lower
- Identify semantic terms they use you don't
- Note internal linking strategies
- Assess content depth differences

### Step 4: Plan Differentiation

- Find unique angles competitors miss
- Plan deeper content coverage
- Identify underutilized semantic terms
- Design better internal linking
- Create unique value proposition
- Plan content freshness strategy

### Step 5: Implement & Monitor

- Make planned improvements
- Target competitive keywords
- Build topical authority
- Monitor ranking progress
- Track traffic gains
- Refine based on results

## Topic Clustering Strategy

### Step 1: Define Pillar Topic

- Choose broad main keyword (pillar)
- Use `analyze_keyword` to understand scale
- Assess opportunity (volume + feasibility)
- Document pillar metrics

### Step 2: Identify Cluster Topics

- Use `get_related_keywords` on pillar
- Organize keywords into semantic clusters
- Plan cluster hierarchy
- Identify main cluster topics
- Note micro-cluster opportunities

### Step 3: Map Semantic Coverage

- Use `get_semantic_analysis` on pillar
- Review vocabulary across all clusters
- Ensure comprehensive topic coverage
- Identify gaps between clusters
- Plan cross-cluster connections

### Step 4: Create Content Structure

- Design pillar page (comprehensive, 3000+ words)
- Plan cluster pages (1500-2000 words each)
- Create micro-cluster content (500-1000 words)
- Map internal linking (hub-and-spoke)
- Plan topical authority roadmap

### Step 5: Build & Optimize

- Create pillar content first
- Build cluster pages
- Optimize all pages for target keywords
- Implement internal linking structure
- Monitor cluster performance
- Expand with new cluster topics

## Metrics Interpretation Guide

### Keyword Difficulty (KD)

- **0-20**: Very easy to rank (new sites, low barrier)
- **21-40**: Easy to rank (achievable with good content)
- **41-60**: Moderate (requires quality content + links)
- **61-80**: Hard to rank (established authority needed)
- **81-100**: Very hard (requires years of authority)

**Strategy**: New sites should target KD 20-40, established sites can aim for 40-60+

### Search Volume

- **10-100**: Very low (micro-niche)
- **100-1000**: Low (niche opportunities)
- **1000-10000**: Medium (viable traffic)
- **10000-100000**: High (major keywords)
- **100000+**: Very high (competitive)

**Strategy**: Balance volume with difficulty. High-difficulty keywords need high volume to justify effort.

### CPC (Cost-Per-Click)

- **$0-0.50**: Low (informational, less valuable)
- **$0.50-2**: Low-medium (some commercial value)
- **$2-5**: Medium-high (good commercial intent)
- **$5+**: High (premium keywords, strong intent)

**Strategy**: Higher CPC indicates commercial intent and audience value. Good for monetization.

### Best Opportunities

Target keywords with:

- **Volume**: 500-5000+ monthly searches
- **Difficulty**: KD 20-40 (achievable)
- **CPC**: $2+ (commercial value)
- **Competition**: Low-medium
- **Trend**: Growing or stable

### Semantic Coverage

- **90-100%**: Comprehensive, strong ranking potential
- **75-90%**: Well-optimized, good coverage
- **60-75%**: Moderate, missing key concepts
- **< 60%**: Weak, significant gaps

**Strategy**: Aim for 80%+ coverage for target keywords.

### SEO Scores

- **80+**: Ready to rank high, minimal improvements
- **60-79**: Good foundation, minor enhancements
- **40-59**: Moderate, needs significant work
- **20-39**: Poor, major optimization required
- **< 20**: Critical issues blocking all rankings

**Strategy**: Prioritize score improvements. Target 70+ before publication.

## Integration Patterns

### With Content Writing

1. **Research phase**: Use keyword + semantic analysis
2. **Planning phase**: Identify semantic vocabulary and gaps
3. **Writing phase**: Naturally incorporate semantic terms
4. **Optimization phase**: Score page and refine
5. **Publishing phase**: Set up internal linking
6. **Monitoring phase**: Re-analyze and improve

### With Content Audits

1. **Audit existing pages**: Score against target keywords
2. **Identify patterns**: Note common issues
3. **Prioritize fixes**: Focus on high-impact improvements
4. **Batch improvements**: Implement fixes across pages
5. **Measure results**: Track ranking and traffic gains
6. **Refine strategy**: Update based on learnings

### With Competitive Analysis

1. **Analyze competitors**: Score their pages
2. **Identify strategies**: Note their semantic approach
3. **Find opportunities**: Gaps they're missing
4. **Plan differentiation**: Your unique value
5. **Execute improvements**: Implement strategy
6. **Monitor progress**: Track competitive positioning

### With Topic Clustering

1. **Plan structure**: Semantic vocabulary guides clustering
2. **Create content**: Each cluster page targets semantic subtopic
3. **Optimize pages**: Individual SEO scoring per page
4. **Build links**: Internal linking shows semantic relationships
5. **Measure authority**: Monitor whole cluster performance
6. **Expand clusters**: Add micro-topics based on gaps

## Output Formats

### Keyword Research Reports

- Keyword opportunity matrix (volume x difficulty)
- Ranked recommendations by opportunity score
- CPC and commercial intent assessment
- Long-tail vs. high-volume analysis
- Seasonal and trend insights
- Content planning recommendations

### SEO Analysis Reports

- Overall score with component breakdown
- Critical issues vs. quick wins
- Before/after comparison
- Competitor comparison analysis
- Implementation roadmap
- Timeline and expected impact

### Semantic Analysis Reports

- Vocabulary categories and frequencies
- Coverage percentage and gaps
- Competitive semantic comparison
- Content enrichment recommendations
- Section planning guide
- Internal linking suggestions

### Competitive Analysis Reports

- Your page vs. top 3 competitors
- Score comparison table
- Semantic strategy differences
- On-page optimization comparison
- Differentiation opportunities
- Action priority list

## Common Scenarios

### Scenario 1: Launch New Blog Post

1. Brainstorm main keyword
2. Analyze keyword metrics and related keywords
3. Get semantic vocabulary
4. Plan content around semantic terms
5. Score page before publishing
6. Optimize based on recommendations
7. Publish and monitor

### Scenario 2: Optimize Underperforming Page

1. Analyze current page and keyword
2. Compare against top 3 competitors
3. Identify optimization gaps
4. Get semantic vocabulary for enhancement
5. Plan specific improvements
6. Implement changes
7. Re-analyze and measure improvement

### Scenario 3: Build Content Cluster

1. Choose pillar keyword
2. Get related keywords for clusters
3. Analyze semantic vocabulary of pillar
4. Create pillar page with semantic depth
5. Create cluster pages for related keywords
6. Score and optimize each page
7. Build internal linking
8. Monitor cluster authority

### Scenario 4: Competitive Keyword Research

1. Identify competitor target keywords
2. Analyze all competitor keywords
3. Compare your keyword strategy
4. Find uncontested opportunities
5. Plan content for gaps
6. Execute new content strategy
7. Monitor competitive positioning

## Tips for Success

### Keyword Selection

- Always balance opportunity with feasibility
- Consider your site authority when setting targets
- New sites should target KD < 40
- Established sites can pursue KD 40-60+
- Build portfolio: mix of volume and long-tail
- Plan 3-6 month timeline for major keywords

### Content Optimization

- Focus on user intent first
- Incorporate semantic terms naturally
- Avoid keyword stuffing (1-2% density)
- Maintain readability and flow
- Provide genuine value and expertise
- Keep content updated and fresh

### Measurement

- Track rankings, traffic, and CTR
- Re-analyze after 1-2 weeks of changes
- Expect 4-8 weeks for major ranking movement
- Monitor engagement metrics alongside rankings
- Update content regularly to maintain position
- Plan continuous improvement cycles

### Long-term Strategy

- Build topic authority in clusters
- Create pillar pages with depth
- Develop content hub linking structure
- Maintain semantic consistency
- Refresh content regularly
- Expand clusters with new subtopics
