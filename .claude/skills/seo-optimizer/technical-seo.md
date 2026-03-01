# Technical SEO Checklist — Codebase & Architecture

Applies to: Next.js, React, Astro, plain HTML. Run through all sections relevant to the target framework.

## Contents
- [Semantic HTML Architecture](#semantic-html-architecture)
- [Metadata & Open Graph](#metadata--open-graph)
- [Canonical URLs](#canonical-urls)
- [Core Web Vitals](#core-web-vitals)
- [Image Optimization](#image-optimization)
- [Mobile-First & Accessibility](#mobile-first--accessibility)
- [Crawlability & Indexation](#crawlability--indexation)
- [Framework-Specific Patterns](#framework-specific-patterns)

---

## Semantic HTML Architecture

Replace `<div>` soup with HTML5 landmark elements. Search engines and screen readers use these elements to understand page structure.

### Landmark element map

| Element | Use for | Do NOT use for |
|---|---|---|
| `<header>` | Site header, hero, logo + nav | Sub-section headers inside articles |
| `<nav>` | Primary navigation, breadcrumbs, pagination | Generic link groups |
| `<main>` | Primary page content (one per page) | Repeated layouts |
| `<article>` | Self-contained content: blog post, product card, review | Generic containers |
| `<section>` | Thematically grouped content with a heading | Generic layout wrappers |
| `<aside>` | Sidebar, related links, supplementary content | Ad wrappers that aren't thematically related |
| `<footer>` | Site footer, article byline | General bottom content |
| `<figure>` / `<figcaption>` | Images with captions, charts, code blocks | Decorative images |
| `<address>` | Contact info for the nearest `<article>` or `<body>` | General location text |

### Heading hierarchy rules

- One `<h1>` per page — matches the title tag keyword.
- Heading levels must not skip: `h1 → h2 → h3`. Never jump from `h1` to `h3`.
- Each heading must describe the content that follows it, not decorate it.

### Checklist

- [ ] `<div id="header">` → `<header>`
- [ ] `<div id="nav">` / `<div class="menu">` → `<nav>`
- [ ] `<div id="main">` / `<div class="content">` → `<main>`
- [ ] `<div class="post">` / `<div class="card">` → `<article>` (if self-contained)
- [ ] Generic content groups with headings → `<section>`
- [ ] `<div id="sidebar">` → `<aside>`
- [ ] `<div id="footer">` → `<footer>`
- [ ] Only one `<h1>` per page — audit and enforce
- [ ] Heading hierarchy is sequential (h1→h2→h3), no skips

---

## Metadata & Open Graph

### HTML — static pages

```html
<head>
  <!-- Core SEO -->
  <title>Primary Keyword: Benefit | Brand Name</title>
  <meta name="description" content="Primary keyword statement. Specific benefit. CTA verb + next step." />
  <link rel="canonical" href="https://example.com/current-page-url" />

  <!-- Open Graph (Facebook, LinkedIn, Slack unfurl) -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Primary Keyword: Benefit | Brand Name" />
  <meta property="og:description" content="Same as meta description (≤155 chars)" />
  <meta property="og:url" content="https://example.com/current-page-url" />
  <meta property="og:image" content="https://example.com/og-image-1200x630.jpg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="Brand Name" />
  <meta property="og:locale" content="en_US" />

  <!-- Twitter/X Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@brandhandle" />
  <meta name="twitter:title" content="Primary Keyword: Benefit | Brand Name" />
  <meta name="twitter:description" content="Same as meta description (≤155 chars)" />
  <meta name="twitter:image" content="https://example.com/og-image-1200x630.jpg" />
  <meta name="twitter:image:alt" content="Descriptive alt text for the OG image" />
</head>
```

### Next.js App Router — `metadata` export (preferred)

```tsx
// app/[slug]/page.tsx
import type { Metadata } from 'next'

export async function generateMetadata({ params }): Promise<Metadata> {
  const page = await fetchPage(params.slug)
  return {
    title: `${page.title} | Brand Name`,
    description: page.metaDescription,
    alternates: {
      canonical: `https://example.com/${params.slug}`,
    },
    openGraph: {
      title: `${page.title} | Brand Name`,
      description: page.metaDescription,
      url: `https://example.com/${params.slug}`,
      siteName: 'Brand Name',
      images: [
        {
          url: page.ogImage ?? 'https://example.com/og-default.jpg',
          width: 1200,
          height: 630,
          alt: page.ogImageAlt ?? page.title,
        },
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@brandhandle',
      title: `${page.title} | Brand Name`,
      description: page.metaDescription,
      images: [page.ogImage ?? 'https://example.com/og-default.jpg'],
    },
  }
}
```

### Next.js Pages Router — `<Head>` component

```tsx
// pages/[slug].tsx
import Head from 'next/head'

export default function Page({ page }) {
  return (
    <>
      <Head>
        <title>{page.title} | Brand Name</title>
        <meta name="description" content={page.metaDescription} />
        <link rel="canonical" href={`https://example.com/${page.slug}`} />
        <meta property="og:title" content={`${page.title} | Brand Name`} />
        <meta property="og:description" content={page.metaDescription} />
        <meta property="og:url" content={`https://example.com/${page.slug}`} />
        <meta property="og:image" content={page.ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      {/* page content */}
    </>
  )
}
```

### Astro — frontmatter metadata

```astro
---
// src/pages/[slug].astro
const { title, description, ogImage, slug } = Astro.props
---
<html lang="en">
  <head>
    <title>{title} | Brand Name</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={`https://example.com/${slug}`} />
    <meta property="og:title" content={`${title} | Brand Name`} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={ogImage} />
    <meta name="twitter:card" content="summary_large_image" />
  </head>
</html>
```

### Metadata validation checklist

- [ ] `<title>` present, ≤60 chars, primary keyword in first 5 words
- [ ] `<meta name="description">` present, ≤155 chars, includes CTA
- [ ] No duplicate title tags across pages
- [ ] No duplicate meta descriptions across pages
- [ ] `og:title` and `og:description` present
- [ ] `og:image` is 1200×630px, ≤8MB
- [ ] `og:image:alt` describes the image content
- [ ] `twitter:card` set to `summary_large_image` for image-rich content
- [ ] `lang` attribute set on `<html>` element

---

## Canonical URLs

- Every page **must** have a self-referencing canonical tag.
- Canonical must be the absolute URL (include `https://` and domain).
- Paginated pages: canonical points to the first page OR use `rel="next"` / `rel="prev"` for pagination signals.
- Syndicated content: the source page sets canonical to the original URL.
- Dynamic query strings (tracking params, filters): canonical strips parameters unless they produce unique, indexable content.

```html
<!-- Self-referencing canonical — required on every page -->
<link rel="canonical" href="https://example.com/exact/page/url" />
```

---

## Core Web Vitals

Google's three ranking signals (2026):

| Metric | Measures | Good threshold | Poor threshold |
|---|---|---|---|
| **LCP** (Largest Contentful Paint) | Loading performance | ≤2.5s | >4.0s |
| **INP** (Interaction to Next Paint) | Responsiveness to all interactions | ≤200ms | >500ms |
| **CLS** (Cumulative Layout Shift) | Visual stability | ≤0.1 | >0.25 |

> INP replaced FID (First Input Delay) in March 2024. Sites with INP >300ms experienced 31% more traffic drops in Google's December 2025 update.

### LCP optimization

1. **Preload the LCP asset** — identify the largest above-fold element (hero image, H1 text, video poster):

```html
<!-- Preload hero image (LCP candidate) -->
<link rel="preload" as="image" href="/hero.webp" fetchpriority="high" />

<!-- Next.js Image component with priority -->
<Image src="/hero.webp" alt="Hero description" priority width={1200} height={630} />
```

2. **Inline critical CSS** — avoid render-blocking stylesheets for above-fold content.
3. **Use a CDN** — serve static assets from the edge.
4. **Eliminate render-blocking resources** — defer non-critical JS.

### INP optimization

1. **Island architecture / partial hydration** — only hydrate interactive components (Astro's default; use Next.js `dynamic()` with `ssr: false` for client-only components).
2. **Minimize main thread work** — move heavy computation to Web Workers.
3. **Break up long tasks** — any JS task >50ms is a "long task." Use `scheduler.yield()` or `setTimeout(fn, 0)` to yield to the browser.
4. **Reduce third-party JS** — audit and defer analytics, chat widgets, and ad scripts.

```tsx
// Next.js dynamic import to defer client-side component hydration
import dynamic from 'next/dynamic'
const HeavyWidget = dynamic(() => import('./HeavyWidget'), { ssr: false })
```

### CLS prevention

1. Always set explicit `width` and `height` on `<img>` and `<video>` elements.
2. Reserve space for ads and embeds with CSS `aspect-ratio` or fixed dimensions.
3. Avoid inserting DOM elements above existing content after load.
4. Use `font-display: optional` or `font-display: swap` for custom fonts.

```html
<!-- Always specify dimensions to prevent layout shift -->
<img src="/product.webp" alt="Product name" width="800" height="600" loading="lazy" />
```

---

## Image Optimization

### Checklist for every image

- [ ] `alt` attribute present and descriptive (not empty, not "image of", not filename)
- [ ] `width` and `height` set explicitly (prevents CLS)
- [ ] `loading="lazy"` on all images **below the fold**
- [ ] `loading="eager"` (or `priority` in Next.js Image) on the **LCP image only**
- [ ] `fetchpriority="high"` on the LCP image
- [ ] WebP or AVIF format (superior compression vs JPEG/PNG)
- [ ] Responsive `srcset` for multiple viewport sizes
- [ ] Decorative images: `alt=""` and `role="presentation"` (hides from screen readers)

### Alt text quality rules

| Scenario | Bad alt | Good alt |
|---|---|---|
| Product image | `"image1.jpg"` | `"Blue running shoes with cushioned sole"` |
| Infographic | `"chart"` | `"Bar chart showing 34% CTR drop for AI Overview pages"` |
| Person photo | `"author"` | `"Jane Smith, Senior SEO Engineer at Acme Corp"` |
| Logo | `"logo"` | `"Acme Corp logo"` |
| Decorative divider | `"divider.png"` | `alt=""` |

### Next.js Image component — full pattern

```tsx
import Image from 'next/image'

// LCP image (above fold) — eager load with priority
<Image
  src="/hero.webp"
  alt="[Descriptive alt matching primary keyword]"
  width={1200}
  height={630}
  priority
  sizes="100vw"
/>

// Below-fold images — lazy load
<Image
  src="/feature.webp"
  alt="[Descriptive alt]"
  width={800}
  height={450}
  loading="lazy"
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

---

## Mobile-First & Accessibility

- `<meta name="viewport" content="width=device-width, initial-scale=1">` must be present.
- Google indexes the **mobile version** as primary. Test on 375px width minimum.
- Touch targets ≥44×44px (WCAG 2.5.5).
- Color contrast ratio ≥4.5:1 for body text (WCAG AA), ≥3:1 for large text.
- All interactive elements reachable via keyboard (`tabindex`, `:focus-visible` styles).
- `aria-label` on icon-only buttons: `<button aria-label="Close menu">`.

---

## Crawlability & Indexation

### robots.txt rules

```
User-agent: *
Disallow: /api/
Disallow: /admin/
Disallow: /_next/
Allow: /

# Allow beneficial AI crawlers (cited in AI Overviews)
User-agent: OAI-SearchBot
Allow: /

# Block non-beneficial training scrapers
User-agent: GPTBot
Disallow: /

Sitemap: https://example.com/sitemap.xml
```

### Sitemap requirements

- Include all canonical, indexable URLs.
- Exclude: `noindex` pages, paginated variants, parameter URLs, 404s.
- Maximum 50,000 URLs or 50MB per sitemap file; use a sitemap index for larger sites.
- Submit to Google Search Console and Bing Webmaster Tools.

### HTTP status code audit

- 200: All important pages must return 200.
- 301: Permanent redirects for moved/renamed pages (not 302).
- 404: Custom 404 page must exist and return HTTP 404 (not 200).
- Pages returning 4xx or 5xx may be excluded from Google's rendering queue entirely.

### Noindex audit

Ensure these pages have `<meta name="robots" content="noindex, follow">`:

- Thank-you / confirmation pages
- Login / account pages
- Duplicate paginated pages (beyond page 2)
- Search results pages
- Staging/preview environments

---

## Framework-Specific Patterns

### Next.js App Router — sitemap generation

```tsx
// app/sitemap.ts
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = await fetchAllPages()
  return [
    { url: 'https://example.com', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    ...pages.map(page => ({
      url: `https://example.com/${page.slug}`,
      lastModified: new Date(page.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ]
}
```

### Next.js App Router — robots.txt generation

```tsx
// app/robots.ts
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/admin/'] },
      { userAgent: 'GPTBot', disallow: '/' },
    ],
    sitemap: 'https://example.com/sitemap.xml',
  }
}
```

### JSON-LD schema injection — Next.js

```tsx
// Inject into <head> via Script component
import Script from 'next/script'

export default function Page({ schema }) {
  return (
    <>
      <Script
        id="schema-org"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      {/* page content */}
    </>
  )
}
```

> For schema templates, read `schema-templates.json` in this skill directory.
