---
description: Manage Pods Framework custom post types, custom fields, taxonomies, and relationships via WP-CLI. Usage: /wp-cli-fleet:pods <list | create | add-field | find | export> [options]
---

Manage Pods Framework objects on a WordPress site using WP-CLI. Requires the [Pods Framework](https://pods.io) plugin to be installed and active.

**Subcommand:** `$ARGUMENTS`

## Subcommands

### `list`
List all registered pods:
```bash
wp pods list --format=json
```

### `create <type> <name> [options]`
Create a new pod. Types: `post_type`, `taxonomy`, `pod` (advanced content type), `user`, `media`, `comment`.

```bash
wp pods-api add-pod --name=book --type=post_type --label=Books --singular_label=Book
wp pods-api add-pod --name=genre --type=taxonomy --label=Genres --singular_label=Genre
wp pods-api add-pod --name=review --type=pod --label=Reviews --singular_label=Review
```

### `add-field <pod-name> <field-name> [options]`
Add a custom field to an existing pod:

```bash
wp pods field add book --name=isbn --type=text --label="ISBN" --required=1
wp pods field add book --name=page_count --type=number --label="Page Count"
wp pods field add book --name=author --type=pick --pick_object=post_type --pick_val=person
wp pods field add book --name=cover_image --type=file --file_type=images
wp pods field add event --name=event_date --type=date --label="Event Date"
wp pods field add book --name=synopsis --type=wysiwyg --label="Synopsis"
```

### `find <pod-name> [options]`
List items in a pod:
```bash
wp pods find book --format=json --limit=50
```

### `export <pod-name>`
Export a pod configuration:
```bash
wp pods export book --format=json
```

## Field Types

| Type | Description |
|------|-------------|
| `text` | Single-line text |
| `paragraph` | Multi-line plain text |
| `wysiwyg` | Rich text editor |
| `number` | Numeric value |
| `currency` | Currency field |
| `date` | Date picker |
| `datetime` | Date and time picker |
| `file` | File upload (use `--file_type=images` for images only) |
| `pick` | Relationship field (use `--pick_object` and `--pick_val`) |
| `boolean` | Yes/No toggle |
| `color` | Color picker |
| `email` | Email address |
| `phone` | Phone number |
| `website` | URL field |

## Data Operations

```bash
wp pods add book --field_isbn=978-0-123456-78-9 --post_title="My Book"
wp pods save book <item-id> --field_page_count=400
wp pods duplicate book <item-id>
wp pods delete book <item-id>
```

## Notes

- The Pods Framework plugin must be installed and active on the target site
- Use `wp plugin list --format=json | jq '.[] | select(.name=="pods")'` to verify Pods is installed
- All commands support the standard WP-CLI `--format=json` flag
