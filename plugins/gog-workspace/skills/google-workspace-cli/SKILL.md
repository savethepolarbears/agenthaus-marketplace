---
name: google-workspace-cli
description: Use when the user asks to interact with Google Workspace services — Gmail, Calendar, Drive, Docs, Sheets, Slides, Tasks, Contacts, Chat, Forms, or Apps Script — via the gog CLI tool. Covers email management, calendar scheduling, file operations, document editing, spreadsheet manipulation, presentation creation, task tracking, and cross-service workflows.
---

# Google Workspace CLI (gog) Skill

Operate Google Workspace services from the terminal using the `gog` CLI (gogcli).

## When to Use

- User asks to send/read/search email
- User wants to check or create calendar events
- User needs to upload/download/share files on Google Drive
- User asks to create or edit Google Docs, Sheets, or Slides
- User wants to manage Google Tasks
- User needs to look up contacts or directory info
- User asks to send messages in Google Chat
- User wants a cross-service workflow (e.g., "find emails about X and create tasks from them")

## Prerequisites

The `gog` CLI must be installed and authenticated:

```bash
# Install
brew install gogcli

# Store OAuth credentials
gog auth credentials ~/Downloads/client_secret_*.json

# Add account
gog auth add you@gmail.com

# Set default account
export GOG_ACCOUNT=you@gmail.com
```

## Command Reference

### Gmail
```bash
gog gmail search '<query>' --max <n> --json    # Search threads
gog gmail messages '<query>' --max <n> --json  # Search messages
gog gmail read <thread_id> --json              # Read thread
gog gmail send <to> --subject '<subj>' --body '<body>'  # Send
gog gmail reply <thread_id> --body '<text>'    # Reply
gog gmail reply <thread_id> --body '<text>' --quote     # Reply with quote
gog gmail draft <to> --subject '<subj>' --body '<body>' # Create draft
gog gmail drafts --json                        # List drafts
gog gmail labels                               # List labels
gog gmail label <thread_id> <label>            # Apply label
gog gmail archive <thread_id>                  # Archive
gog gmail filters                              # List filters
gog gmail forward <msg_id> <to>                # Forward
```

### Calendar
```bash
gog calendar list --json                       # Today's events
gog calendar list --from <date> --to <date>    # Date range
gog calendar calendars                         # List calendars
gog calendar create '<title>' --start '<dt>' --end '<dt>'  # Create event
gog calendar create '<title>' --start '<dt>' --end '<dt>' --attendees 'a@b.com'
gog calendar create '<title>' --date <date>    # All-day event
gog calendar update <event_id> --title '<t>'   # Update
gog calendar delete <event_id>                 # Delete
gog calendar freebusy --start '<dt>' --end '<dt>'  # Check availability
gog calendar conflicts --date <date>           # Check conflicts
gog calendar rsvp <event_id> --accept          # Accept invite
gog calendar rsvp <event_id> --decline         # Decline
```

### Drive
```bash
gog drive list --json                          # List files
gog drive list --folder <id>                   # List folder
gog drive search '<query>' --json              # Search
gog drive info <file_id>                       # File info
gog drive upload <path>                        # Upload
gog drive upload <path> --folder <id>          # Upload to folder
gog drive download <id> --out <path>           # Download
gog drive export <id> --format pdf --out <p>   # Export
gog drive mkdir '<name>'                       # Create folder
gog drive move <id> <folder_id>                # Move
gog drive rename <id> '<name>'                 # Rename
gog drive copy <id>                            # Copy
gog drive share <id> <email> --role writer     # Share
gog drive share <id> --anyone --role reader    # Public link
gog drive permissions <id>                     # List permissions
gog drive delete <id>                          # Delete
```

### Docs
```bash
gog docs read <id> --json                      # Read document
gog docs read <id> --markdown                  # Read as markdown
gog docs create '<title>'                      # Create empty
gog docs create --file <path.md>               # Import markdown
gog docs export <id> --format pdf --out <p>    # Export PDF
gog docs export <id> --format docx --out <p>   # Export DOCX
gog docs export <id> --format md --out <p>     # Export markdown
gog docs comments <id>                         # List comments
gog docs comment <id> '<text>'                 # Add comment
gog docs comment resolve <comment_id>          # Resolve
gog docs tabs <id>                             # List tabs
```

