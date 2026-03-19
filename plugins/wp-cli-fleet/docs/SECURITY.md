# Security Guide

## Authentication

### SSH Transport

- Use SSH key-based authentication exclusively (no passwords)
- Store SSH keys with restricted permissions (`chmod 600`)
- Use a dedicated deployment user with limited shell access
- Consider SSH jump hosts for production environments

### REST Bridge

The companion plugin requires dual authentication:

1. **WordPress Application Password** — Scoped to a specific user with `manage_options` capability
2. **Shared secret header** (`X-Agentic-WP-Secret`) — A 48-character random string generated on plugin activation

Both must be present and valid for any REST request to be accepted.

### Credential Storage

- Store credentials in environment variables, never in fleet manifests or code
- Use `application_password_env` and `secret_env` fields in fleet.json to reference env vars
- Add credential env vars to `.env` files that are in `.gitignore`

## Safety Controls

### Read-Only Mode

Enable read-only mode on production sites to block all mutating REST operations. Updates can still be performed via SSH/WP-CLI directly.

### Allowed Mutations

When read-only mode is disabled, only operations in the allowed mutations list can execute. Configure this in the WordPress admin under **Tools > Agentic WP CLI**.

### Dry-Run First

The plugin defaults to dry-run mode for all update operations. The `--execute` flag must be explicitly passed to apply changes.

### Safety Hooks

The Claude Code plugin includes PreToolUse hooks that warn before:
- `wp core update` without `--dry-run`
- `wp db drop`, `wp db reset`, `wp db import`
- `wp search-replace` without `--dry-run`

## Audit Logging

All operations (REST and CLI) are logged with:
- Timestamp (UTC)
- Operation name
- Source (rest or cli)
- Status (success or error)

Logs are stored in `wp_options` and visible in the admin settings page. The most recent 200 entries are retained.

## Best Practices

1. **Principle of least privilege**: Use dedicated users for agentic access
2. **Network isolation**: Restrict REST endpoint access via firewall or `.htaccess`
3. **Rotate credentials**: Periodically rotate Application Passwords and shared secrets
4. **Monitor logs**: Review the activity log regularly for unexpected operations
5. **Production safety**: Keep read-only mode enabled on production; use SSH for updates
6. **Backup before updates**: Always export the database before running updates on production
