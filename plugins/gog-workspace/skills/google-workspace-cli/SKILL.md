---
name: google-workspace-cli
description: Use when the user asks to interact with Google Workspace services — Gmail, Calendar, Drive, Docs, Sheets, Slides, Tasks, Contacts, Chat, Forms, Apps Script, Classroom, Admin, or Keep — via the gog CLI tool. Covers email management, calendar scheduling, file operations, document editing, spreadsheet manipulation, presentation creation, task tracking, classroom management, admin directory, and cross-service workflows.
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
brew install openclaw/tap/gogcli

# Store OAuth credentials
gog auth credentials set ~/Downloads/client_secret_*.json

# Add account
gog auth add you@gmail.com

# Set default account
export GOG_ACCOUNT=you@gmail.com
```

## Command Reference

Commands follow `gog <service> <command> [<args>] [flags]`. Run `gog <service> <command> --help` (or `gog schema --json`) for the full flag list. Calendar event commands take a calendar ID first (`primary` for the main calendar); Tasks commands take a task-list ID first (from `gog tasks lists list`).

### Gmail
```bash
gog gmail search '<query>' --max <n> --json             # Search threads
gog gmail messages search '<query>' --max <n> --json    # Search messages
gog gmail thread get <thread_id> --json                 # Read thread
gog gmail get <message_id> --json                       # Read message
gog gmail send --to <to> --subject '<subj>' --body '<body>'   # Send
gog gmail reply <message_id> --body '<text>'            # Reply (quotes original)
gog gmail reply <message_id> --body '<text>' --no-quote # Reply without quote
gog gmail drafts create --to <to> --subject '<subj>' --body '<body>'  # Create draft
gog gmail drafts list --json                            # List drafts
gog gmail drafts send <draft_id>                        # Send a draft
gog gmail labels list                                   # List labels
gog gmail labels modify <thread_id> --add '<label>'     # Apply label
gog gmail archive <message_id>                          # Archive
gog gmail settings filters list                         # List filters
gog gmail forward <message_id> --to <to>                # Forward
```

### Calendar
```bash
gog calendar events primary --today --json              # Today's events
gog calendar events primary --from <date> --to <date>   # Date range
gog calendar events primary --from <date> --days 7      # Next 7 days
gog calendar calendars                                  # List calendars
gog calendar create primary --summary '<title>' --from '<rfc3339>' --to '<rfc3339>'   # Create event
gog calendar create primary --summary '<title>' --from '<rfc3339>' --to '<rfc3339>' --attendees 'a@b.com'
gog calendar create primary --summary '<title>' --all-day --from <date> --to <next_date>  # All-day event
gog calendar update primary <event_id> --summary '<t>'  # Update
gog calendar delete primary <event_id>                  # Delete
gog calendar freebusy primary --from '<rfc3339>' --to '<rfc3339>'   # Check availability
gog calendar conflicts --from <date> --days 1           # Check conflicts
gog calendar propose-time primary <event_id>            # Link to propose a new time
gog calendar respond primary <event_id> --status accepted   # Accept invite
gog calendar respond primary <event_id> --status declined   # Decline
```

### Drive
```bash
gog drive ls --json                                     # List files
gog drive ls --parent <folder_id>                       # List folder
gog drive search '<query>' --json                       # Search
gog drive get <file_id>                                 # File info
gog drive upload <path>                                 # Upload
gog drive upload <path> --parent <folder_id>            # Upload to folder
gog drive download <file_id> --out <path>               # Download
gog drive download <file_id> --format pdf --out <path>  # Export a Google Doc/Sheet/Slide
gog drive mkdir '<name>'                                # Create folder
gog drive move <file_id> --parent <folder_id>           # Move
gog drive rename <file_id> '<name>'                     # Rename
gog drive copy <file_id> '<name>'                       # Copy
gog drive share <file_id> --to user --email <email> --role writer   # Share
gog drive share <file_id> --to anyone --role reader     # Public link
gog drive permissions <file_id>                         # List permissions
gog drive delete <file_id>                              # Move to trash (--permanent to delete)
```

### Docs
```bash
gog docs cat <doc_id>                                   # Read document as text
gog docs info <doc_id> --json                           # Document metadata
gog docs create '<title>'                               # Create empty
gog docs create '<title>' --file <path.md>              # Import markdown
gog docs export <doc_id> --format pdf --out <path>      # Export PDF
gog docs export <doc_id> --format docx --out <path>     # Export DOCX
gog docs export <doc_id> --format md --out <path>       # Export markdown
gog docs comments list <doc_id>                         # List comments
gog docs comments add <doc_id> '<text>'                 # Add comment
gog docs comments resolve <doc_id> <comment_id>         # Resolve
gog docs tabs list <doc_id>                             # List tabs
```

### Sheets
```bash
gog sheets metadata <sheet_id> --json                   # Tabs, sizes, named ranges
gog sheets get <sheet_id> 'Sheet1' --json               # Read a whole tab
gog sheets get <sheet_id> 'Sheet1!A1:D10'               # Read range
gog sheets update <sheet_id> 'Sheet1!A1' --values-json '[["<value>"]]'      # Write cell
gog sheets update <sheet_id> 'Sheet1!A1:C3' --values-json '[["a","b","c"]]' # Write range
gog sheets append <sheet_id> 'Sheet1!A:C' --values-json '[["a","b","c"]]'   # Append row
gog sheets clear <sheet_id> '<range>'                   # Clear range
gog sheets add-tab <sheet_id> '<name>'                  # Create tab
gog sheets export <sheet_id> --format csv --out <path>  # Export CSV
gog sheets export <sheet_id> --format xlsx --out <path> # Export XLSX
gog sheets notes <sheet_id> '<range>'                   # Read cell notes
gog sheets named-ranges list <sheet_id>                 # Named ranges
gog sheets format <sheet_id> '<range>' --format-json '{"textFormat":{"bold":true}}' --format-fields textFormat.bold   # Bold
```

### Slides
```bash
gog slides list-slides <presentation_id>                # List slides
gog slides create '<title>'                             # Create presentation
gog slides create-from-markdown '<title>' --content-file <path.md>      # From markdown
gog slides create-from-template <template_id> '<title>' --replace 'name=<value>'   # From template
gog slides export <presentation_id> --format pdf --out <path>    # Export PDF
gog slides export <presentation_id> --format pptx --out <path>   # Export PPTX
```

### Tasks
```bash
gog tasks lists list --json                             # List task lists
gog tasks list <tasklist_id> --json                     # List tasks
gog tasks add <tasklist_id> --title '<title>'           # Add task
gog tasks add <tasklist_id> --title '<title>' --due <date>        # With due date
gog tasks add <tasklist_id> --title '<title>' --notes '<notes>'   # With notes
gog tasks done <tasklist_id> <task_id>                  # Complete
gog tasks update <tasklist_id> <task_id> --title '<t>'  # Update
gog tasks delete <tasklist_id> <task_id>                # Delete
```

### Contacts & People
```bash
gog contacts list                                       # List contacts
gog contacts search '<query>'                           # Search contacts
gog contacts directory search '<query>'                 # Workspace directory search
gog people search '<query>'                             # People search
gog people get <user_id>                                # Get person
```

### Chat (Workspace)
```bash
gog chat spaces list                                    # List spaces
gog chat messages send spaces/<space_id> --text '<message>'   # Send message
gog chat messages list spaces/<space_id>                # List messages
gog chat messages list spaces/<space_id> --thread spaces/<space_id>/threads/<thread_id>   # Read thread
gog chat messages send spaces/<space_id> --thread spaces/<space_id>/threads/<thread_id> --text '<msg>'   # Reply
gog chat dm send <email> --text '<message>'             # Direct message
```

### Forms
```bash
gog forms create --title '<title>'                      # Create form
gog forms get <form_id> --json                          # Get form details
gog forms responses list <form_id> --json               # List responses
gog forms responses get <form_id> <response_id> --json  # Get one response
gog forms watch create <form_id> --topic projects/<project>/topics/<topic>   # Watch for responses
gog forms watch list <form_id>                          # List watches
gog forms watch delete <form_id> <watch_id>             # Delete watch
gog forms watch renew <form_id> <watch_id>              # Renew watch
```

### Classroom
```bash
gog classroom courses list --json                       # List courses
gog classroom roster <course_id> --json                 # List students/teachers
gog classroom coursework list <course_id> --json        # List assignments
gog classroom materials list <course_id> --json         # List materials
gog classroom announcements list <course_id> --json     # List announcements
gog classroom topics list <course_id> --json            # List topics
gog classroom invitations list --course <course_id> --json   # List invitations
gog classroom guardians list <student_id> --json        # List guardians
```

### Apps Script
```bash
gog appscript create --title '<title>'                  # Create project
gog appscript get <script_id> --json                    # Get project info
gog appscript content <script_id>                       # Fetch source code
gog appscript run <script_id> <function>                # Run deployed function
```

### Admin (Workspace)
```bash
gog admin users list --domain <domain> --json           # List users
gog admin users get <user_email> --json                 # Get user
gog admin users create <user_email> --given '<first>' --family '<last>'   # Create user
gog admin users suspend <user_email>                    # Suspend user
gog admin groups list --domain <domain> --json          # List groups
gog admin groups members list <group_email>             # List members
gog admin groups members add <group_email> <member_email>      # Add member
gog admin groups members remove <group_email> <member_email>   # Remove member
```

### Keep (Workspace-only)
```bash
gog keep create --title '<title>' --text '<text>'       # Create note
gog keep delete <note_id>                               # Delete note
```

### Auth Management
```bash
gog auth credentials set <path>                         # Store OAuth creds
gog auth add <email>                                    # Add account
gog auth add <email> --services drive,calendar          # Specific services
gog auth add <email> --readonly                         # Read-only access
gog auth list                                           # List accounts
gog auth list --check                                   # Verify tokens
gog auth status                                         # Auth status
gog auth alias set <alias> <email>                      # Set alias
gog auth manage                                         # Manage accounts
```

## Global Flags

| Flag | Env Var | Description |
|------|---------|-------------|
| `--account <email>` | `GOG_ACCOUNT` | Select Google account (email, alias, or `auto`) |
| `--client <name>` | — | Select OAuth client |
| `--json` | — | JSON output |
| `--plain` | — | TSV output (pipe-friendly) |
| `--force` | — | Skip confirmations |
| `--no-input` | — | Non-interactive mode |
| `--enable-commands <list>` | — | Restrict to specific command prefixes (sandboxing) |
| `--gmail-no-send` | — | Block Gmail send operations (agent safety) |
| `--readonly` | — | Block mutating API requests at runtime |
| `--dry-run` | — | Preview without executing |
| `--access-token <token>` | — | Direct token for CI/headless |
| `--home <dir>` | `GOG_HOME` | Override the config/data/state/cache root |

## Cross-Service Workflow Patterns

### Morning Briefing
```bash
gog calendar events primary --today --json
gog gmail search 'is:unread newer_than:12h' --json --max 20
gog tasks lists list --json
gog tasks list <tasklist_id> --json
```

### Meeting Prep
```bash
gog calendar events primary --from <date> --to <date> --json
gog drive search '<meeting topic>' --json
gog docs create 'Agenda: <meeting>' --file agenda.md
```

### Email-to-Task Pipeline
```bash
gog gmail search '<query>' --json
gog tasks add <tasklist_id> --title '<extracted action item>' --due <date>
gog gmail reply <message_id> --body 'Created task for this.'
```

### Document Collaboration
```bash
gog docs create '<title>' --file draft.md
gog drive share <doc_id> --to user --email <collaborator@email.com> --role writer
gog gmail drafts create --to <collaborator@email.com> --subject 'Doc for review' --body 'Please review: <link>'
```

## Best Practices

1. Always use `--json` flag when processing output programmatically
2. Confirm destructive operations (delete, trash) before executing
3. Use `--account` flag for multi-account setups
4. Prefer `gog gmail drafts create` over `gog gmail send` until the user confirms; then `gog gmail drafts send <draft_id>`
5. Batch related operations to minimize API calls
6. Use `gog auth add <email> --services <list> --readonly` for least-privilege access
