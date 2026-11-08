# VistaSocial MCP Tools Reference

Tool names as exposed by the VistaSocial remote MCP server (`https://vistasocial.com/api/integration/mcp`),
re-verified against the live server schema in November 2026. In Claude Code the fully
qualified name is `mcp__plugin_vistasocial-scheduler_vistasocial__<tool>`; other clients use
`mcp__vistasocial__<tool>` or the bare name. Some tools are plan-gated: when the server
returns a plan or permission error, report it and do not retry.

## Core Tools Used by This Plugin

### Scheduling & Publishing

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `createOrUpdatePost` | Create, schedule, update or draft a post (replaces the old `schedulePost`) | `profile_id` (int or int[]), `message`, `publish_at` (ISO 8601 **with offset**, or `now`/`queue_next`), `timezone` (IANA), `tags` (string array), `customization.comments` (`[{"message": "..."}]` for first comments), `draft` |
| `approveOrRejectPost` | Approve/reject a post in review | publication id, decision |
| `deletePost` | Delete a scheduled/draft post | publication id |

### Content & Posts

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `listPosts` | Find posts by profile, date range, status or tag (replaces the old `searchPosts`) | `profile_ids` (number[]), `status` (array, e.g. `["SCHEDULED"]`), `dateFrom`/`dateTo` (`YYYY-MM-DD`), `tags`, `timezone`, `limit` |
| `getPost` | Get a single post | publication id |
| `listPostComments` | Comments on a post | publication id |
| `addInternalComment` | Internal note on a post | publication id, comment |
| `getPublishedPostPerformance` | Rank published posts by performance | profiles, date range |

### Profiles & Groups

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `findProfiles` | List/search profiles and their connection `status` (replaces `listProfiles`, `searchProfiles`, `listProfilesInGroup`) | `q`, `profile_id`, `profile_group_id`, `fields`, `limit` |
| `findProfileGroups` | List/search profile groups (replaces `listProfileGroups`) | `profile_group_name`, `profile_group_id` |

### Scheduling Intelligence

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `getOptimalPublishTimes` | Best two-hour windows with `lift` and `confidence` | `targets` (`[{profile_id, timezone}]`) or `profile_id[]`, `combined` |
| `getProfileQueues` | View posting queues | profile id |
| `listTags` | Existing tags (reuse instead of inventing new ones) | none |

### Other Available Tools

Inbox (`listInboxItems`, `inboxAction`, `getInboxStats`), tasks (`createOrUpdateTask`, `listTasks`,
`getTask`, `addTaskComment`), ideas (`createOrUpdateIdea`, `listIdeas`), media (`findMedia`,
`createMedia`), workflows and macros (`listWorkflows`, `listMacros`, `applyMacro`), reporting
(`getProfileMetrics`, `getSentimentReport`, `getIndustryBenchmark`), calendar
(`createOrUpdateCalendarNote`, `listExternalCalendars`), utilities (`whoami`, `listNetworks`,
`listTimezones`, `getVistaHelp`, `reportMcpIssue`).

---

## Renamed tools (old name -> current name)

| Old (do not call) | Current |
|---|---|
| `schedulePost` | `createOrUpdatePost` |
| `searchPosts` | `listPosts` |
| `listProfiles`, `searchProfiles`, `listProfilesInGroup` | `findProfiles` |
| `listProfileGroups` | `findProfileGroups` |
| `labels` (comma string) | `tags` (string array) |
| `comments: ["..."]` | `customization.comments: [{"message": "..."}]` |

---

## Rate Limit Reminder

**60 requests per minute** — hard ceiling across ALL tools listed above. Every tool call counts toward this limit, regardless of which tool is called. Monitor `x-vs-rate-limit-remaining` in every response.
