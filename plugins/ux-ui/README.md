# ux-ui

Polish and improve front-end UX/UI, accessibility, design, and responsiveness for Tailwind CSS projects.

## Prerequisites

No environment variables or API keys required.

## Installation

```bash
/plugin install ux-ui
```

## Usage

### Commands

#### `/improve-ui`

Automated UI/UX audit and improvements for the current project.

```
> /improve-ui

Auditing components for:
- Accessibility (ARIA labels, contrast ratios, keyboard navigation)
- Responsive design (mobile, tablet, desktop breakpoints)
- Visual consistency (spacing, typography, color palette)
- Tailwind CSS best practices
```

### Agents

#### ui-expert

Senior UI/UX designer agent for in-depth design analysis and implementation. Uses `sonnet` model.

```
> Ask the ui-expert to review the dashboard layout

The agent will analyze layout structure, spacing, hierarchy,
color usage, and accessibility, then suggest concrete improvements
with Tailwind CSS class changes.
```

## Configuration

No configuration needed. This plugin operates entirely on local files.

## Architecture

Pure analysis plugin that reads and modifies local source files only. No MCP servers, no network access, no bash execution required. The agent and command work by analyzing component markup, Tailwind classes, and design patterns, then suggesting or applying improvements directly to the codebase.
