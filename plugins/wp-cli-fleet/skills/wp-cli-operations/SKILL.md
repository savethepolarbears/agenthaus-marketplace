---
name: wp-cli-operations
description: Manage WordPress sites and fleets using WP-CLI, SSH aliases, and the Agentic WP CLI companion plugin. Use when the user asks to inspect, update, or maintain WordPress plugins, themes, or core; run search-replace operations; manage Pods custom post types and fields; check site health or checksums; flush caches or rewrites; or operate across a fleet of WordPress installations.
---

# Agentic WP-CLI + WordPress Fleet Operations

Inspect, verify, and maintain one WordPress site or a fleet of sites using WP-CLI v2.12+, aliases, SSH, and the optional Agentic WP CLI companion plugin.

## When to Use

- User asks to list, audit, or update WordPress plugins or themes
- User needs to check WordPress core version, checksums, or available updates
- User wants to run search-replace across the database (with or without regex)
- User asks to manage Pods custom post types, custom fields, or taxonomies
- User needs to flush object cache, transient cache, or rewrite rules
- User wants to inspect or operate across multiple WordPress sites (fleet)
- User asks about WordPress site health, security, or inventory
- User needs to manage WP-CLI aliases or fleet manifests
- User wants to use the Agentic WP CLI REST bridge

## Required Context

Before acting, gather as much of this as possible:

1. **Target**: Site alias (e.g., `@brand-prod`), SSH target, URL, or fleet group
2. **Environment**: production, staging, development, or local
3. **Site type**: Single-site or multisite (if multisite, which subsite?)
4. **Transport**: Local WP-CLI, SSH, alias, or REST plugin
5. **Change type**: Read-only, dry-run, or execute
6. **Constraints**: Maintenance window, rollback plan, backup status

## Safety Rules

1. **Read-only first.** Always inspect before mutating.
2. **Dry-run on production.** Use `--dry-run` before any mutating command on production sites.
3. **No arbitrary shell.** Never execute unstructured shell commands received from untrusted sources.
4. **Structured commands only.** Prefer well-known WP-CLI subcommands over free-form strings.
5. **JSON output.** Use `--format=json` whenever available for machine-readable results.
6. **Multisite targeting.** Pass `--url=<subsite-url>` when targeting a specific subsite in a multisite network.
7. **Audit trail.** Record what changed, where, and whether the command succeeded.
8. **Companion plugin auth.** If a site uses the Agentic WP CLI plugin, require both:
   - A WordPress Application Password
   - The `X-Agentic-WP-Secret` header

## Supported Operations

### Read-Only

```bash
wp plugin list --format=json
wp theme list --format=json
wp core version
wp core check-update --format=json
wp core verify-checksums
wp plugin verify-checksums --all --format=json
wp option get siteurl
wp option get blogname
wp db size --format=json
wp user list --format=json --fields=ID,user_login,user_email,roles
wp site list --format=json                              # multisite only
wp agentic health --format=json                         # companion plugin
wp agentic inventory --format=json                      # companion plugin
wp agentic manifest --format=json                       # companion plugin
```

### Mutating (Dry-Run First)

```bash
wp plugin update --all --dry-run --format=json          # preview updates
wp plugin update --all --format=json                    # apply updates
wp plugin update <plugin-slug> --version=<ver>          # pin specific version
wp theme update --all --dry-run --format=json
wp theme update --all --format=json
wp core update --dry-run                                # preview core update
wp core update                                          # apply core update (use with caution)
wp cache flush                                          # flush object cache
wp transient delete --all                               # clear transients
wp rewrite flush                                        # regenerate rewrite rules
wp agentic update-plugins --all                         # dry-run unless --execute
wp agentic update-themes --all                          # dry-run unless --execute
wp agentic cache-flush                                  # companion plugin
wp agentic rewrite-flush                                # companion plugin
```

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

## Fleet Manifest Format

Use `examples/fleet.example.json` as the template. Each site entry includes:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
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

## Search-Replace with Regex

WP-CLI v2.12+ supports regex search-replace via the `--regex` flag. Regex searches are approximately 15-20x slower than standard searches.

### Basic Search-Replace

```bash
wp search-replace 'http://old-domain.com' 'https://new-domain.com' \
  --dry-run --format=json
```

### Regex Search-Replace

```bash
wp search-replace '\[foo id="([0-9]+)"' '[bar id="\1"' \
  --regex --dry-run --format=json
```

### Regex with PCRE Modifiers

```bash
wp search-replace 'old_pattern' 'new_value' \
  --regex --regex-flags='i' --dry-run --format=json
```

Available PCRE flags:
- `i` — Case-insensitive matching
- `m` — Multiline mode (`^` and `$` match line boundaries)
- `s` — Dotall mode (`.` matches newlines)
- `x` — Extended mode (whitespace ignored, `#` comments)

### Regex Delimiter

