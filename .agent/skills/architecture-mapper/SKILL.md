---
name: architecture-mapper
description: Use when generating or refreshing the memory bank from the current codebase — analyzes plugin manifests, web app structure, and MCP configs to produce architecture documentation. Triggers on "map architecture", "update memory bank", "refresh context", "analyze codebase".
---

# Architecture Mapper Skill

## Goal

Analyze the current state of the repository and generate or update the persistent memory bank documents in `.agent/memory-bank/`.

## When to Use

- Starting work on a new major feature
- After significant refactoring or plugin additions
- When memory bank docs may be outdated
- When onboarding a new agent session to the project

## Procedure

### Phase 1: Plugin Inventory

1. List all plugin directories under `plugins/`
2. For each plugin, read `.claude-plugin/plugin.json` and extract:
   - Name, version, description
   - Available components (commands, agents, skills, hooks, MCP servers)
   - Required environment variables
3. Count total plugins and compare with documented count

### Phase 2: Marketplace Registry

1. Read `.claude-plugin/marketplace.json`
2. Extract all registered plugins with their categories
3. Cross-reference with actual plugin directories
4. Flag any unregistered plugins or orphaned registry entries

### Phase 3: Web Storefront Analysis

1. Read `agenthaus-web/package.json` for dependency versions
2. Scan `agenthaus-web/src/` for key components and pages
3. Note the tech stack: Next.js version, React version, Tailwind version
4. Identify the data flow from plugins → storefront

### Phase 4: CI/CD Pipeline

1. Read `.github/workflows/validate.yml`
2. Document the validation steps and their order
3. Note any recent additions or changes to the pipeline

### Phase 5: Update Memory Bank

Update the following files with current, accurate information:

#### `.agent/memory-bank/architecture.md`

- Correct plugin count
- Update component relationships if changed
- Refresh tech stack versions
- Update CI/CD pipeline description

#### `.agent/memory-bank/api-contracts.md`

- Verify schema examples match current plugin.json format
- Update any new fields or deprecated fields
- Ensure MCP config examples are current

#### `.agent/memory-bank/decision-log.md`

- Append any new architectural decisions discovered during analysis
- Use the format: `## ADR-NNN: Title`, `**Decision:**`, `**Rationale:**`, `**Consequence:**`

### Phase 6: Produce Summary

Generate a brief report of what was found and what was updated:

- Total plugins (registered vs. directories)
- Tech stack versions
- Any drift between docs and reality
- Recommendations for further documentation

## Output Format

- Updated memory bank files in `.agent/memory-bank/`
- Summary report in conversation

## Constraints

- This skill is READ-HEAVY — it reads many files but only writes to memory bank docs
- Do not modify plugin source code, only documentation files
- Keep memory bank docs concise — they should be scannable reference material, not verbose prose
- Architecture.md should stay under 200 lines
- API-contracts.md should stay under 150 lines

## Failure Modes & Recovery

| Failure | Detection | Recovery |
|---------|-----------|----------|
| Memory bank directory missing | Directory not found error | Create `.agent/memory-bank/` directory structure |
| Stale architecture docs | Content doesn't match current codebase | Re-run full architecture scan; don't patch — regenerate |
| File too large for context | Token limit exceeded reading large files | Summarize by section; use progressive disclosure |
| Git history unavailable | git log returns error | Fall back to file-based analysis without history |
