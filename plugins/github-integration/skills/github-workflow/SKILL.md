---
name: github-workflow
description: Manage GitHub issues and pull requests through structured workflows including creation, search, triage, and code review. Use when the user asks to create or search issues, open or review pull requests, manage labels, or automate GitHub repository workflows via the GitHub MCP server.
---

# GitHub Workflow Management

Streamline GitHub issue and pull request workflows with structured creation, search, triage, and review processes.

## When to Use

- User asks to create a new GitHub issue or pull request
- User wants to search or triage existing issues
- User needs to review open pull requests
- User asks to manage labels, milestones, or assignees
- User wants to understand the status of a repository's issues or PRs

## Prerequisites

- `GITHUB_TOKEN` environment variable must be set
- GitHub MCP server (`@modelcontextprotocol/server-github`) must be available
- Repository context should be identifiable from the current working directory

## Steps

### 1. Identify Repository Context

Before any operation:

1. Determine the current repository from git remote configuration
2. Confirm the repository owner and name with the user if ambiguous
3. Verify the GitHub MCP tools are available

### 2. Issue Management

#### Creating Issues

1. Gather from the user: title, description, labels, and assignees
2. If the user provides just a title, ask for additional details (body text, labels)
3. Use the `github` MCP tool to create the issue
4. Report back the issue number and URL

#### Searching Issues

1. Accept search queries (keywords, labels, author, state)
2. Use the `github` MCP tool to search issues in the current repository
3. Summarize matching issues with: number, title, state, assignee, labels
4. Present results in a scannable table format

#### Triaging Issues

1. List open issues without labels or assignees
2. Suggest appropriate labels based on issue content
3. Recommend priority ordering based on age and engagement
4. Offer to batch-apply labels or assignees

### 3. Pull Request Management

#### Creating Pull Requests

1. Verify the source branch exists and has commits ahead of the default branch
2. Gather: title, description, reviewers, and labels
3. Prompt for confirmation before creating
4. Use the `github` MCP tool to create the PR
5. Report the PR number and URL

#### Searching Pull Requests

1. Accept search criteria (state, author, branch, labels)
2. Display results with: number, title, author, status, review state
3. Highlight PRs that need review or have merge conflicts

#### Reviewing Pull Requests

1. Fetch the PR diff and file changes
2. Summarize the scope of changes (files modified, lines added/removed)
3. Identify potential issues: large diffs, missing tests, breaking changes
4. Provide structured review comments with file and line references

### 4. Output Format

Present results in structured markdown:

```markdown
| # | Title | State | Assignee | Labels |
|---|-------|-------|----------|--------|
| 42 | Fix login bug | open | @dev | bug, priority |
```

For PR reviews, use inline code references:

```
**file.ts:42** — Consider adding error handling for the null case
```

## Error Handling

- If `GITHUB_TOKEN` is not set, inform the user and provide setup instructions
- If the repository cannot be determined, ask the user to specify `owner/repo`
- If MCP tools are unavailable, suggest installing the github-integration plugin
