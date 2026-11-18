# Text contrast

Every piece of text meets WCAG AA contrast (4.5:1, or 3:1 for large text).

## Sub-features

- `contrast-scan` checks the empty app, each side panel, the zoomed timeline, the open
  transcript, the import dialog and the guide page.

## How to get to it (user POV)

- Nothing to open; it is a property of every screen.

## Driving it with verify-igs

- `node $V/verify.mjs run contrast`. Runs axe's `color-contrast` rule in each state and
  writes every failure (text, ratio, colours, selector, state) to `contrast.json` in the
  evidence folder. The journey fails if the list is not empty.

## Gotchas

- axe cannot judge text over the canvas or over gradients; those are not covered.
- Hover-only surfaces (tooltips, the command palette, the keyboard cheatsheet) are not
  opened by the journey.
- Disabled and switched-off rows are dimmed on purpose and are exempt.
- DaisyUI's `.label` and table header defaults are 60% and fail; `src/app.css` raises them.
