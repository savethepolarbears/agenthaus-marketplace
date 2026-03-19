---
description: Check WordPress site health including core checksums, plugin integrity, and database status. Usage: /wp-cli-fleet:health <@alias | URL>
---

Run a comprehensive health check on the specified WordPress site.

**Target:** `$ARGUMENTS`

## Steps

1. **Core checksum verification**:
   ```bash
   wp <target> core verify-checksums
   ```

2. **Plugin checksum verification**:
   ```bash
   wp <target> plugin verify-checksums --all --format=json
   ```

3. **Core version and update status**:
   ```bash
   wp <target> core version
   wp <target> core check-update --format=json
   ```

4. **Database size**:
   ```bash
   wp <target> db size --format=json
   ```

5. **Inactive plugins** (potential cleanup candidates):
   ```bash
   wp <target> plugin list --status=inactive --format=json
   ```

6. **Companion plugin health** (if available):
   ```bash
   wp <target> agentic health --format=json
   ```

7. **Present a health report** with:
   - Core checksum status (pass/fail)
   - Plugin integrity status
   - Outdated plugins/themes count
   - Database size
   - Inactive plugin count
   - Overall health rating (healthy, needs attention, critical)
