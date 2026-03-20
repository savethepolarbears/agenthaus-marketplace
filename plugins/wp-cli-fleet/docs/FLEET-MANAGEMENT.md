# Fleet Management

Manage multiple WordPress sites as a fleet using JSON manifests and WP-CLI aliases.

## Fleet Manifest

The fleet manifest is a JSON file describing all sites in your fleet. See `examples/fleet.example.json` for a complete template.

### Structure

```json
{
  "name": "My Fleet",
  "description": "Production and staging WordPress sites",
  "sites": [
    {
      "alias": "@site-prod",
      "label": "Site Production",
      "environment": "production",
      "groups": ["@prod"],
      "ssh": "deploy@site.example.com",
      "path": "/srv/www/site/current",
      "url": "https://site.example.com"
    }
  ]
}
```

### Site Fields

| Field | Required | Description |
|-------|----------|-------------|
| `alias` | Yes | WP-CLI alias (e.g., `@brand-prod`) |
| `label` | Yes | Human-readable name |
| `environment` | Yes | `production`, `staging`, `development`, or `local` |
| `groups` | Yes | Array of group aliases (e.g., `["@prod", "@brand"]`) |
| `url` | Yes | Site URL |
| `ssh` | No | SSH target (e.g., `deploy@host.com`) |
| `path` | No | WordPress root path on the server |
| `http` | No | HTTP target URL for REST transport |
| `rest` | No | REST bridge config (see below) |

### REST Bridge Configuration

For sites using the companion plugin instead of SSH:

```json
{
  "rest": {
    "base_url": "https://site.com/wp-json/agentic-wp-cli/v1",
    "username": "agentic-bot",
    "application_password_env": "SITE_WP_APP_PASSWORD",
    "secret_env": "SITE_AGENTIC_SECRET"
  }
}
```

## Alias Groups

Groups allow running commands across subsets of your fleet:

- `@prod` — All production sites
- `@staging` — All staging sites
- `@brand` — All sites for a specific brand
- `@shop` — All e-commerce sites

A site can belong to multiple groups.

## Fleet Runner

Run a WP-CLI command across all sites in a group:

```bash
# List all sites
python3 bin/wp_fleet_run.py fleet.json --list

# Plugin inventory on all production sites
python3 bin/wp_fleet_run.py fleet.json --group @prod -- plugin list --format=json

# Health check on a single site
python3 bin/wp_fleet_run.py fleet.json --alias @brand-prod -- core verify-checksums

# Stop on first failure
python3 bin/wp_fleet_run.py fleet.json --group @prod --fail-fast -- core version

# JSON output for automation
python3 bin/wp_fleet_run.py fleet.json --group @prod --json -- plugin list --format=json
```

## Alias File Generation

Generate a `wp-cli.yml` file from your fleet manifest:

```bash
python3 bin/render_wp_cli_aliases.py fleet.json --output wp-cli.fleet.yml
```

Then use aliases directly:

```bash
wp @brand-prod plugin list --format=json
wp @prod plugin list --format=json  # runs on all @prod sites
```

## Best Practices

- Keep production and staging sites in separate groups
- Use SSH key authentication (no passwords in manifests)
- Store REST credentials in environment variables, not in the manifest
- Run `--dry-run` on production groups before executing updates
- Use `--fail-fast` when testing connectivity across the fleet
