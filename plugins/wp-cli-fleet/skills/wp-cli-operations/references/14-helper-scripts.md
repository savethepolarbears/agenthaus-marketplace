## Helper Scripts

### Fleet Runner

```bash
python3 bin/wp_fleet_run.py <manifest.json> [--group <alias-group>] [--alias <site-alias>] [--fail-fast] -- <wp-cli-command>
```

### Alias Generator

```bash
python3 bin/render_wp_cli_aliases.py <manifest.json> --output <wp-cli.yml>
```

