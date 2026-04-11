---
name: meta-tags-optimizer
description: Write and improve title tags, meta descriptions, Open Graph tags, and social preview copy for higher click-through rates. Use when the user asks to optimize metadata, improve CTR, fix title tags, write descriptions, or generate social meta tags.
---

# Meta Tags Optimizer

Create metadata that is specific, readable, and aligned with search intent.

## Inputs to gather

Get or infer:

- Page type
- Primary keyword
- Secondary keywords, if relevant
- Audience
- Primary call to action
- Existing title and description, if this is an optimization task

## Workflow

1. Identify the page's real search intent.
2. Draft 3 title-tag options that keep the primary keyword close to the front.
3. Draft 2-3 meta description options that explain the value clearly and invite the click.
4. If the user mentions social sharing, also generate:
   - `og:title`
   - `og:description`
   - `twitter:title`
   - `twitter:description`
5. Flag obvious issues in the current metadata:
   - duplication
   - weak differentiation
   - missing keyword alignment
   - truncation risk

## Constraints

- Aim for 50-60 characters for title tags.
- Aim for 120-160 characters for meta descriptions.
- Avoid keyword stuffing.
- Avoid generic filler like "Welcome to our website."

## Output format

Return:

- Recommended final title tag
- Recommended final meta description
- Two alternates worth testing
- A one-paragraph rationale tied to intent and CTR

If current metadata is already strong, say so and make only minimal changes.
