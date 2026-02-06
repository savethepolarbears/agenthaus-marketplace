---
name: pr
description: Create or search GitHub pull requests. Usage: `/github-integration:pr <search query | branch>`
---
If the argument is a search query (multiple words), use the `github` MCP tool to search open pull requests in the current repository and display their titles, authors and statuses.  If the argument is a branch name (for example `feature/login`), ask the user for a title and description and then create a pull request from the specified branch into the default branch.  Always verify that the branch exists and prompt for confirmation before creating the pull request.