---
description: Generate PDFs from HTML, URLs, or convert documents. Usage `/markupgo:pdf from-url https://example.com` or `/markupgo:pdf from-html '<h1>Invoice</h1>'`
---

# Generate PDFs

Use the MarkupGo PDF generation command to create professional PDFs from web content, HTML, or convert existing documents.

## Source Types

### From URL
Generate a PDF by capturing a website:
```
/markupgo:pdf from-url https://example.com
/markupgo:pdf from-url https://example.com/invoice --format a4 --margin 10mm
```

### From HTML
Generate a PDF from inline HTML:
```
/markupgo:pdf from-html '<h1>Invoice #001</h1><p>Total: $100</p>'
/markupgo:pdf from-html '<html><head><style>body{font-family:Arial}</style></head><body><h1>Report</h1></body></html>'
```

### From Markdown
Convert markdown to PDF:
```
/markupgo:pdf from-markdown '# My Report\n\n## Section 1\nContent here'
/markupgo:pdf from-markdown '# Invoice\n\n- Item 1: $50\n- Item 2: $30' --format a4
```

### Convert File to PDF
Convert DOCX, XLSX, or other document formats:
```
/markupgo:pdf convert-file document.docx
/markupgo:pdf convert-file spreadsheet.xlsx --sheet 0
```

## Options

**Page Format**
- `--format [a4|letter|legal|a3|a5]` — Page size (default: a4)

**Orientation**
- `--orientation [portrait|landscape]` — Page orientation (default: portrait)

**Margins**
- `--margin-top MM` — Top margin in millimeters
- `--margin-bottom MM` — Bottom margin
- `--margin-left MM` — Left margin
- `--margin-right MM` — Right margin
- `--margin MM` — Set all margins at once (default: 10mm)

**Header/Footer**
- `--header '<html>...</html>'` — Add header to every page
- `--footer '<html>...</html>'` — Add footer to every page
- `--page-numbers` — Include page numbers in footer
- `--print-background` — Render background colors and images

**Font Settings**
- `--font-scale 0.5-2.0` — Scale all fonts (default: 1.0)

**Quality**
- `--quality [low|medium|high]` — PDF compression (default: high)

**Delay**
- `--delay MS` — Wait before rendering (for async content to load)

## Common Use Cases

**Generate Invoice**
```
/markupgo:pdf from-html '<div style="font-family:Arial;max-width:600px"><h1>Invoice #001</h1><table><tr><td>Item</td><td>Price</td></tr><tr><td>Widget</td><td>$50</td></tr><tr><td>Service</td><td>$50</td></tr></table><h2>Total: $100</h2></div>' --format a4 --margin 15
```

**Capture Web Report**
```
/markupgo:pdf from-url https://analytics.example.com/report --format a4 --header '<h3>Analytics Report</h3>' --footer '<p>Page <span class="page"></span></p>'
```

**Convert Document**
```
/markupgo:pdf convert-file proposal.docx --quality high --print-background
```

**Newsletter Template**
```
/markupgo:pdf from-html '<html><body style="font-family:Georgia;background:#f5f5f5;margin:0"><div style="background:white;padding:20px;margin:20px"><h1>Monthly Newsletter</h1><p>News and updates...</p></div></body></html>' --format letter --page-numbers
```

**Multi-Page Document**
```
/markupgo:pdf from-markdown '# Chapter 1\n\nContent...\n\n# Chapter 2\n\nMore content...' --format a4 --page-numbers --print-background
```

## Output

The command returns:
- PDF file ID
- Download URL or file path
- Number of pages
- File size
- Generation time

PDFs can be downloaded directly or integrated into workflows for distribution, archiving, or further processing.
