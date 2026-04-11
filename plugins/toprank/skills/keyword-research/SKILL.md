---
name: keyword-research
description: Generate SEO keyword clusters, intent buckets, and prioritization recommendations from a topic, site, or competitor. Use when the user asks for keyword research, topic clusters, low-competition opportunities, content calendars, search intent mapping, or SEO planning.
---

# Keyword Research

You are doing practical SEO research that should end in a usable content plan, not a vague brainstorm.

## Inputs to gather

Collect what is missing:

- Business, product, or site topic
- Target audience
- Geographic focus, if any
- Conversion goal: traffic, leads, sales, or awareness
- Known competitors or adjacent sites

If the user already provided enough context, do not ask again.

## Workflow

1. Identify 5-10 seed terms that describe the core offer, the audience problem, and the desired outcome.
2. Expand each seed into variations:
   - commercial terms
   - informational questions
   - comparison terms
   - local modifiers
   - long-tail qualifiers
3. Group the ideas into clusters that could map to one page or one content hub.
4. Assign intent to each keyword:
   - informational
   - commercial investigation
   - transactional
   - navigational
5. Prioritize the clusters using practical heuristics:
   - likelihood to convert
   - content effort required
   - ranking difficulty relative to the user's authority
   - fit with the product or service

## Output format

Return:

- A short summary of the strongest opportunities
- A table with `keyword`, `intent`, `why it matters`, and `recommended asset`
- A ranked top-5 list of next actions

When useful, also propose:

- one pillar page
- three supporting articles
- one quick-win metadata update

## Guardrails

- Do not present invented volume numbers as facts.
- If search-volume or ranking data is missing, label it as directional.
- Prefer specific, shippable recommendations over giant keyword dumps.
