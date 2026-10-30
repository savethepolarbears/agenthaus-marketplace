## Decision Flow

### Single Site

Prefer these transports in order:

1. **Local WP-CLI** — if running in the WordPress directory
2. **SSH** — `wp --ssh=deploy@example.com/srv/www/site/current <command>`
3. **Alias** — `wp @site-prod <command>`
4. **REST bridge** — via companion plugin endpoints

### Fleet (Multiple Sites)

Prefer these approaches in order:

1. **WP-CLI alias groups** — `wp @prod plugin list --format=json`
2. **Fleet runner script** — `python3 bin/wp_fleet_run.py fleet.json --group @prod -- plugin list --format=json`
3. **REST manifest discovery** — if SSH metadata is incomplete

