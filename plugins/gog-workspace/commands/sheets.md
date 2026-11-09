---
description: Read, write, and manage Google Sheets spreadsheets. Usage: `/gog-workspace:sheets read <sheet_id>` or `/gog-workspace:sheets write <sheet_id> A1 "Hello"`
argument-hint: "<read <sheet_id> | write <sheet_id> <range> <value>>"
---

Given "$ARGUMENTS" as user input, execute Google Sheets operations using the `gog` CLI.

## Supported Operations

### Read
- **Read sheet**: `gog sheets metadata <sheet_id>` (tabs and ranges), then `gog sheets get <sheet_id> 'Sheet1'`
- **Read range**: `gog sheets get <sheet_id> 'Sheet1!A1:D10'`
- **Read as CSV**: `gog sheets export <sheet_id> --format csv --out <path>`
- **Read cell notes**: `gog sheets notes <sheet_id> '<range>'`
- **List tabs**: `gog sheets metadata <sheet_id>`

### Write
- **Write cell**: `gog sheets update <sheet_id> '<range>' --values-json '[["<value>"]]'`
- **Write range**: `gog sheets update <sheet_id> 'Sheet1!A1:C3' --values-json '[["a","b","c"],["d","e","f"],["g","h","i"]]'`
- **Append row**: `gog sheets append <sheet_id> 'Sheet1!A:C' --values-json '[["col1","col2","col3"]]'`
- **Clear range**: `gog sheets clear <sheet_id> '<range>'`

### Export
- **Export as PDF**: `gog sheets export <sheet_id> --format pdf --out <path>`
- **Export as CSV**: `gog sheets export <sheet_id> --format csv --out <path>` (first tab)
- **Export as XLSX**: `gog sheets export <sheet_id> --format xlsx --out <path>`

### Tab & Range Management
- **Create tab**: `gog sheets add-tab <sheet_id> '<name>'`
- **Delete tab**: `gog sheets delete-tab <sheet_id> '<name>'`
- **Named ranges**: `gog sheets named-ranges list <sheet_id>`
- **Create named range**: `gog sheets named-ranges add <sheet_id> '<name>' '<range>'`

### Formatting
- **Bold range**: `gog sheets format <sheet_id> '<range>' --format-json '{"textFormat":{"bold":true}}' --format-fields textFormat.bold`
- **Set number format**: `gog sheets number-format <sheet_id> '<range>' --type NUMBER --pattern '#,##0.00'`

## Instructions

1. Parse the user's intent from `$ARGUMENTS`
2. Use `--json` for data processing workflows
3. For write operations, validate the range format
4. Display tabular data in markdown tables when presenting to users
