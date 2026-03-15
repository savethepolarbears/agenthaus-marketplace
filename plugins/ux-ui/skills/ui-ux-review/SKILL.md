---
name: ui-ux-review
description: Audit and improve front-end UI/UX including accessibility (WCAG), visual consistency, responsive design, and Tailwind CSS best practices. Use when the user asks to review UI components, fix accessibility issues, improve responsive layouts, polish design, or optimize Tailwind CSS usage in their codebase.
---

# UI/UX Review & Improvement

Analyze and polish front-end code for better user experience, accessibility compliance, visual consistency, and responsive design.

## When to Use

- User asks to review or improve UI components
- User wants an accessibility audit (WCAG compliance)
- User needs responsive design fixes for mobile/tablet/desktop
- User asks to optimize Tailwind CSS usage
- User wants visual consistency improvements across components
- User asks for design system or component pattern recommendations

## Steps

### 1. Gather Targets

1. Identify files to analyze from the user's request
2. If no files specified, scan all JS/TS/JSX/TSX/HTML/Vue/Svelte files under `src/`
3. Exclude test files (`*.spec.*`, `*.test.*`) and non-UI assets

### 2. Accessibility Audit (WCAG 2.1)

Check for these common accessibility issues:

- **Missing ARIA attributes**: `aria-label`, `aria-describedby`, `role` on interactive elements
- **Color contrast**: Ensure text meets WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large)
- **Form controls**: Every input must have an associated `<label>` or `aria-label`
- **Keyboard navigation**: Interactive elements must be focusable and operable via keyboard
- **Semantic HTML**: Use `<nav>`, `<main>`, `<section>`, `<article>`, `<header>`, `<footer>` instead of generic `<div>`
- **Image alt text**: All `<img>` elements must have descriptive `alt` attributes
- **Focus indicators**: Visible focus styles on all interactive elements
- **Skip navigation**: Long pages should have skip-to-content links

### 3. Visual Consistency Check

Identify inconsistencies across components:

- **Spacing**: Inconsistent margin/padding values (e.g., mixing `p-4` and `p-5`)
- **Typography**: Mixed font sizes or weights without clear hierarchy
- **Colors**: Hardcoded colors instead of theme variables or Tailwind palette
- **Border radius**: Inconsistent rounding across similar components
- **Shadow**: Mixed shadow styles on similar elevation levels

### 4. Responsive Design Review

Check for responsive issues:

- **Fixed dimensions**: `w-[400px]` or `h-[600px]` that break on small screens
- **Missing breakpoints**: No `sm:`, `md:`, `lg:` responsive prefixes
- **Flex/Grid layout**: Improper flex wrapping or grid column definitions
- **Overflow**: Elements that overflow containers on mobile
- **Touch targets**: Buttons and links must be at least 44x44px on mobile
- **Text scaling**: Font sizes that are too small on mobile or too large on desktop

### 5. Tailwind CSS Best Practices

- Replace inline styles with Tailwind utilities
- Consolidate repeated utility patterns into components
- Remove unnecessary `!important` modifiers
- Use Tailwind's design tokens instead of arbitrary values
- Prefer semantic class groupings (layout, spacing, typography, color)

### 6. Generate Recommendations

For each issue found, provide:

1. **File and location**: Exact file path and line reference
2. **Issue description**: What's wrong and why it matters
3. **WCAG reference**: Applicable guideline (for accessibility issues)
4. **Fix**: Specific code change with before/after examples
5. **Priority**: High (blocks users), Medium (degrades experience), Low (polish)

### 7. Output Format

Present findings grouped by file, then by category:

```markdown
## file: src/components/Header.tsx

### Accessibility (High Priority)
- **Line 15**: Missing `aria-label` on navigation button
  - Fix: Add `aria-label="Toggle navigation menu"`

### Responsiveness (Medium Priority)
- **Line 32**: Fixed width `w-[1200px]` breaks on mobile
  - Fix: Replace with `w-full max-w-7xl mx-auto`

### Visual Consistency (Low Priority)
- **Line 8**: Uses `p-3` while sibling components use `p-4`
  - Fix: Standardize to `p-4` for consistent spacing
```

### 8. Summary

After reviewing all files, provide:

- Total issues found by category and priority
- Top 3 highest-impact improvements to make first
- Overall accessibility score estimate (percentage of checks passing)
