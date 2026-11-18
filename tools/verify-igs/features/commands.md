# Commands, shortcuts and undo

Every app action is reachable from a command palette and most from a keyboard shortcut;
changes to display settings can be undone and redone.

## Sub-features

- `commands-palette` opens the palette, fuzzy-filters, and runs a command.
- `commands-undo-redo` undoes and redoes a setting change.

## How to get to it (user POV)

- `Ctrl+K` (or `Cmd+K`) opens the palette; type, then Enter.
- `Ctrl+Z` undoes, `Ctrl+Shift+Z` redoes.

## Driving it with verify-igs

- **Palette then undo.** `node $V/verify.mjs run command-palette-undo`. Typing
  `movement trails` shows `Toggle Movement Trails`; Enter closes the palette and canvas
  ink drops by more than 5 percent; undo restores it to within 2 percent; redo returns to
  the hidden value.

## Gotchas

- Shortcuts are ignored while focus is in an input, textarea or select.
- Filter buttons in the Filters panel expose no pressed state, so the canvas is the only
  evidence that a filter is off.
- Not covered: recent commands, the keyboard cheatsheet, single-key shortcuts other
  than `D`.
