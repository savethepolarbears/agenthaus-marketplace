## Environment Configuration

Required environment variables:

- `NEURONWRITER_API_KEY` — Your NeuronWriter API key
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

