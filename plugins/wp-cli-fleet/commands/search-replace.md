---
description: Run WP-CLI search-replace with optional regex support. Always dry-runs first. Usage: /wp-cli-fleet:search-replace <@alias | URL> <old> <new> [--regex] [--regex-flags=<flags>]
---

Perform a database search-replace operation on a WordPress site. Always runs in **dry-run mode first** for safety.

**Arguments:** `$ARGUMENTS`

## Steps

1. **Parse arguments**: Extract target, old value, new value, and any flags (`--regex`, `--regex-flags`, `--skip-columns`).

2. **Suggest a backup first**:
   ```bash
   wp <target> db export backup-before-replace.sql
   ```

3. **Run dry-run** to preview changes:
   ```bash
   wp <target> search-replace '<old>' '<new>' --dry-run --format=json
   ```

   With regex:
   ```bash
   wp <target> search-replace '<pattern>' '<replacement>' --regex --dry-run --format=json
   ```

   With PCRE flags (e.g., case-insensitive):
   ```bash
   wp <target> search-replace '<pattern>' '<replacement>' --regex --regex-flags='i' --dry-run --format=json
   ```

4. **Present dry-run results** showing affected tables and row counts.

5. **Ask for confirmation** before executing the actual replacement.

6. **Execute** (only after explicit approval):
   ```bash
   wp <target> search-replace '<old>' '<new>' --format=json
   ```

## Common Use Cases

- **Domain migration**: `wp search-replace 'http://old.com' 'https://new.com' --skip-columns=guid`
- **Regex replacement**: `wp search-replace '\[shortcode id="([0-9]+)"' '[new_shortcode id="\1"' --regex`
- **Case-insensitive**: `wp search-replace 'old_value' 'new_value' --regex --regex-flags='i'`
- **Specific tables only**: `wp search-replace 'old' 'new' wp_posts wp_postmeta`

## Safety

- Always `--dry-run` first
- Always `--skip-columns=guid` for domain migrations
- Export database before executing on production
- Regex searches are ~15-20x slower than standard searches
