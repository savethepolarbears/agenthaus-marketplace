## Fleet Manifest Format

Use `examples/fleet.example.json` as the template. Each site entry includes:

| Field | Type | Required | Description |
| ------- | ------ | ---------- | ------------- |
| `alias` | string | yes | WP-CLI alias (e.g., `@brand-prod`) |
| `label` | string | yes | Human-readable label |
| `environment` | string | yes | `production`, `staging`, `development`, or `local` |
| `groups` | array | yes | Alias groups this site belongs to |
| `url` | string | yes | Site URL |
| `ssh` | string | no | SSH user@host for SSH transport |
| `path` | string | no | WordPress root path on remote server |
| `http` | string | no | HTTP target for REST transport |
| `rest` | object | no | REST bridge configuration |

### SSH Site Example

```json
{
  "alias": "@brand-prod",
  "label": "Brand production",
  "environment": "production",
  "groups": ["@prod", "@brand"],
  "ssh": "deploy@brand.example.com",
  "path": "/srv/www/brand/current",
  "url": "https://brand.example.com"
}
```

### REST/Plugin Site Example

```json
{
  "alias": "@mag-prod",
  "label": "Magazine production",
  "environment": "production",
  "groups": ["@prod", "@magazine"],
  "http": "https://mag.example.com",
  "url": "https://mag.example.com",
  "rest": {
    "base_url": "https://mag.example.com/wp-json/agentic-wp-cli/v1",
    "username": "agentic-bot",
    "application_password_env": "MAG_PROD_WP_APP_PASSWORD",
    "secret_env": "MAG_PROD_AGENTIC_SECRET"
  }
}
```

