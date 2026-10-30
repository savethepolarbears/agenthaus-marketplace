## Supported Operations

### Read-Only

```bash
wp plugin list --format=json
wp theme list --format=json
wp core version
wp core check-update --format=json
wp core verify-checksums
wp plugin verify-checksums --all --format=json
wp option get siteurl
wp option get blogname
wp db size --format=json
wp user list --format=json --fields=ID,user_login,user_email,roles
wp site list --format=json                              # multisite only
wp agentic health --format=json                         # companion plugin
wp agentic inventory --format=json                      # companion plugin
wp agentic manifest --format=json                       # companion plugin
```

### Mutating (Dry-Run First)

```bash
wp plugin update --all --dry-run --format=json          # preview updates
wp plugin update --all --format=json                    # apply updates
wp plugin update <plugin-slug> --version=<ver>          # pin specific version
wp theme update --all --dry-run --format=json
wp theme update --all --format=json
wp core update --dry-run                                # preview core update
wp core update                                          # apply core update (use with caution)
wp cache flush                                          # flush object cache
wp transient delete --all                               # clear transients
wp rewrite flush                                        # regenerate rewrite rules
wp agentic update-plugins --all                         # dry-run unless --execute
wp agentic update-themes --all                          # dry-run unless --execute
wp agentic cache-flush                                  # companion plugin
wp agentic rewrite-flush                                # companion plugin
```

