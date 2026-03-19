# Pods CLI Guide

Manage [Pods Framework](https://pods.io) custom post types, custom fields, taxonomies, and relationships via WP-CLI.

## Prerequisites

The Pods Framework plugin must be installed and active:

```bash
wp plugin install pods --activate
```

Verify installation:
```bash
wp plugin list --format=json | python3 -c "
import sys, json
plugins = json.load(sys.stdin)
pods = [p for p in plugins if p['name'] == 'pods']
print(json.dumps(pods, indent=2))
"
```

## Creating Pods

### Custom Post Type

```bash
wp pods-api add-pod --name=book --type=post_type --label=Books --singular_label=Book
```

### Custom Taxonomy

```bash
wp pods-api add-pod --name=genre --type=taxonomy --label=Genres --singular_label=Genre
```

### Advanced Content Type

Advanced content types use their own database table instead of `wp_posts`:

```bash
wp pods-api add-pod --name=review --type=pod --label=Reviews --singular_label=Review
```

### Extending Existing Types

Extend WordPress built-in types (users, media, comments):

```bash
wp pods-api add-pod --name=user --type=user --label=Users
wp pods-api add-pod --name=media --type=media --label=Media
```

## Adding Fields

### Text Fields

```bash
wp pods field add book --name=isbn --type=text --label="ISBN" --required=1
wp pods field add book --name=subtitle --type=text --label="Subtitle"
```

### Number and Currency

```bash
wp pods field add book --name=page_count --type=number --label="Page Count"
wp pods field add book --name=price --type=currency --label="Price"
```

### Rich Text

```bash
wp pods field add book --name=synopsis --type=wysiwyg --label="Synopsis"
wp pods field add book --name=notes --type=paragraph --label="Internal Notes"
```

### Date and Time

```bash
wp pods field add event --name=event_date --type=date --label="Event Date"
wp pods field add event --name=event_time --type=time --label="Event Time"
wp pods field add event --name=starts_at --type=datetime --label="Starts At"
```

### File and Image

```bash
wp pods field add book --name=cover_image --type=file --file_type=images --label="Cover Image"
wp pods field add book --name=sample_pdf --type=file --file_type=any --label="Sample PDF"
```

### Relationships

```bash
# Relate to another post type
wp pods field add book --name=author --type=pick --pick_object=post_type --pick_val=person --label="Author"

# Relate to a taxonomy
wp pods field add book --name=genres --type=pick --pick_object=taxonomy --pick_val=genre --label="Genres"

# Relate to users
wp pods field add book --name=editor --type=pick --pick_object=user --label="Editor"
```

### Boolean and Selection

```bash
wp pods field add book --name=is_featured --type=boolean --label="Featured"
wp pods field add book --name=status --type=pick --pick_object=custom-simple --pick_custom="Draft,Review,Published" --label="Status"
```

## Data Operations

### Create Items

```bash
wp pods add book --post_title="The Great Gatsby" --field_isbn=978-0743273565 --field_page_count=180
```

### Update Items

```bash
wp pods save book 42 --field_page_count=218 --field_is_featured=1
```

### Query Items

```bash
wp pods find book --format=json --limit=20
wp pods find book --format=json --where="field_is_featured=1"
```

### Duplicate and Delete

```bash
wp pods duplicate book 42
wp pods delete book 42
```

## Configuration Management

### Export

```bash
wp pods export book --format=json > book-pod-config.json
```

### Import

```bash
wp pods import book --file=book-pod-config.json
```

### Cache Management

```bash
wp pods flush-cache
```

## Common Patterns

### Create a Complete CPT with Fields

```bash
# Create the post type
wp pods-api add-pod --name=product --type=post_type --label=Products --singular_label=Product

# Add fields
wp pods field add product --name=sku --type=text --label="SKU" --required=1
wp pods field add product --name=price --type=currency --label="Price" --required=1
wp pods field add product --name=description --type=wysiwyg --label="Description"
wp pods field add product --name=image --type=file --file_type=images --label="Product Image"
wp pods field add product --name=category --type=pick --pick_object=taxonomy --pick_val=product_category --label="Category"
wp pods field add product --name=in_stock --type=boolean --label="In Stock"

# Create associated taxonomy
wp pods-api add-pod --name=product_category --type=taxonomy --label="Product Categories" --singular_label="Product Category"
```

## Field Type Reference

| Type | WP-CLI Value | Use Case |
|------|-------------|----------|
| Plain text | `text` | Short strings (titles, codes) |
| Paragraph | `paragraph` | Multi-line plain text |
| Rich editor | `wysiwyg` | Formatted content |
| Number | `number` | Integers and decimals |
| Currency | `currency` | Monetary values |
| Date | `date` | Date only |
| Time | `time` | Time only |
| Date/Time | `datetime` | Combined date and time |
| File/Image | `file` | Media uploads |
| Relationship | `pick` | Links to other content |
| Boolean | `boolean` | Yes/No toggle |
| Color | `color` | Color picker |
| Email | `email` | Email validation |
| Phone | `phone` | Phone formatting |
| Website | `website` | URL validation |
