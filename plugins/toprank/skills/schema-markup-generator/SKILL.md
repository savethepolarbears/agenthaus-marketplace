---
name: schema-markup-generator
description: Generate JSON-LD structured data for rich-result eligibility across common page types like FAQ, Article, Product, and LocalBusiness. Use when the user asks for schema markup, JSON-LD, structured data, rich snippets, FAQ schema, product schema, or search-result enhancements.
---

# Schema Markup Generator

Produce clean JSON-LD that matches the page's actual content and search goal.

## Inputs to gather

Determine:

- Page type
- URL, if available
- The important on-page facts: title, author, dates, product data, FAQ pairs, business details, prices, ratings
- Whether the user wants new schema or a review of existing schema

## Workflow

1. Choose the smallest schema type that truthfully fits the page.
2. If needed, recommend companion types such as `BreadcrumbList` or `FAQPage`.
3. Build a valid JSON-LD block using only fields the user can support with real content.
4. Call out missing required or recommended properties that prevent rich-result eligibility.
5. Provide implementation notes when page content must change to support the markup.

## Supported patterns

- `Article`
- `BlogPosting`
- `FAQPage`
- `HowTo`
- `Product`
- `LocalBusiness`
- `Organization`

## Output format

Return:

- The recommended schema type
- One JSON-LD block in a fenced `json` code block
- A short checklist of fields the page must visibly support
- Any validation or eligibility caveats

## Guardrails

- Do not fabricate ratings, reviews, prices, or business facts.
- Do not recommend schema types that the visible page content cannot support.
- Prefer one accurate schema block over a bloated mixed-schema payload.
