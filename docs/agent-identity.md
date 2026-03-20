# Agent Identity & Credential Management

## Current Architecture

AgentHaus plugins use static environment variables for credential management:

```
GITHUB_TOKEN=ghp_xxx...
CLOUDFLARE_API_TOKEN=xxx...
NOTION_API_KEY=ntn_xxx...
```

This is acceptable for **single-user, local-first** usage where the human operator manages their own `.env` file.

## Credential Best Practices (Current)

### Minimum Privilege
Each plugin should document the minimum scopes required. Use the `required_credentials` field in `plugin.json`:

```json
"required_credentials": [
  {
    "name": "GITHUB_TOKEN",
    "scopes": ["repo", "read:org"],
    "rotation": "90d",
    "description": "GitHub fine-grained PAT for repository access"
  }
]
```

### Token Types (Prefer Short-Lived)
| Service | Recommended Token Type | Max Lifetime |
|---------|----------------------|--------------|
| GitHub | Fine-grained PAT | 90 days |
| Cloudflare | Scoped API Token | No expiry (rotate manually) |
| Vercel | Scoped Token | No expiry (rotate manually) |
| Notion | Internal Integration Token | No expiry |
| ClickUp | Personal API Token | No expiry |
| Google Workspace | OAuth 2.0 refresh token | Revocable |

### Never Commit Credentials
- `.env` and `.env.local` are in `.gitignore`
- Use `${ENV_VAR}` interpolation in `.mcp.json` files
- Plugin hooks must never log credential values

## Future Architecture: OAuth 2.1 Agent Identity Broker

For enterprise multi-tenant deployments, the roadmap includes:

### Design
1. **Human Authentication**: Users authenticate via the `agenthaus-web` dashboard using OAuth 2.1
2. **Token Provisioning**: Dashboard provisions scoped, short-lived JWTs to agent sessions
3. **DPoP Binding** (RFC 9449): Tokens are bound to the requesting agent's proof-of-possession key
4. **Rotation**: Tokens auto-rotate on a configurable schedule (default: 1 hour)
5. **Audit Trail**: All token grants and revocations are logged

### Agent Identity Flow
```
Human → agenthaus-web dashboard → OAuth 2.1 login
  → Select plugin + scopes
  → Issue short-lived JWT with DPoP
  → Agent receives token via secure channel
  → Agent uses token for MCP server API calls
  → Token expires → Agent requests renewal
```

### Implementation Status
- [ ] Dashboard authentication (OAuth 2.1 provider)
- [ ] Token provisioning API
- [ ] Agent token renewal protocol
- [ ] DPoP support (RFC 9449)
- [ ] Audit logging
- [ ] Credential rotation enforcement

This is a **Phase 3** initiative. Current static env var approach is sufficient for the marketplace's current single-user deployment model.
