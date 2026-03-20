# VistaSocial MCP Tools Reference — Non-Premium Account

This reference lists all VistaSocial MCP tools available on a standard (non-premium) account. Premium-only tools are listed at the bottom as blocked.

## Available Tools (Non-Premium)

### Scheduling & Publishing

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `schedulePost` | Schedule a post to a profile | `profile_id`, `network_code`, `message`, `publish_at` (ISO 8601), `labels` (comma string), `comments` (array) |
| `validatePostDraft` | Validate a post before scheduling | Similar to schedulePost params |

### Content & Posts

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `listPosts` | List posts with filters | `profile_ids`, date filters, `status` |
| `searchPosts` | Search posts by criteria | `profile_ids` (array), `dateFrom`, `dateTo`, `status` (array), `timezone` |
| `getPost` | Get a single post by ID | `post_id` |
| `addInternalPostComment` | Add internal note to a post | `post_id`, `comment` |
| `listPostComments` | List comments on a post | `post_id` |

### Profiles & Groups

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `listProfiles` | List/search connected profiles | `q` (search query) |
| `listProfileGroups` | List all profile groups | none |
| `listProfilesInGroup` | List profiles in a group | `profile_group_id` (UUID) |
| `getProfile` | Get profile details | `profile_id` |
| `searchProfiles` | Search profiles | `q` (search query) |

### Scheduling Intelligence

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `getOptimalPublishTimes` | Best times to post | `targets` array with `profile_id` and `timezone` |
| `getProfileQueues` | View posting queues | `profile_id` |

### Inbox & Engagement

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `listInboxItems` | List inbox messages/comments | filters |
| `replyToInboxItem` | Reply to a message/comment | `item_id`, `message` |
| `completeInboxConversation` | Mark conversation complete | `conversation_id` |
| `labelInboxItem` | Add label to inbox item | `item_id`, `label` |
| `setInboxItemSentiment` | Set sentiment on inbox item | `item_id`, `sentiment` |
| `starInboxConversation` | Star a conversation | `conversation_id` |
| `markInboxConversationAsSpam` | Mark as spam | `conversation_id` |

### Tasks

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `createTask` | Create a task | task details |
| `listTasks` | List tasks | filters |
| `updateTask` | Update a task | `task_id`, updates |
| `closeTask` | Close a task | `task_id` |
| `touchTask` | Touch/update task timestamp | `task_id` |
| `addTaskComment` | Comment on a task | `task_id`, `comment` |

### Content Ideas

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `createIdea` | Save a content idea | idea details |

### Workflows & Macros

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `listWorkflows` | List approval workflows | none |
| `listMacros` | List message macros | none |
| `applyMacro` | Apply a macro | `macro_id` |
| `createMacro` | Create a macro | macro details |

### Media

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `createMedia` | Upload media to library | media details |

### Team & Account

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `listTeamMembers` | List team members | none |
| `searchUsers` | Search users | `q` |
| `createUser` | Create a user | user details |
| `getAccountCapabilities` | Check account features | none |

### Calendar & External

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `createCalendarNote` | Add note to calendar | date, note |
| `listExternalCalendars` | List connected calendars | none |
| `manageExternalCalendar` | Manage calendar connection | calendar details |

### Utilities

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `listNetworks` | List supported networks | none |
| `listTimezones` | List available timezones | none |
| `reportMcpIssue` | Report an MCP issue | issue details |
| `submitMcpFeedback` | Submit feedback | feedback details |

### Vista Pages

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `getVistaPages` | Get Vista Page details | none |
| `importVistaPage` | Import a Vista Page | page details |

### Reporting (Limited)

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `getInboxReport` | Inbox analytics | date range |
| `getSentimentReport` | Sentiment analysis | date range |
| `getIndustryBenchmark` | Industry benchmark data | profile details |

### Boost

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `listBoostConfigurations` | List ad boost configs | none |

---

## BLOCKED — Premium-Only Tools (Do NOT Call)

| Tool | Why Blocked |
|------|-------------|
| `getPostMetrics` | Requires Premium Integrations add-on |
| `getProfileDailyMetrics` | Requires Premium Integrations add-on |
| `createProfileGroup` | Requires Premium plan |
| `searchProfileGroups` | Requires Premium plan |

If the user asks about engagement metrics, impressions, or reach data: explain that these require the VistaSocial Premium Integrations upgrade and suggest checking the VistaSocial dashboard directly.

---

## Rate Limit Reminder

**60 requests per minute** — hard ceiling across ALL tools listed above. Every tool call counts toward this limit, regardless of which tool is called. Monitor `x-vs-rate-limit-remaining` in every response.
