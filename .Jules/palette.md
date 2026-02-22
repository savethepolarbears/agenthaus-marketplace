# Palette's Journal

## 2025-10-26 - [Clickable Card with Actions Pattern]
**Learning:** Using `before:absolute before:inset-0` on a link inside a card makes the whole card clickable without invalid HTML nesting. Interactive children must have `relative z-10` to receive clicks.
**Action:** Use this pattern for future card components that need both a primary navigation and secondary actions (like copy buttons).
