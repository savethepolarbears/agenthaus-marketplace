# toprank

Curated SEO workflows adapted from [nowork-studio/toprank](https://github.com/nowork-studio/toprank), the open-source Claude Code plugin for SEO and Google Ads. This AgentHaus package focuses on the portable SEO subset: keyword research, metadata optimization, and structured data generation.

## Platform Support

| Feature | Claude Code | Codex CLI | Gemini CLI | Cursor | Windsurf | Claude Desktop |
|---------|-------------|-----------|------------|--------|----------|----------------|
| Commands | n/a | n/a | n/a | n/a | n/a | n/a |
| Skills | full | full | full | full | full | n/a |
| MCP | n/a | n/a | n/a | n/a | n/a | n/a |
| Hooks | n/a | n/a | n/a | n/a | n/a | n/a |

## Included Skills

| Skill | What it does |
|---|---|
| `keyword-research` | Expands seed topics into prioritized keyword clusters by intent, difficulty, and content opportunity. |
| `meta-tags-optimizer` | Writes and refines title tags, meta descriptions, Open Graph tags, and CTR test variants. |
| `schema-markup-generator` | Produces JSON-LD schema for FAQ, Article, Product, LocalBusiness, and related page types. |

## Installation

```bash
/plugin install toprank@AgentHaus
```

## Usage

These skills are invoked automatically when the task matches, for example:

```text
Research keywords for a local bookkeeping service
Improve the title tag and meta description for this landing page
Generate FAQ schema for this pricing page
```

## Notes

- This package is intentionally narrow and portable: it vendors the reusable SEO skill surfaces from Toprank without assuming project-specific MCP servers or account credentials.
- For the full Toprank plugin, including Google Ads workflows and connector setup, use the upstream repository at `nowork-studio/toprank`.
