---
description: Manage fleet manifests, list aliases and groups, run commands across fleets, and generate alias files. Usage: /wp-cli-fleet:fleet <list | run | generate-aliases | add-site>
---

Manage WordPress fleet operations using fleet manifest files and WP-CLI aliases.

**Subcommand:** `$ARGUMENTS`

## Subcommands

### `list`
List all sites and groups defined in the fleet manifest:
```bash
python3 bin/wp_fleet_run.py examples/fleet.example.json --list
```

### `run <group-or-alias> -- <wp-cli-command>`
Run a WP-CLI command across all sites in a fleet group:
```bash
python3 bin/wp_fleet_run.py examples/fleet.example.json --group @prod -- plugin list --format=json
```

### `generate-aliases`
Generate a `wp-cli.yml` alias file from the fleet manifest:
```bash
python3 bin/render_wp_cli_aliases.py examples/fleet.example.json --output wp-cli.fleet.yml
```

### `add-site`
Help the user add a new site entry to the fleet manifest by collecting:
- Alias name (e.g., `@new-site-prod`)
- Label and environment
- SSH target or REST bridge URL
- WordPress path
- Group memberships

## Notes

- The fleet manifest file is at `examples/fleet.example.json` by default
- Users can specify a custom manifest path
- Use `--fail-fast` to stop fleet execution on the first error
- Use `--group` to filter by alias group or `--alias` to target a single site
