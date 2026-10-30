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

