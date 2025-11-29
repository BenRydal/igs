# Keyboard Shortcuts Module Usage

This module provides a comprehensive keyboard shortcut system for the IGS application.

## Quick Start

### 1. Register Shortcuts (in your root layout or app initialization)

```typescript
// src/routes/+layout.svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { registerAllShortcuts, attachKeyboardHandler, detachKeyboardHandler } from '$lib/keyboard'

  onMount(() => {
    // Register all IGS shortcuts
    registerAllShortcuts()

    // Attach the global keyboard event handler
    attachKeyboardHandler()
  })

  onDestroy(() => {
    // Clean up when component unmounts
    detachKeyboardHandler()
  })
</script>
```

### 2. Listen for Custom Events (in relevant components)

Some shortcuts dispatch custom events that components should listen for:

```typescript
// Example: Listen for 3D toggle event in your p5 sketch component
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'

  let toggle3DHandler: (e: Event) => void

  onMount(() => {
    toggle3DHandler = (e: Event) => {
      // Handle 3D toggle
      console.log('Toggling 3D view')
      // Your 3D toggle logic here
    }

    window.addEventListener('igs:toggle-3d', toggle3DHandler)
  })

  onDestroy(() => {
    window.removeEventListener('igs:toggle-3d', toggle3DHandler)
  })
</script>
```

## Available Shortcuts by Category

### Playback Controls

- **Space**: Play/Pause animation
- **ArrowLeft**: Seek backward 5 seconds
- **ArrowRight**: Seek forward 5 seconds
- **Home**: Jump to start of timeline
- **End**: Jump to end of timeline
- **[**: Set left marker at current time
- **]**: Set right marker at current time
- **-**: Decrease animation speed
- **+ or =**: Increase animation speed

### View Controls

- **d**: Toggle 2D/3D view
- **r**: Rotate floor plan right
- **Shift+R**: Rotate floor plan left
- **v**: Toggle video visibility

### Selection Modes

- **1**: Circle selection mode
- **2**: Slice selection mode
- **3**: Highlight selection mode
- **Escape**: Clear all selections

### Data Display Toggles

- **m**: Toggle movement trails
- **s**: Toggle stops
- **a**: Toggle talk alignment
- **c**: Toggle color by codes

### Application Commands

- **Shift+?**: Show shortcuts cheatsheet
- **h**: Toggle help modal
- **o**: Open file dialog
- **Ctrl+Shift+S / Cmd+Shift+S**: Download code file
- **Ctrl+K / Cmd+K**: Open command palette

## Custom Events Dispatched

The following custom events are dispatched by shortcuts and should be handled in your components:

| Event Name                 | Detail                             | Description                     |
| -------------------------- | ---------------------------------- | ------------------------------- |
| `igs:toggle-3d`            | none                               | Toggle between 2D and 3D view   |
| `igs:rotate-floorplan`     | `{ direction: 'left' \| 'right' }` | Rotate the floor plan           |
| `igs:toggle-video`         | none                               | Toggle video player visibility  |
| `igs:open-cheatsheet`      | none                               | Open shortcuts cheatsheet modal |
| `igs:toggle-help`          | none                               | Toggle help modal               |
| `igs:download-codes`       | none                               | Download code data file         |
| `igs:open-command-palette` | none                               | Open command palette            |

## Accessing Shortcuts Programmatically

```typescript
import { registry, playbackShortcuts, viewShortcuts } from '$lib/keyboard'

// Get all registered shortcuts
const allShortcuts = registry.getAll()

// Get shortcuts by category
const playbackOnly = registry.getByCategory('playback')

// Get grouped by category
const categories = registry.getCategories()

// Get a specific shortcut
const playPause = registry.get('playback.play-pause')

// Enable/disable shortcuts
registry.disable('playback.play-pause')
registry.enable('playback.play-pause')

// Check for conflicts
const conflicts = registry.getConflicts(someShortcut)
```

## Building a Shortcuts Cheatsheet UI

Use the exported shortcut arrays to build your cheatsheet:

```svelte
<script lang="ts">
  import {
    playbackShortcuts,
    viewShortcuts,
    selectionShortcuts,
    dataShortcuts,
    modalShortcuts,
  } from '$lib/keyboard'

  const categories = [
    { label: 'Playback', shortcuts: playbackShortcuts },
    { label: 'View', shortcuts: viewShortcuts },
    { label: 'Selection', shortcuts: selectionShortcuts },
    { label: 'Data', shortcuts: dataShortcuts },
    { label: 'Application', shortcuts: modalShortcuts },
  ]
</script>

{#each categories as category}
  <div>
    <h3>{category.label}</h3>
    <ul>
      {#each category.shortcuts as shortcut}
        <li>
          <kbd>{shortcut.key}</kbd>
          {#if shortcut.modifiers?.ctrl}<kbd>Ctrl</kbd>{/if}
          {#if shortcut.modifiers?.shift}<kbd>Shift</kbd>{/if}
          {#if shortcut.modifiers?.alt}<kbd>Alt</kbd>{/if}
          {#if shortcut.modifiers?.meta}<kbd>Cmd</kbd>{/if}
          <span>{shortcut.label}</span>
          <span>{shortcut.description}</span>
        </li>
      {/each}
    </ul>
  </div>
{/each}
```

## Advanced Usage

### Registering Custom Shortcuts

```typescript
import { registry } from '$lib/keyboard'

registry.register({
  id: 'custom.my-action',
  key: 'x',
  modifiers: { ctrl: true },
  label: 'My Custom Action',
  description: 'Does something custom',
  category: 'data',
  action: () => {
    console.log('Custom action triggered!')
  },
  // Optional: conditional enabling
  when: () => {
    // Only enable when certain conditions are met
    return someCondition === true
  },
})
```

### Temporary Disabling

```typescript
// Disable all playback shortcuts during modal interaction
import { playbackShortcuts } from '$lib/keyboard'

playbackShortcuts.forEach((shortcut) => {
  registry.disable(shortcut.id)
})

// Re-enable them later
playbackShortcuts.forEach((shortcut) => {
  registry.enable(shortcut.id)
})
```

## Notes

- Shortcuts are automatically ignored when focus is on input elements (INPUT, TEXTAREA, SELECT) or contenteditable elements
- The handler prevents default browser behavior and stops propagation when a shortcut matches
- Shortcuts with the same key combination will generate a console warning
- Store updates are reactive and will trigger UI updates automatically
