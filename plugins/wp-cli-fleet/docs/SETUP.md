# Setup Guide

## Claude Code Plugin Installation

Install the plugin from the AgentHaus marketplace:

```bash
/plugin install wp-cli-fleet
```

### Requirements

- WP-CLI v2.12+ (`wp --version` to check)
- Python 3.8+ (for fleet helper scripts)
- SSH key-based authentication for remote sites

### Verify WP-CLI

```bash
wp --version
# WP-CLI 2.12.0
```

If WP-CLI is not installed, follow the [official installation guide](https://wp-cli.org/#installing).

## WordPress Companion Plugin

The companion plugin provides REST API endpoints for sites where direct SSH access is not available.

### Installation

1. Copy `wordpress-plugin/agentic-wp-cli.php` to `wp-content/plugins/` on your WordPress site
2. Activate the plugin in WordPress admin
3. Go to **Tools > Agentic WP CLI** to configure settings

### Configuration

1. **Enable bridge**: Toggle to allow REST and CLI access
2. **Read-only mode**: Enable on production to block mutating operations via REST
3. **Shared secret**: Copy the generated secret for the `X-Agentic-WP-Secret` header
4. **Allowed mutations**: Select which mutating operations are permitted

### Authentication Setup

The companion plugin requires dual authentication:

1. **WordPress Application Password**: Create one at **Users > Your Profile > Application Passwords**
2. **Shared secret**: Set in the plugin settings and sent as `X-Agentic-WP-Secret` header

Store these as environment variables:

```bash
export WP_APP_PASSWORD="your-application-password"
export AGENTIC_SECRET="your-shared-secret"
```

## Fleet Setup

1. Copy `examples/fleet.example.json` and customize for your sites
2. Add SSH targets, paths, and alias groups
3. Generate alias file: `python3 bin/render_wp_cli_aliases.py fleet.json --output wp-cli.fleet.yml`
4. Verify: `wp @your-alias core version`

See [Fleet Management](FLEET-MANAGEMENT.md) for detailed configuration.
