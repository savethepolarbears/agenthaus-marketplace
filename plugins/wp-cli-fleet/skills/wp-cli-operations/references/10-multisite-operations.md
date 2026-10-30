## Multisite Operations

For WordPress multisite networks, always specify the target subsite:

```bash
# List plugins on a specific subsite
wp plugin list --url=blog.example.com --format=json

# Activate a plugin network-wide
wp plugin activate <plugin-slug> --network

# List all sites in the network
wp site list --format=json --fields=blog_id,url,registered,last_updated

# Create a new site
wp site create --slug=newsite --title="New Site" --email=admin@example.com

# Run a command across all subsites
wp site list --field=url | xargs -I % wp plugin list --url=% --format=json
```

