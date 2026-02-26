# Palette's Journal

## 2025-10-26 - [Clickable Card with Actions Pattern]
**Learning:** Using `before:absolute before:inset-0` on a link inside a card makes the whole card clickable without invalid HTML nesting. Interactive children must have `relative z-10` to receive clicks.
**Action:** Use this pattern for future card components that need both a primary navigation and secondary actions (like copy buttons).

## 2025-10-27 - [Card Focus State with :has()]
**Learning:** When using `before:absolute` to make a card clickable via an inner link, the default focus ring is often hidden or misplaced. Using `has-[a:focus-visible]` on the parent container allows applying focus styles to the entire card when the link is focused, preserving context and accessibility.
**Action:** Apply `has-[a:focus-visible]` (or similar selectors) to card containers to ensure keyboard users see a clear focus indicator on the card itself.

## 2026-02-24 - [Focus-Visible Reveal Pattern]
**Learning:** When an icon is hidden by default and shown on hover (via `group-hover`), adding `focus-visible:[&_svg]:opacity-100` to the parent button ensures keyboard users also see the icon when they tab to the button, without needing complex group-focus selectors.
**Action:** Use `focus-visible:[&_svg]:opacity-100` on icon buttons that have hover-reveal icons.

## 2026-02-25 - [Dual-State Tooltip Pattern]
**Learning:** For prominent icon buttons, providing a "Copy to clipboard" tooltip on hover/focus (before interaction) improves discoverability and confidence, while "Copied!" (after interaction) confirms success. Using `group-hover` and `group-focus-visible` on an absolute positioned span within a relative button allows this without complex state management.
**Action:** Use this dual-state tooltip pattern for copy/action buttons to provide both guidance and feedback.
