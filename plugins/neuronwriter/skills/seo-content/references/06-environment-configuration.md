## Environment Configuration

The MCP connection itself uses OAuth (hosted server at `https://app.neuronwriter.com/mcp/http`), so no key is needed for MCP tools.

Environment variables for the optional direct-API and publishing steps:

- `NEURONWRITER_API_KEY` — NeuronWriter REST API key (only for direct API calls outside MCP)
- `NEURONWRITER_WP_SITES` — WordPress credentials (JSON)
- `NEURONWRITER_OLLAMA_URL` — Ollama LLM endpoint (optional)
- `NEURONWRITER_LLM_MODEL` — Default LLM model (default: llama3.3)

Example `.env`:

```bash
NEURONWRITER_API_KEY=your_api_key_here
NEURONWRITER_WP_SITES={"mysite.com":{"url":"https://mysite.com","username":"user","password":"app_password"}}
NEURONWRITER_OLLAMA_URL=http://localhost:11434
NEURONWRITER_LLM_MODEL=llama3.3
```