### Sheets
```bash
gog sheets read <id> --json                    # Read sheet
gog sheets read <id> --range 'Sheet1!A1:D10'   # Read range
gog sheets read <id> --csv                     # Read as CSV
gog sheets write <id> '<range>' '<value>'      # Write cell
gog sheets write <id> 'A1:C3' --values '[...]' # Write range
gog sheets append <id> --values '[...]'        # Append row
gog sheets clear <id> '<range>'                # Clear range
gog sheets tabs <id>                           # List tabs
gog sheets tab create <id> '<name>'            # Create tab
gog sheets export <id> --format csv --out <p>  # Export CSV
gog sheets export <id> --format xlsx --out <p> # Export XLSX
gog sheets notes <id>                          # Read cell notes
gog sheets ranges <id>                         # Named ranges
gog sheets format <id> '<range>' --bold        # Format
```

### Slides
```bash
gog slides list <id>                           # List slides
gog slides create '<title>'                    # Create presentation
gog slides create --file <path.md>             # From markdown
gog slides create --template <id> --title '<t>'# From template
gog slides export <id> --format pdf --out <p>  # Export PDF
gog slides export <id> --format pptx --out <p> # Export PPTX
```

### Tasks
```bash
gog tasks lists                                # List task lists
gog tasks list --json                          # List tasks
gog tasks list --list '<name>'                 # Tasks from list
gog tasks add '<title>'                        # Add task
gog tasks add '<title>' --due '<date>'         # With due date
gog tasks add '<title>' --notes '<notes>'      # With notes
gog tasks complete <task_id>                   # Complete
gog tasks update <task_id> --title '<t>'       # Update
gog tasks delete <task_id>                     # Delete
```

### Contacts & People
```bash
gog contacts list                              # List contacts
gog contacts search '<query>'                  # Search contacts
gog people search '<query>'                    # Directory search
gog people get <email>                         # Get person
```

### Chat (Workspace)
```bash
gog chat spaces                                # List spaces
gog chat send <space_id> '<message>'           # Send message
gog chat messages <space_id>                   # List messages
gog chat thread <space_id> <thread_id>         # Read thread
gog chat reply <space_id> <thread_id> '<msg>'  # Reply
```

### Auth Management
```bash
gog auth credentials <path>                    # Store OAuth creds
gog auth add <email>                           # Add account
gog auth add <email> --services drive,calendar # Specific services
gog auth add <email> --readonly                # Read-only access
gog auth list                                  # List accounts
gog auth list --check                          # Verify tokens
gog auth status                                # Auth status
gog auth alias set <alias> <email>             # Set alias
gog auth manage                                # Manage accounts
```

## Global Flags

| Flag | Env Var | Description |
|------|---------|-------------|
| `--account <email>` | `GOG_ACCOUNT` | Select Google account |
| `--client <name>` | `GOG_CLIENT` | Select OAuth client |
| `--json` | `GOG_JSON=1` | JSON output |
| `--plain` | `GOG_PLAIN=1` | TSV output (pipe-friendly) |
| `--force` | — | Skip confirmations |
| `--no-input` | — | Non-interactive mode |

## Cross-Service Workflow Patterns

### Morning Briefing
```bash
gog calendar list --json
gog gmail search 'is:unread newer_than:12h' --json --max 20
gog tasks list --json
```

### Meeting Prep
```bash
gog calendar list --from <date> --to <date> --json
gog drive search '<meeting topic>' --json
gog docs create --file agenda.md
```

### Email-to-Task Pipeline
```bash
gog gmail search '<query>' --json
gog tasks add '<extracted action item>' --due '<date>'
gog gmail reply <thread_id> --body 'Created task for this.'
```

### Document Collaboration
```bash
gog docs create --file draft.md
gog drive share <doc_id> <collaborator@email.com> --role writer
gog gmail send <collaborator@email.com> --subject 'Doc for review' --body 'Please review: <link>'
```

## Best Practices

1. Always use `--json` flag when processing output programmatically
2. Confirm destructive operations (delete, trash) before executing
3. Use `--account` flag for multi-account setups
4. Prefer `gog gmail draft` over `gog gmail send` until user confirms
5. Batch related operations to minimize API calls
6. Use `gog auth add --services <list> --readonly` for least-privilege access
