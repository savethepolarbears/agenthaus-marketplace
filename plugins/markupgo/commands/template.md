---
description: Manage reusable MarkupGo templates — create, list, browse, render with data. Usage `/markupgo:template list` or `/markupgo:template create 'My Card' '<html>'`
---

# Template Management

Use the MarkupGo template command to create, manage, and reuse HTML/CSS templates for consistent asset generation across projects.

## Create Templates

Save an HTML template for reuse:
```
/markupgo:template create 'product-card' '<div style="width:400px;padding:20px;border:1px solid #ddd"><h3>{{product}}</h3><p>{{description}}</p><p class="price">${{price}}</p></div>'
```

Create a template with variables:
```
/markupgo:template create 'blog-header' '<div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:60px;text-align:center"><h1 style="color:white">{{title}}</h1><p style="color:#eee;margin-top:10px">{{subtitle}}</p><p style="color:#aaa;font-size:12px">{{author}} • {{date}}</p></div>'
```

Create a social media template:
```
/markupgo:template create 'insta-story' '<div style="width:1080px;height:1920px;background:linear-gradient(45deg,{{color1}},{{color2}});display:flex;align-items:center;justify-content:center;flex-direction:column;color:white;text-align:center"><h1 style="font-size:72px;margin:0">{{headline}}</h1><p style="font-size:28px;margin:20px 0">{{subheading}}</p><p style="font-size:18px">{{cta}}</p></div>'
```

## List & Browse Templates

List all your templates:
```
/markupgo:template list
/markupgo:template list --format json
/markupgo:template list --tag product
```

Browse design templates from the marketplace:
```
/markupgo:template browse
/markupgo:template browse --category social-media
/markupgo:template browse --search 'product card'
```

Get template details:
```
/markupgo:template get 'product-card'
/markupgo:template get 'product-card' --show-variables
```

## Render Templates

Generate an image using a template with data:
```
/markupgo:template render 'product-card' --data '{"product":"Premium Plan","description":"Full features","price":"99"}'
```

Render with variables:
```
/markupgo:template render 'blog-header' --data '{
  "title": "Advanced SEO Techniques",
  "subtitle": "What You Need to Know in 2026",
  "author": "Sarah Johnson",
  "date": "April 10, 2026"
}' --viewport 1200x400
```

Render and customize:
```
/markupgo:template render 'insta-story' --data '{
  "color1": "#667eea",
  "color2": "#764ba2",
  "headline": "New Feature Launch",
  "subheading": "Out Now",
  "cta": "Learn More"
}' --device-scale 2 --format webp
```

## Batch Render

Render a template multiple times with different data:
```
/markupgo:template batch-render 'product-card' --data-file products.json
/markupgo:template batch-render 'blog-header' --data-csv articles.csv
```

Example data file (products.json):
```json
[
  {
    "product": "Starter Plan",
    "description": "Perfect for beginners",
    "price": "29"
  },
  {
    "product": "Pro Plan",
    "description": "For growing teams",
    "price": "79"
  },
  {
    "product": "Enterprise",
    "description": "Custom solutions",
    "price": "299"
  }
]
```

## Manage Templates

Update a template:
```
/markupgo:template update 'product-card' '<div style="...">Updated HTML</div>'
```

Delete a template:
```
/markupgo:template delete 'old-template'
```

Clone a template:
```
/markupgo:template clone 'product-card' 'product-card-alt'
```

Tag templates for organization:
```
/markupgo:template tag 'product-card' --add product,ecommerce,responsive
/markupgo:template tag 'blog-header' --add blog,marketing,hero
```

## Template Variables

Templates support Handlebars-style variables:
- `{{variable}}` — Insert value
- `{{#if condition}}...{{/if}}` — Conditional blocks
- `{{#each items}}...{{/each}}` — Loop over arrays
- `{{variable | uppercase}}` — Apply filters

Example with conditionals:
```html
<div style="padding:20px">
  <h2>{{product}}</h2>
  <p>{{description}}</p>
  {{#if on_sale}}
    <p style="color:red;font-size:24px">SALE: ${{sale_price}}</p>
    <p style="text-decoration:line-through">${{price}}</p>
  {{else}}
    <p style="font-size:24px">${{price}}</p>
  {{/if}}
  {{#if in_stock}}
    <button>Add to Cart</button>
  {{else}}
    <p style="color:gray">Out of Stock</p>
  {{/if}}
</div>
```

## Common Template Patterns

**Product Card Template**
```html
<div style="width:300px;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
  <img src="{{image_url}}" style="width:100%;height:200px;object-fit:cover">
  <div style="padding:16px">
    <h3 style="margin:0 0 8px">{{product_name}}</h3>
    <p style="color:#666;margin:0 0 12px">{{description}}</p>
    <div style="display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:20px;font-weight:bold">${{price}}</span>
      <button style="background:#667eea;color:white;border:none;padding:8px 16px;border-radius:4px">Shop</button>
    </div>
  </div>
</div>
```

**Social Media Card**
```html
<div style="width:1080px;height:1080px;background:linear-gradient(135deg,{{brand_color1}} 0%,{{brand_color2}} 100%);display:flex;align-items:center;justify-content:center;text-align:center;color:white;padding:40px;box-sizing:border-box">
  <div>
    <img src="{{logo_url}}" style="width:80px;margin-bottom:20px">
    <h1 style="font-size:56px;margin:0 0 16px">{{headline}}</h1>
    <p style="font-size:28px;margin:0 0 24px;opacity:0.9">{{subheading}}</p>
    <p style="font-size:18px;opacity:0.8">{{cta}}</p>
  </div>
</div>
```

**Blog Header Template**
```html
<div style="width:1200px;height:400px;background:url({{background_image}}) center/cover;display:flex;align-items:center;justify-content:center;text-align:center;color:white;position:relative">
  <div style="position:absolute;inset:0;background:rgba(0,0,0,0.3)"></div>
  <div style="position:relative;z-index:1;max-width:800px">
    <h1 style="font-size:48px;margin:0 0 16px">{{title}}</h1>
    <p style="font-size:20px;margin:0 0 20px;opacity:0.9">{{subtitle}}</p>
    <p style="font-size:14px">By {{author}} • {{date}}</p>
  </div>
</div>
```

## Output

Template operations return:
- Template ID for reference
- Variable list and requirements
- Usage examples
- Preview image (for browse)
- Tag information
- Creation/update timestamps
- Render output (image ID/URL when rendering)
