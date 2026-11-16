---
description: Manage Google Drive files — list, search, upload, download, share, and organize. Usage: `/gog-workspace:drive list` or `/gog-workspace:drive search "budget 2025"`
argument-hint: "<list | search <query>>"
---

Given "$ARGUMENTS" as user input, execute Drive operations using the `gog` CLI.

## Supported Operations

### List & Search
- **List files**: `gog drive ls`
- **List folder**: `gog drive ls --parent <folder_id>`
- **Search files**: `gog drive search '<query>'`
- **File info**: `gog drive get <file_id>`

### Upload & Download
- **Upload file**: `gog drive upload <local_path>`
- **Upload to folder**: `gog drive upload <local_path> --parent <folder_id>`
- **Download file**: `gog drive download <file_id> --out <local_path>`
- **Export Google Doc**: `gog drive download <file_id> --format pdf --out <path>` (formats: pdf, docx, xlsx, pptx, csv, txt, md, png)

### Create & Organize
- **Create folder**: `gog drive mkdir '<name>'`
- **Move file**: `gog drive move <file_id> --parent <folder_id>`
- **Rename**: `gog drive rename <file_id> '<new_name>'`
- **Copy**: `gog drive copy <file_id> '<copy_name>'`
- **Trash**: `gog drive delete <file_id>` (moves to trash)
- **Delete permanently**: `gog drive delete <file_id> --permanent`

### Sharing & Permissions
- **Share with user**: `gog drive share <file_id> --to user --email <email> --role writer`
- **Share link**: `gog drive share <file_id> --to anyone --role reader`
- **List permissions**: `gog drive permissions <file_id>`
- **Remove access**: `gog drive unshare <file_id> <permission_id>` (get the ID from `gog drive permissions`)

## Instructions

1. Parse the user's intent from `$ARGUMENTS`
2. Use `--json` for programmatic processing
3. When uploading, confirm the local file exists first
4. For downloads, suggest a sensible output path if not specified
5. Display file metadata including name, type, size, and sharing status
