---
description: Code and file quality standards for the repository
activation: always_on
---

# Code Quality Rules

Standards for code and file quality in this repository.

## Markdown

- All markdown files must pass markdownlint
- Use `text` language specifier for directory tree blocks
- Add proper spacing in table columns

## JSON

- All JSON files must be valid and formatted
- Use 2-space indentation
- Validate with `jq` before committing

## Git

- Commit messages: Use conventional commits (`feat:`, `fix:`, `chore:`)
- Branch names: Use prefixes (`feat/`, `fix/`, `chore/`)
- Never commit secrets or API keys
