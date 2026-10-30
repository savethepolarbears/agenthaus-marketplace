## Common HTML Patterns

### Product Card

```html
<div style="width:300px;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);background:white">
  <img src="{{image_url}}" style="width:100%;height:200px;object-fit:cover">
  <div style="padding:16px">
    <h3 style="margin:0 0 8px;font-size:18px">{{product_name}}</h3>
    <p style="color:#666;margin:0 0 12px;font-size:14px">{{description}}</p>
    <div style="display:flex;justify-content:space-between;align-items:center">
      <span style="font-weight:bold;font-size:18px">${{price}}</span>
      <button style="background:#667eea;color:white;border:none;padding:8px 12px;border-radius:4px;cursor:pointer">Shop</button>
    </div>
  </div>
</div>
```

### Hero Banner

```html
<div style="width:1200px;height:400px;background:linear-gradient(135deg,{{color1}} 0%,{{color2}} 100%);display:flex;align-items:center;justify-content:center;text-align:center;padding:40px;box-sizing:border-box">
  <div>
    <h1 style="font-size:48px;margin:0 0 16px;color:white">{{headline}}</h1>
    <p style="font-size:18px;margin:0;color:rgba(255,255,255,0.9)">{{subtitle}}</p>
  </div>
</div>
```

### Social Media Card

```html
<div style="width:1080px;height:1080px;background:{{bg_color}};display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px;color:white;box-sizing:border-box">
  {{#if logo_url}}<img src="{{logo_url}}" style="width:80px;margin-bottom:20px">{{/if}}
  <h1 style="font-size:56px;margin:0 0 16px">{{headline}}</h1>
  <p style="font-size:24px;margin:0">{{subheading}}</p>
  {{#if cta}}<p style="font-size:16px;margin-top:24px;opacity:0.9">{{cta}}</p>{{/if}}
</div>
```

### Blog Header

```html
<div style="width:1200px;height:400px;background:url({{bg_image}}) center/cover;position:relative;display:flex;align-items:center;justify-content:center">
  <div style="position:absolute;inset:0;background:rgba(0,0,0,0.4)"></div>
  <div style="position:relative;z-index:1;text-align:center;color:white;max-width:800px;padding:20px">
    <h1 style="font-size:48px;margin:0 0 16px">{{title}}</h1>
    <p style="font-size:18px;margin:0 0 12px">{{subtitle}}</p>
    <p style="font-size:14px;opacity:0.9">By {{author}} • {{date}}</p>
  </div>
</div>
```

