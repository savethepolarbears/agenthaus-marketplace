---
description: Dry-run or execute plugin, theme, or core updates on a WordPress site. Usage: /wp-cli-fleet:update <@alias | URL> [--execute] [--type=plugin|theme|core]
---

Run update operations on the specified WordPress site. Defaults to **dry-run mode** for safety.

**Target:** `$ARGUMENTS`

## Steps

1. **Parse arguments**: Extract the target alias/URL, update type (plugin, theme, or core), and whether `--execute` was specified.

2. **Default to dry-run**: Unless the user explicitly passes `--execute`, run all updates in dry-run mode first.

3. **For plugin updates** (dry-run):
   ```bash
   wp <target> plugin update --all --dry-run --format=json
   ```

4. **For theme updates** (dry-run):
   ```bash
   wp <target> theme update --all --dry-run --format=json
   ```

5. **For core updates** (dry-run):
   ```bash
   wp <target> core check-update --format=json
   ```

6. **Present the dry-run results** showing what would be updated, from which version to which version.

7. **If `--execute` is specified**: Ask for explicit confirmation, then run the actual update:
   ```bash
   wp <target> plugin update --all --format=json
   wp <target> theme update --all --format=json
   wp <target> core update
   ```

8. **After updates**: Verify the site is still accessible and report success/failure.

**Safety**: On production sites, always show dry-run results first and require confirmation before executing. Suggest creating a database backup with `wp db export` before core updates.
