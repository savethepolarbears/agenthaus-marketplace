# knowledge-synapse

RAG agent combining Context7 docs, Notion memory, and Google Drive search for intelligent knowledge retrieval.

## Platform Support

| Feature | Claude Code | Codex CLI | Gemini CLI | Cursor | Windsurf | Claude Desktop |
|---------|-------------|-----------|------------|--------|----------|----------------|
| Commands | n/a | n/a | n/a | n/a | n/a | n/a |
| Skills | full | full | full | full | full | n/a |
| MCP | full | none | full | full | partial | full |
| Hooks | n/a | n/a | n/a | n/a | n/a | n/a |

## Prerequisites

| Variable | Description |
|---|---|
| `CONTEXT7_KEY` | Context7 API key for library documentation |
| `NOTION_KEY` | Notion integration API key |
| `GOOGLE_DRIVE_TOKEN` | Google Drive OAuth token |

## Installation

```bash
/plugin install knowledge-synapse
```

## Usage

### Skills

#### research

Deep research skill that queries all three knowledge sources and synthesizes results.

```
> Use the research skill to find best practices for Next.js caching

The skill will:
1. Query Context7 for Next.js documentation
2. Search Notion for related notes and decisions
3. Search Google Drive for relevant documents
4. Synthesize findings into a unified answer
```

## Configuration

Add credentials to `.env`:

```bash
CONTEXT7_KEY=your-context7-key
NOTION_KEY=ntn_your-notion-key
GOOGLE_DRIVE_TOKEN=your-google-drive-token
```

## Architecture

Three-source RAG pipeline:

- **@upstash/context7-mcp** -- Hallucination-free library documentation retrieval
- **@modelcontextprotocol/server-notion** -- Personal knowledge base and notes
- **@modelcontextprotocol/server-google-drive** -- Document and file search across Drive

The research skill orchestrates queries across all three sources, deduplicates overlapping information, and synthesizes a coherent answer grounded in retrieved context.
