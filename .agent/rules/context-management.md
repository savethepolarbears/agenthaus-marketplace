---
description: Context engineering and planning-first workflow guidelines
activation: always_on
---

# Context Management Rules

Guidelines for maintaining clean, efficient agent context and using planning-first workflows.

## Planning First

- **Always plan before executing.** For non-trivial tasks, generate an implementation plan and task list before writing code.
- Use PLANNING mode to research, read relevant files, and design your approach.
- Only proceed to EXECUTION after the plan is reviewed and approved.
- If unexpected complexity arises during execution, return to PLANNING.

## Memory Bank Usage

- Before starting large tasks, read `.agent/memory-bank/` for persistent project context.
- Architecture docs, API contracts, and decision logs are maintained there.
- Update memory bank docs when making significant architectural changes.

## Context Hygiene

- **Load only what you need.** Use skills for on-demand knowledge loading rather than dumping the entire codebase into context.
- Keep conversations focused — one major objective per session.
- For massive refactors, brainstorm the plan externally first, then bring a `progress.md` into the workspace for focused execution.

## Browser Agent Patterns

- Use the Browser Agent for QA verification of UI changes (storefront rendering, responsive layouts).
- Provide strict, step-by-step prompts with explicit success criteria.
- Always review browser artifacts (screenshots, recordings) to verify visual output.
- Use the browser for competitive research and data gathering when needed.

## Artifact-Driven Communication

- Produce tangible artifacts: task lists, implementation plans, screenshots, recordings.
- Use artifacts to communicate progress rather than verbose text explanations.
- Reports go to `reports/`, temporary files go to `/tmp/`.
