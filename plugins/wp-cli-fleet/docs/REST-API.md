# REST API Reference

The Agentic WP CLI companion WordPress plugin exposes REST endpoints at `/wp-json/agentic-wp-cli/v1/`.

## Authentication

All requests require dual authentication:

1. **HTTP Basic Auth** with a WordPress Application Password
2. **X-Agentic-WP-Secret** header with the shared secret

```bash
curl -u "username:application-password" \
  -H "X-Agentic-WP-Secret: your-shared-secret" \
  "https://example.com/wp-json/agentic-wp-cli/v1/health"
```

## Endpoints

### GET /health

Returns site health information.

**Response:**
```json
{
  "plugin_version": "1.0.0",
  "wp_version": "6.7.1",
  "php_version": "8.2.0",
  "site_label": "My Site",
  "environment": "production",
  "multisite": false,
  "read_only_mode": true,
  "timestamp": "2026-03-19T12:00:00+00:00"
}
```

### GET /inventory

Returns plugin and theme inventory with update availability.

**Response:**
```json
{
  "plugins": [
    {
      "file": "akismet/akismet.php",
      "name": "Akismet Anti-spam",
      "version": "5.3",
      "active": true,
      "update": "5.4"
    }
  ],
  "themes": [
    {
      "slug": "twentytwentyfour",
      "name": "Twenty Twenty-Four",
      "version": "1.0",
      "active": true,
      "update": false
    }
  ]
}
```

### GET /manifest

Returns site metadata for fleet discovery.

**Response:**
```json
{
  "site_label": "My Site",
  "environment": "production",
  "url": "https://example.com/",
  "wp_version": "6.7.1",
  "php_version": "8.2.0",
  "multisite": false,
  "rest_base": "https://example.com/wp-json/agentic-wp-cli/v1",
  "timestamp": "2026-03-19T12:00:00+00:00"
}
```

### POST /run

Execute a scoped operation. Mutating operations require read-only mode to be disabled and the operation to be in the allowed mutations list.

**Request:**
```json
{
  "operation": "plugin_update",
  "args": {
    "all": true,
    "dry_run": true
  }
}
```

**Available operations:**
| Operation | Mutating | Description |
|-----------|----------|-------------|
| `health` | No | Site health check |
| `inventory` | No | Plugin/theme inventory |
| `manifest` | No | Site manifest |
| `plugin_update` | Yes | Update plugins |
| `theme_update` | Yes | Update themes |
| `cache_flush` | Yes | Flush object cache |
| `rewrite_flush` | Yes | Flush rewrite rules |

**Dry-run response (plugin_update):**
```json
{
  "success": true,
  "data": [
    {
      "plugin": "akismet/akismet.php",
      "slug": "akismet",
      "new_version": "5.4",
      "dry_run": true
    }
  ],
  "mode": "dry-run"
}
```

## Error Responses

| Status | Meaning |
|--------|---------|
| 400 | Unknown operation |
| 401 | Missing or invalid authentication |
| 403 | Read-only mode or operation not allowed |
| 500 | Operation execution failed |
