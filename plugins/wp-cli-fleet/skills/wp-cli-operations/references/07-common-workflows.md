## Common Workflows

### Inventory One Site via SSH

```bash
wp --ssh=deploy@example.com/srv/www/site/current plugin list --format=json
wp --ssh=deploy@example.com/srv/www/site/current theme list --format=json
wp --ssh=deploy@example.com/srv/www/site/current core check-update --format=json
```

### Inventory One Site via Alias

```bash
wp @brand-prod plugin list --format=json
wp @brand-prod theme list --format=json
wp @brand-prod core check-update --format=json
```

### Dry-Run Plugin Updates on All Production Sites

```bash
python3 bin/wp_fleet_run.py examples/fleet.example.json \
  --group @prod \
  -- plugin update --all --dry-run --format=json
```

### Generate Alias File from Fleet Manifest

```bash
python3 bin/render_wp_cli_aliases.py examples/fleet.example.json \
  --output wp-cli.fleet.yml
```

### REST Bridge: Health Check

```bash
curl -u "agentic-bot:${WP_APP_PASSWORD}" \
  -H "X-Agentic-WP-Secret: ${AGENTIC_SECRET}" \
  "https://example.com/wp-json/agentic-wp-cli/v1/health"
```

### REST Bridge: Inventory

```bash
curl -u "agentic-bot:${WP_APP_PASSWORD}" \
  -H "X-Agentic-WP-Secret: ${AGENTIC_SECRET}" \
  "https://example.com/wp-json/agentic-wp-cli/v1/inventory"
```

### REST Bridge: Plugin Update Dry-Run

```bash
curl -u "agentic-bot:${WP_APP_PASSWORD}" \
  -H "Content-Type: application/json" \
  -H "X-Agentic-WP-Secret: ${AGENTIC_SECRET}" \
  -d '{"operation":"plugin_update","args":{"all":true,"dry_run":true}}' \
  "https://example.com/wp-json/agentic-wp-cli/v1/run"
```

