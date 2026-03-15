---
name: social-content
description: Generate high-engagement social media posts for Twitter, LinkedIn, Instagram, and Facebook with platform-specific formatting, trend analysis, and content optimization. Use when the user asks to create social media content, draft posts, analyze social trends, or build a content calendar across multiple platforms.
---

# Social Media Content Creation

Generate platform-optimized social media content with engagement-driven formatting, trend awareness, and audience targeting.

## When to Use

- User asks to write a tweet, LinkedIn post, Instagram caption, or Facebook post
- User needs a content calendar or batch of social posts
- User wants to analyze trending topics for content ideas
- User needs to repurpose content across multiple platforms
- User asks for social media strategy or engagement optimization

## Steps

### 1. Understand the Brief

Gather the following from the user's request:

- **Topic or subject matter** — what the post is about
- **Target platform(s)** — Twitter, LinkedIn, Instagram, Facebook, or all
- **Tone** — professional, witty, casual, inspirational, educational (default: energetic and conversational)
- **Audience** — developers, marketers, executives, general public
- **Call to action** — what the user wants readers to do

### 2. Platform-Specific Content Rules

#### Twitter (X)
- **Character limit**: 280 characters maximum
- **Hook**: Open with a compelling first line that stops the scroll
- **Hashtags**: 2-3 relevant hashtags at the end
- **Engagement**: End with a question or call to action
- **Format**: Short, punchy sentences. Use line breaks for readability

#### LinkedIn
- **Length**: 500-1000 characters across 2-3 short paragraphs
- **Tone**: Professional yet personable; thought leadership style
- **Content**: Include actionable insights, data points, or brief anecdotes
- **Engagement**: End with a discussion question or clear CTA
- **Hashtags**: Up to 5 relevant professional hashtags

#### Instagram
- **Caption length**: 100-300 words with emotional storytelling
- **Structure**: Hook line, story/value, CTA
- **Hashtags**: 10-15 niche and broad hashtags in a separate block
- **Emojis**: Use strategically to break up text and add personality
- **Format**: Short paragraphs with line breaks between them

#### Facebook
- **Length**: 100-250 words, conversational tone
- **Structure**: Attention-grabbing opener, value delivery, engagement prompt
- **Engagement**: Ask opinion-based questions to drive comments
- **Links**: Include relevant links naturally within the post
- **Hashtags**: 1-3 hashtags maximum

### 3. Content Quality Checklist

Before delivering any post, verify:

- [ ] Hook is compelling and stops the scroll
- [ ] Content delivers clear value (insight, entertainment, education)
- [ ] Tone matches the platform and audience
- [ ] Character/length limits are respected
- [ ] Hashtags are relevant and varied (not repeated across posts)
- [ ] Call to action is clear and actionable
- [ ] No spelling or grammar errors
- [ ] Content is original and not generic filler

### 4. Trend Analysis (Optional)

When the user asks to analyze trends:

1. Research current trending topics in the user's industry or niche
2. Identify content themes with high engagement potential
3. Suggest 3-5 content angles based on trending conversations
4. Recommend optimal posting times based on platform best practices
5. Provide competitor content insights where available

### 5. Multi-Platform Repurposing

When creating content for multiple platforms from a single topic:

1. Start with the longest format (LinkedIn or Instagram)
2. Adapt the core message for each platform's constraints
3. Adjust tone and formatting per platform rules above
4. Ensure each version feels native to its platform, not copy-pasted
5. Present all versions grouped by platform with clear headers

## Output Format

Present each post in a clearly labeled block:

```
### [Platform Name]

[Post content here]

---
Characters: [count] | Hashtags: [count] | Estimated engagement: [low/medium/high]
```

## Audit Logging

All generated content is automatically logged to `social_audit.log` in the project directory for review and compliance tracking.
