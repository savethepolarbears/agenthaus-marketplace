# WP-CLI Fleet

Agentic WP-CLI and WordPress fleet management plugin for Claude Code. Provides commands, agents, and skills for managing single WordPress sites or entire fleets via WP-CLI, SSH aliases, and a companion WordPress plugin.

## Features

- **Site inventory** — List plugins, themes, and core version with update status
- **Safe updates** — Dry-run by default, explicit `--execute` for mutations
- **Health checks** — Core checksums, plugin integrity, database status
- **Fleet operations** — Run commands across multiple sites via aliases and groups
- **Search-replace** — Full regex support with PCRE modifiers and dry-run preview
- **Pods CPT management** — Create and manage custom post types, fields, and taxonomies
- **Safety hooks** — Warn before destructive WP-CLI operations
- **Audit logging** — Track all WP-CLI operations for compliance
- **REST bridge** — Companion WordPress plugin for HTTP-based access
- **Fleet manifest** — JSON-based fleet configuration with SSH and REST transports

## Prerequisites

- **WP-CLI** v2.12+ installed and accessible as `wp`
- **Python 3.8+** for fleet helper scripts
- **SSH access** configured for remote site management (key-based auth recommended)
- **Pods Framework** plugin (optional, for Pods CPT commands)

## Installation

```bash
/plugin install wp-cli-fleet
```

For the WordPress companion plugin, copy `wordpress-plugin/agentic-wp-cli.php` to your WordPress site's `wp-content/plugins/` directory and activate it.

## Commands

| Command | Description |
|---------|-------------|
| `/wp-cli-fleet:inventory` | Get plugin/theme/core inventory for a site or fleet |
| `/wp-cli-fleet:update` | Dry-run or execute plugin/theme/core updates |
| `/wp-cli-fleet:health` | Check site health and integrity |
| `/wp-cli-fleet:fleet` | Manage fleet manifests and run fleet-wide commands |
| `/wp-cli-fleet:search-replace` | Run search-replace with regex support |
| `/wp-cli-fleet:pods` | Manage Pods custom post types and fields |

## Agents

| Agent | Model | Purpose |
|-------|-------|---------|
| `wp-fleet-operator` | sonnet | Fleet-wide operations across multiple sites |
| `wp-site-inspector` | haiku | Quick single-site diagnostics |

## Quick Start

### Single site inventory
```bash
wp @mysite plugin list --format=json
```

### Fleet-wide health check
```bash
python3 bin/wp_fleet_run.py examples/fleet.example.json --group @prod -- core verify-checksums
```

### Generate alias file
```bash
python3 bin/render_wp_cli_aliases.py examples/fleet.example.json --output wp-cli.fleet.yml
```

## Environment Variables

The companion WordPress plugin uses these environment variables for REST bridge access:

| Variable | Description |
|----------|-------------|
| `WP_APP_PASSWORD` | WordPress Application Password for REST auth |
| `AGENTIC_SECRET` | Shared secret for X-Agentic-WP-Secret header |

Fleet manifest entries reference per-site environment variables. See `examples/fleet.example.json`.

## Documentation

- [Setup Guide](docs/SETUP.md) — Installation and configuration
- [Fleet Management](docs/FLEET-MANAGEMENT.md) — Fleet manifest and alias management
- [REST API](docs/REST-API.md) — Companion plugin REST endpoints
- [Security](docs/SECURITY.md) — Authentication and safety best practices
- [Pods Guide](docs/PODS-GUIDE.md) — Custom post types and fields via CLI

## Architecture

```
wp-cli-fleet/
├── commands/           # 6 slash commands for common operations
├── agents/             # Fleet operator and site inspector agents
├── skills/             # Comprehensive WP-CLI operations skill
├── hooks/              # Safety hooks for destructive operations
├── bin/                # Python helper scripts for fleet automation
├── examples/           # Fleet manifest template
├── wordpress-plugin/   # Companion PHP plugin for REST bridge
└── docs/               # Developer documentation
```
