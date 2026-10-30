## Production Best Practices

- Default to `--dry-run` for all update operations
- Avoid core updates unless there is a clear backup or rollback path
- Run `wp core verify-checksums` before attempting reinstalls
- Use `wp cache flush` and `wp rewrite flush` after deployments, plugin changes, and permalink updates
- Export the database before running `search-replace` on production
- Pin plugin versions in managed environments rather than running `--all` updates
- Use `--format=json` for all commands to enable downstream automation
- For multisite, always specify `--url=` to avoid operating on the wrong subsite

