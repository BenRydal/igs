# IGS Keyboard Shortcuts Module

A comprehensive, type-safe keyboard shortcut system for the Interaction Geography Slicer application.

## Features

- **29 registered shortcuts** across 5 categories
- Type-safe shortcut definitions with TypeScript
- Automatic conflict detection
- Conditional shortcut enabling
- Input element awareness (automatically ignores shortcuts when typing)
- Cross-platform modifier key support (Ctrl/Cmd)
- Custom event dispatching for UI components
- Reactive store integration

## Module Structure

```
src/lib/keyboard/
├── types.ts           # TypeScript type definitions
├── registry.ts        # Shortcut registry class
├── handler.ts         # Global keyboard event handler
├── shortcuts.ts       # All IGS shortcut definitions ⭐ NEW
├── index.ts           # Public API exports
├── USAGE.md           # Detailed usage documentation
└── README.md          # This file
```

## Quick Start

### 1. Initialize in Root Layout

```typescript
// src/routes/+layout.svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { registerAllShortcuts, attachKeyboardHandler, detachKeyboardHandler } from '$lib/keyboard'

  onMount(() => {
    registerAllShortcuts()
    attachKeyboardHandler()
  })

  onDestroy(() => {
    detachKeyboardHandler()
  })
</script>
```

### 2. Handle Custom Events in Components

```typescript
// Listen for shortcut-triggered events
window.addEventListener('igs:toggle-3d', () => {
  // Handle 3D toggle
})
```

## Registered Shortcuts

### Playback (10 shortcuts)

| Key   | Action           | Description                        |
| ----- | ---------------- | ---------------------------------- |
| Space | Play/Pause       | Toggle animation playback          |
| ←     | Seek Backward    | Jump backward 5 seconds            |
| →     | Seek Forward     | Jump forward 5 seconds             |
| Home  | Jump to Start    | Jump to beginning of timeline      |
| End   | Jump to End      | Jump to end of timeline            |
| [     | Set Left Marker  | Set left boundary at current time  |
| ]     | Set Right Marker | Set right boundary at current time |
| -     | Slow Down        | Decrease animation speed           |
| +     | Speed Up         | Increase animation speed           |
| =     | Speed Up         | Increase animation speed (alt)     |

### View (4 shortcuts)

| Key     | Action       | Description                         |
| ------- | ------------ | ----------------------------------- |
| d       | Toggle 2D/3D | Switch view modes                   |
| r       | Rotate Right | Rotate floor plan clockwise         |
| Shift+R | Rotate Left  | Rotate floor plan counter-clockwise |
| v       | Toggle Video | Show/hide video player              |

### Selection (4 shortcuts)

| Key | Action         | Description                |
| --- | -------------- | -------------------------- |
| 1   | Circle Mode    | Enable circle selection    |
| 2   | Slice Mode     | Enable slice selection     |
| 3   | Highlight Mode | Enable highlight selection |
| Esc | Clear All      | Clear all selections       |

### Data Display (4 shortcuts)

| Key | Action           | Description                     |
| --- | ---------------- | ------------------------------- |
| m   | Toggle Movement  | Show/hide movement trails       |
| s   | Toggle Stops     | Show/hide stop indicators       |
| a   | Toggle Alignment | Enable/disable talk alignment   |
| c   | Toggle Colors    | Switch between user/code colors |

### Application/Modal (7 shortcuts)

| Key          | Action          | Description                          |
| ------------ | --------------- | ------------------------------------ |
| Shift+?      | Show Shortcuts  | Display cheatsheet                   |
| h            | Toggle Help     | Show/hide help modal                 |
| o            | Open File       | Open file selection dialog           |
| Ctrl+Shift+S | Download Codes  | Download code data (Windows/Linux)   |
| Cmd+Shift+S  | Download Codes  | Download code data (Mac)             |
| Ctrl+K       | Command Palette | Open command palette (Windows/Linux) |
| Cmd+K        | Command Palette | Open command palette (Mac)           |

## Custom Events

Shortcuts dispatch these custom events for component integration:

| Event                      | Detail                             | Triggered By              |
| -------------------------- | ---------------------------------- | ------------------------- |
| `igs:toggle-3d`            | none                               | d                         |
| `igs:rotate-floorplan`     | `{ direction: 'left' \| 'right' }` | r, Shift+R                |
| `igs:toggle-video`         | none                               | v                         |
| `igs:open-cheatsheet`      | none                               | Shift+?                   |
| `igs:toggle-help`          | none                               | h                         |
| `igs:download-codes`       | none                               | Ctrl+Shift+S, Cmd+Shift+S |
| `igs:open-command-palette` | none                               | Ctrl+K, Cmd+K             |

