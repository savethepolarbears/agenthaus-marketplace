---
description: Get plugin, theme, and core inventory for a WordPress site or fleet group. Usage: /wp-cli-fleet:inventory <@alias | URL | @group>
---

Gather a complete inventory of plugins, themes, and WordPress core version for the specified target.

**Target:** `$ARGUMENTS` (a WP-CLI alias like `@brand-prod`, an SSH target, a URL, or a fleet group like `@prod`)

## Steps

1. **Determine transport**: Identify whether the target is a local path, SSH alias, fleet group, or REST endpoint.

2. **Collect plugin inventory**:
   ```bash
   wp <target> plugin list --format=json
   ```

3. **Collect theme inventory**:
   ```bash
   wp <target> theme list --format=json
   ```

4. **Check core version and updates**:
   ```bash
   wp <target> core version
   wp <target> core check-update --format=json
   ```

5. **For fleet groups**: If the target is a group (e.g., `@prod`), iterate across all sites in the group and aggregate results per site.

6. **Present results** as a structured summary table showing:
   - Plugin name, version, status (active/inactive), update available
   - Theme name, version, status, update available
   - Core version and available update

Always use `--format=json` for machine-readable output and parse the results into a human-readable summary.
