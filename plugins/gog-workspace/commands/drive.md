---
description: Manage Google Drive files — list, search, upload, download, share, and organize. Usage: `/gog-workspace:drive list` or `/gog-workspace:drive search "budget 2025"`
---

Given "$ARGUMENTS" as user input, execute Drive operations using the `gog` CLI.

## Supported Operations

### List & Search
- **List files**: `gog drive list`
- **List folder**: `gog drive list --folder <folder_id>`
- **Search files**: `gog drive search '<query>'`
- **File info**: `gog drive info <file_id>`

### Upload & Download
- **Upload file**: `gog drive upload <local_path>`
- **Upload to folder**: `gog drive upload <local_path> --folder <folder_id>`
- **Download file**: `gog drive download <file_id> --out <local_path>`
- **Export Google Doc**: `gog drive export <file_id> --format pdf --out <path>`

### Create & Organize
- **Create folder**: `gog drive mkdir '<name>'`
- **Move file**: `gog drive move <file_id> <folder_id>`
- **Rename**: `gog drive rename <file_id> '<new_name>'`
- **Copy**: `gog drive copy <file_id>`
- **Delete**: `gog drive delete <file_id>`
- **Trash**: `gog drive trash <file_id>`

### Sharing & Permissions
- **Share with user**: `gog drive share <file_id> <email> --role writer`
- **Share link**: `gog drive share <file_id> --anyone --role reader`
- **List permissions**: `gog drive permissions <file_id>`
- **Remove access**: `gog drive unshare <file_id> <email>`

## Instructions

1. Parse the user's intent from `$ARGUMENTS`
2. Use `--json` for programmatic processing
3. When uploading, confirm the local file exists first
4. For downloads, suggest a sensible output path if not specified
5. Display file metadata including name, type, size, and sharing status