## Store Integration

Shortcuts directly update these Svelte stores:

- **ConfigStore**: Toggle states, animation rate, display options
- **TimelineStore**: Current time, markers, animation state

Changes are reactive and automatically update the UI.

## Implementation Details

### Exclusive Selection Modes

The three selection modes (circle, slice, highlight) are mutually exclusive. When one is activated, the others are automatically deactivated:

```typescript
// Activating circle mode
ConfigStore.update((config) => ({
  ...config,
  circleToggle: true, // Enable this
  sliceToggle: false, // Disable others
  highlightToggle: false,
}))
```

### Timeline Bounds Enforcement

Seeking shortcuts respect the timeline markers:

```typescript
// Seek backward respects left marker
const newTime = Math.max(timeline.getLeftMarker(), currentTime - 5)

// Seek forward respects right marker
const newTime = Math.min(timeline.getRightMarker(), currentTime + 5)
```

### Speed Adjustment Limits

Animation speed is constrained between 0.01 and 1.0:

```typescript
animationRate: Math.max(0.01, config.animationRate - 0.01) // Min: 0.01
animationRate: Math.min(1.0, config.animationRate + 0.01) // Max: 1.0
```

### Input Element Detection

Shortcuts are automatically ignored when focus is on:

- `<input>` elements
- `<textarea>` elements
- `<select>` elements
- Elements with `contenteditable` attribute

## API Reference

### Exported Functions

```typescript
// Register all shortcuts (call once on init)
registerAllShortcuts(): void

// Unregister all shortcuts (cleanup)
unregisterAllShortcuts(): void

// Attach global keyboard handler (call once on init)
attachKeyboardHandler(): void

// Detach handler (cleanup)
detachKeyboardHandler(): void
```

### Exported Constants

```typescript
// Individual category arrays
playbackShortcuts: KeyboardShortcut[]
viewShortcuts: KeyboardShortcut[]
selectionShortcuts: KeyboardShortcut[]
dataShortcuts: KeyboardShortcut[]
modalShortcuts: KeyboardShortcut[]

// All shortcuts combined
allShortcuts: KeyboardShortcut[]

// The global registry instance
registry: ShortcutRegistry
```

### Registry Methods

```typescript
// Register/unregister
registry.register(shortcut: KeyboardShortcut): void
registry.unregister(id: string): boolean

// Enable/disable
registry.enable(id: string): boolean
registry.disable(id: string): boolean

// Query
registry.get(id: string): KeyboardShortcut | undefined
registry.getAll(): KeyboardShortcut[]
registry.getByCategory(category): KeyboardShortcut[]
registry.getCategories(): ShortcutCategory[]
registry.getConflicts(shortcut): KeyboardShortcut[]
```

## Development

### Adding New Shortcuts

1. Add to the appropriate category array in `shortcuts.ts`
2. Follow the naming convention: `category.action-name`
3. Provide clear label and description
4. Test for conflicts with existing shortcuts

```typescript
export const dataShortcuts: KeyboardShortcut[] = [
  // ... existing shortcuts
  {
    id: 'data.my-new-toggle',
    key: 'n',
    label: 'My New Toggle',
    description: 'Toggles a new feature',
    category: 'data',
    action: () => {
      ConfigStore.update((config) => ({
        ...config,
        myNewToggle: !config.myNewToggle,
      }))
    },
  },
]
```

### Conflict Detection

The registry automatically detects and warns about conflicting key combinations:

```typescript
// This will generate a warning if 'd' is already registered
registry.register({
  id: 'another.d-key',
  key: 'd',
  // ...
})
```

### Conditional Shortcuts

Use the `when` property to conditionally enable shortcuts:

```typescript
{
  id: 'playback.play-pause',
  key: ' ',
  // ... other properties
  when: () => {
    const timeline = get(TimelineStore)
    return timeline.getEndTime() > 0  // Only enable if data is loaded
  }
}
```

## Testing

```bash
# Type checking
yarn check

# Linting
yarn lint

# Run dev server to test shortcuts
yarn dev
```

## Browser Compatibility

Tested and working on:

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Uses standard KeyboardEvent API, no special polyfills required.

## See Also

- [USAGE.md](./USAGE.md) - Detailed usage examples and patterns
- [types.ts](./types.ts) - TypeScript interface definitions
- [registry.ts](./registry.ts) - Registry implementation
- [handler.ts](./handler.ts) - Event handler implementation
