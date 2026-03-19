---
description: Read, write, and manage Google Sheets spreadsheets. Usage: `/gog-workspace:sheets read <sheet_id>` or `/gog-workspace:sheets write <sheet_id> A1 "Hello"`
---

Given "$ARGUMENTS" as user input, execute Google Sheets operations using the `gog` CLI.

## Supported Operations

### Read
- **Read sheet**: `gog sheets read <sheet_id>`
- **Read range**: `gog sheets read <sheet_id> --range 'Sheet1!A1:D10'`
- **Read as CSV**: `gog sheets read <sheet_id> --csv`
- **Read cell notes**: `gog sheets notes <sheet_id>`
- **List tabs**: `gog sheets tabs <sheet_id>`

### Write
- **Write cell**: `gog sheets write <sheet_id> '<range>' '<value>'`
- **Write range**: `gog sheets write <sheet_id> 'A1:C3' --values '[["a","b","c"],["d","e","f"],["g","h","i"]]'`
- **Append row**: `gog sheets append <sheet_id> --values '["col1","col2","col3"]'`
- **Clear range**: `gog sheets clear <sheet_id> '<range>'`

### Export
- **Export as PDF**: `gog sheets export <sheet_id> --format pdf --out <path>`
- **Export as CSV**: `gog sheets export <sheet_id> --format csv --out <path>`
- **Export as XLSX**: `gog sheets export <sheet_id> --format xlsx --out <path>`

### Tab & Range Management
- **Create tab**: `gog sheets tab create <sheet_id> '<name>'`
- **Delete tab**: `gog sheets tab delete <sheet_id> '<name>'`
- **Named ranges**: `gog sheets ranges <sheet_id>`
- **Create named range**: `gog sheets range create <sheet_id> '<name>' '<range>'`

### Formatting
- **Bold range**: `gog sheets format <sheet_id> '<range>' --bold`
- **Set number format**: `gog sheets format <sheet_id> '<range>' --number-format '#,##0.00'`

## Instructions

1. Parse the user's intent from `$ARGUMENTS`
2. Use `--json` for data processing workflows
3. For write operations, validate the range format
4. Display tabular data in markdown tables when presenting to users
