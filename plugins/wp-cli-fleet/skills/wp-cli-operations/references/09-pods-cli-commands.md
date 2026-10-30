## Pods CLI Commands

The [Pods Framework](https://pods.io) provides WP-CLI commands for managing custom post types, custom fields, taxonomies, and relationships.

### Pod Management

```bash
# List all pods
wp pods list --format=json

# Get pod details
wp pods get <pod-name> --format=json

# Create a custom post type pod
wp pods-api add-pod --name=book --type=post_type --label=Books --singular_label=Book

# Create a taxonomy pod
wp pods-api add-pod --name=genre --type=taxonomy --label=Genres --singular_label=Genre

# Create an advanced content type
wp pods-api add-pod --name=review --type=pod --label=Reviews --singular_label=Review

# Delete a pod
wp pods-api delete-pod --name=book
```

### Field Management

```bash
# Add a text field to a pod
wp pods field add book --name=isbn --type=text --label="ISBN" --required=1

# Add a number field
wp pods field add book --name=page_count --type=number --label="Page Count"

# Add a relationship field
wp pods field add book --name=author --type=pick --pick_object=post_type --pick_val=person

# Add a file/image field
wp pods field add book --name=cover_image --type=file --file_type=images

# Add a date field
wp pods field add event --name=event_date --type=date --label="Event Date"

# Add a WYSIWYG editor field
wp pods field add book --name=synopsis --type=wysiwyg --label="Synopsis"
```

### Data Operations

```bash
# Add a pod item
wp pods add book --field_isbn=978-0-123456-78-9 --field_page_count=350 --post_title="Example Book"

# Save/update a pod item
wp pods save book <item-id> --field_page_count=400

# Duplicate a pod item
wp pods duplicate book <item-id>

# Delete a pod item
wp pods delete book <item-id>

# List pod items
wp pods find book --format=json --limit=50
```

### Pods Admin Commands

```bash
# Reset pod data
wp pods reset book

# Flush Pods cache
wp pods flush-cache

# Export pod configuration
wp pods export book --format=json

# Import pod configuration
wp pods import book --file=book-config.json
```