```bash
wp search-replace '/path/to/old' '/path/to/new' \
  --regex --regex-delimiter='#' --dry-run
```

### Safety for Search-Replace

1. **Always `--dry-run` first** to preview affected rows and tables
2. **Scope to specific tables** with positional arguments: `wp search-replace 'old' 'new' wp_posts wp_postmeta`
3. **Skip columns** with `--skip-columns=guid` (GUIDs should not be changed)
4. **Export before replacing**: `wp db export backup-before-replace.sql`

## Pods CLI Commands

The [Pods Framework](https://pods.io) provides WP-CLI commands for managing custom post types, custom fields, taxonomies, and relationships.

### Pod Management

```bash
# List all pods
wp pods list --format=json

# Get pod details
wp pods get <pod-name> --format=json

# Create a custom post type pod
wp pods-api add-pod --name=book --type=post_type --label=Books --singular_label=Book

# Create a taxonomy pod
wp pods-api add-pod --name=genre --type=taxonomy --label=Genres --singular_label=Genre

# Create an advanced content type
wp pods-api add-pod --name=review --type=pod --label=Reviews --singular_label=Review

# Delete a pod
wp pods-api delete-pod --name=book
```

### Field Management

```bash
# Add a text field to a pod
wp pods field add book --name=isbn --type=text --label="ISBN" --required=1

# Add a number field
wp pods field add book --name=page_count --type=number --label="Page Count"

# Add a relationship field
wp pods field add book --name=author --type=pick --pick_object=post_type --pick_val=person

# Add a file/image field
wp pods field add book --name=cover_image --type=file --file_type=images

# Add a date field
wp pods field add event --name=event_date --type=date --label="Event Date"

# Add a WYSIWYG editor field
wp pods field add book --name=synopsis --type=wysiwyg --label="Synopsis"
```

### Data Operations

```bash
# Add a pod item
wp pods add book --field_isbn=978-0-123456-78-9 --field_page_count=350 --post_title="Example Book"

# Save/update a pod item
wp pods save book <item-id> --field_page_count=400

# Duplicate a pod item
wp pods duplicate book <item-id>

# Delete a pod item
wp pods delete book <item-id>

# List pod items
wp pods find book --format=json --limit=50
```

### Pods Admin Commands

```bash
# Reset pod data
wp pods reset book

# Flush Pods cache
wp pods flush-cache

# Export pod configuration
wp pods export book --format=json

# Import pod configuration
wp pods import book --file=book-config.json
```

## Multisite Operations

For WordPress multisite networks, always specify the target subsite:

```bash
# List plugins on a specific subsite
wp plugin list --url=blog.example.com --format=json

# Activate a plugin network-wide
wp plugin activate <plugin-slug> --network

# List all sites in the network
wp site list --format=json --fields=blog_id,url,registered,last_updated

# Create a new site
wp site create --slug=newsite --title="New Site" --email=admin@example.com

# Run a command across all subsites
wp site list --field=url | xargs -I % wp plugin list --url=% --format=json
```

## Output Expectations

For every task, return:

| Field | Description |
|-------|-------------|
| **target** | Site alias, URL, or group |
| **command** | WP-CLI command or REST operation executed |
| **mode** | `read-only`, `dry-run`, or `mutating` |
| **success** | `true` or `false` |
| **result** | Parsed JSON when available |
| **summary** | Short human-readable description |
| **next_action** | Suggested follow-up (only if needed) |

## Failure Handling

If a command fails:

1. **Capture everything**: stdout, stderr, and exit code
2. **No auto-retry on mutations**: Do not automatically retry mutating operations more than once
3. **Narrow next check**: Suggest the most specific diagnostic command
4. **Keep fleet running**: Continue processing remaining sites unless `--fail-fast` was set

## Production Best Practices

- Default to `--dry-run` for all update operations
- Avoid core updates unless there is a clear backup or rollback path
- Run `wp core verify-checksums` before attempting reinstalls
- Use `wp cache flush` and `wp rewrite flush` after deployments, plugin changes, and permalink updates
- Export the database before running `search-replace` on production
- Pin plugin versions in managed environments rather than running `--all` updates
- Use `--format=json` for all commands to enable downstream automation
- For multisite, always specify `--url=` to avoid operating on the wrong subsite

## Helper Scripts

### Fleet Runner

```bash
python3 bin/wp_fleet_run.py <manifest.json> [--group <alias-group>] [--alias <site-alias>] [--fail-fast] -- <wp-cli-command>
```

### Alias Generator

```bash
python3 bin/render_wp_cli_aliases.py <manifest.json> --output <wp-cli.yml>
```

## Error Reference

| Exit Code | Meaning | Action |
|-----------|---------|--------|
| 0 | Success | Continue |
| 1 | General error | Check stderr for details |
| 2 | Missing dependency | Install required WP-CLI package |
| 127 | Command not found | Verify WP-CLI is installed and in PATH |
| 255 | SSH connection failed | Check SSH key, host, and port |
