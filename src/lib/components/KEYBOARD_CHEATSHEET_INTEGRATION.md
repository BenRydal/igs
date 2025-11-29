# Keyboard Cheatsheet Integration Guide

This guide shows how to integrate the KeyboardCheatsheet modal into the IGS application.

## Files Created

1. **`/src/lib/components/KeyboardCheatsheet.svelte`** - Main cheatsheet modal component
2. **`/src/lib/components/KeyboardCheatsheet.example.md`** - Usage examples
3. **`/src/lib/components/KeyboardCheatsheetDemo.svelte`** - Demo component with example shortcuts

## Quick Start

### Step 1: Register the '?' Shortcut

The `?` key should open the cheatsheet. Register this shortcut where you initialize your keyboard system (typically in `+page.svelte` or `+layout.svelte`):

```typescript
import { onMount } from 'svelte'
import { registry, attachKeyboardHandler } from '$lib/keyboard'
import { openModal } from '$stores/modalStore'

onMount(() => {
  // Attach global keyboard handler
  attachKeyboardHandler()

  // Register cheatsheet shortcut
  registry.register({
    id: 'open-cheatsheet',
    key: '?',
    label: 'Show Keyboard Shortcuts',
    description: 'Display the keyboard shortcuts cheatsheet',
    category: 'modal',
    action: () => {
      openModal('shortcuts')
    },
  })

  // Register other app shortcuts...
})
```

### Step 2: Add Component to Page/Layout

Add the KeyboardCheatsheet component to your root layout or main page:

```svelte
<script lang="ts">
  import { activeModal, closeModal } from '$stores/modalStore'
  import KeyboardCheatsheet from '$lib/components/KeyboardCheatsheet.svelte'

  let currentModal = $state($activeModal)

  $effect(() => {
    currentModal = $activeModal
  })
</script>

<!-- Your app content -->
<div>
  <!-- ... -->
</div>

<!-- Keyboard Cheatsheet Modal -->
<KeyboardCheatsheet
  isOpen={currentModal?.id === 'shortcuts'}
  onClose={() => closeModal('shortcuts')}
/>
```

### Step 3: Register Your App Shortcuts

Register all your app's keyboard shortcuts using the registry. The cheatsheet will automatically display them grouped by category.

Example for IGS:

```typescript
import { registry } from '$lib/keyboard'
import { updateConfig } from '$lib/utils/config'
import TimelineStore from '$stores/timelineStore'
import ConfigStore from '$stores/configStore'

// Playback shortcuts
registry.registerMany([
  {
    id: 'play-pause',
    key: ' ',
    label: 'Play/Pause',
    description: 'Toggle animation playback',
    category: 'playback',
    action: () => {
      TimelineStore.update((t) => {
        t.toggleIsAnimating()
        return t
      })
    },
  },
  {
    id: 'seek-forward',
    key: 'ArrowRight',
    label: 'Seek Forward',
    description: 'Jump forward 5 seconds',
    category: 'playback',
    action: () => {
      TimelineStore.update((t) => {
        t.seek(5)
        return t
      })
    },
  },
  {
    id: 'seek-backward',
    key: 'ArrowLeft',
    label: 'Seek Backward',
    description: 'Jump backward 5 seconds',
    category: 'playback',
    action: () => {
      TimelineStore.update((t) => {
        t.seek(-5)
        return t
      })
    },
  },
])

// View shortcuts
registry.registerMany([
  {
    id: 'toggle-2d-3d',
    key: 'd',
    label: 'Toggle 2D/3D',
    description: 'Switch between 2D and 3D view',
    category: 'view',
    action: () => {
      updateConfig('is3D', !ConfigStore.is3D)
    },
  },
  {
    id: 'rotate-right',
    key: 'r',
    label: 'Rotate Right',
    description: 'Rotate camera to the right',
    category: 'view',
    action: () => {
      // Trigger rotation
    },
  },
])

// Selection shortcuts
registry.registerMany([
  {
    id: 'circle-mode',
    key: '1',
    label: 'Circle Mode',
    description: 'Switch to circle selection mode',
    category: 'selection',
    action: () => {
      // Set circle mode
    },
  },
  {
    id: 'slice-mode',
    key: '2',
    label: 'Slice Mode',
    description: 'Switch to slice selection mode',
    category: 'selection',
    action: () => {
      // Set slice mode
    },
  },
  {
    id: 'clear-selection',
    key: 'Escape',
    label: 'Clear Selection',
    description: 'Clear current selection',
    category: 'selection',
    action: () => {
      // Clear selection
    },
  },
])

// Data shortcuts
registry.registerMany([
  {
    id: 'toggle-movement',
    key: 'm',
    label: 'Toggle Movement',
    description: 'Show/hide movement trails',
    category: 'data',
    action: () => {
      updateConfig('showMovement', !ConfigStore.showMovement)
    },
  },
  {
    id: 'toggle-stops',
    key: 's',
    label: 'Toggle Stops',
    description: 'Show/hide stop markers',
    category: 'data',
    action: () => {
      updateConfig('showStops', !ConfigStore.showStops)
    },
  },
])
```

## Full Integration Example for +page.svelte

Here's a complete example showing how to integrate into the main page:

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { registry, attachKeyboardHandler, detachKeyboardHandler } from '$lib/keyboard'
  import { activeModal, openModal, closeModal } from '$stores/modalStore'
  import KeyboardCheatsheet from '$lib/components/KeyboardCheatsheet.svelte'
  import TimelineStore from '$stores/timelineStore'
  import ConfigStore from '$stores/configStore'

  // Modal state
  let currentModal = $state($activeModal)

  $effect(() => {
    currentModal = $activeModal
  })

  /**
   * Register all keyboard shortcuts
   */
  function registerKeyboardShortcuts() {
    // Modal shortcuts
    registry.register({
      id: 'open-cheatsheet',
      key: '?',
      label: 'Show Keyboard Shortcuts',
      description: 'Display the keyboard shortcuts cheatsheet',
      category: 'modal',
      action: () => openModal('shortcuts'),
    })

    registry.register({
      id: 'open-settings',
      key: ',',
      modifiers: { meta: true },
      label: 'Settings',
      description: 'Open settings modal',
      category: 'modal',
      action: () => openModal('settings'),
    })

    // Playback shortcuts
    registry.registerMany([
      {
        id: 'play-pause',
        key: ' ',
        label: 'Play/Pause',
        description: 'Toggle animation playback',
        category: 'playback',
        action: () => {
          TimelineStore.update((t) => {
            t.toggleIsAnimating()
            return t
          })
        },
      },
      {
        id: 'seek-forward',
        key: 'ArrowRight',
        label: 'Seek Forward',
        description: 'Jump forward 5 seconds',
        category: 'playback',
        action: () => {
          TimelineStore.update((t) => {
            t.seek(5)
            return t
          })
        },
      },
      {
        id: 'seek-backward',
        key: 'ArrowLeft',
        label: 'Seek Backward',
        description: 'Jump backward 5 seconds',
        category: 'playback',
        action: () => {
          TimelineStore.update((t) => {
            t.seek(-5)
            return t
          })
        },
      },
    ])

    // View shortcuts
    registry.registerMany([
      {
        id: 'toggle-2d-3d',
        key: 'd',
        label: 'Toggle 2D/3D',
        description: 'Switch between 2D and 3D view',
        category: 'view',
        action: () => {
          ConfigStore.update((c) => {
            c.is3D = !c.is3D
            return c
          })
        },
      },
    ])

    // Add more shortcuts...
  }

  onMount(() => {
    // Register shortcuts
    registerKeyboardShortcuts()

    // Attach keyboard handler
    attachKeyboardHandler()
  })

  onDestroy(() => {
    // Clean up
    detachKeyboardHandler()
  })
</script>

<!-- Main app content -->
<div class="app">
  <!-- Your app UI -->
</div>

<!-- Modals -->
<KeyboardCheatsheet
  isOpen={currentModal?.id === 'shortcuts'}
  onClose={() => closeModal('shortcuts')}
/>
```

## Testing the Integration

### Option 1: Use the Demo Component

Create a test route to view the demo:

```svelte
<!-- src/routes/test/keyboard/+page.svelte -->
<script>
  import KeyboardCheatsheetDemo from '$lib/components/KeyboardCheatsheetDemo.svelte'
</script>

<KeyboardCheatsheetDemo />
```

Then visit `http://localhost:5000/test/keyboard` in your browser.

### Option 2: Manual Testing

1. Start the dev server: `yarn dev`
2. Press `?` to open the cheatsheet
3. Verify:
   - Modal opens and displays shortcuts
   - Shortcuts are grouped by category
   - Keys are formatted correctly for your OS (Mac shows ⌘, Windows shows Ctrl)
   - Escape key closes the modal
   - Clicking backdrop closes the modal
   - Tab key cycles through focusable elements
   - All registered shortcuts are displayed

## Customization

### Change the Trigger Key

To use a different key to open the cheatsheet:

```typescript
registry.register({
  id: 'open-cheatsheet',
  key: 'h', // Use 'h' instead of '?'
  modifiers: { meta: true }, // Require Cmd/Ctrl
  // ...
})
```

### Add More Categories

The component automatically groups shortcuts by category. Available categories:

- `playback` - Play/pause, seeking, timeline control
- `view` - 2D/3D toggle, rotation, zoom
- `selection` - Selection modes, highlight, clear
- `navigation` - Timeline navigation, marker controls
- `data` - Data filters, code toggles
- `modal` - Open modals, dialogs

### Customize Styling

The component uses DaisyUI classes. You can customize:

```svelte
<!-- In KeyboardCheatsheet.svelte -->
<div class="modal-box w-11/12 max-w-3xl">
  <!-- Change max-w-3xl to max-w-4xl for wider modal -->
</div>

<kbd class="kbd kbd-sm">
  <!-- Change kbd-sm to kbd-md for larger keys -->
</kbd>
```

## Accessibility

The component includes:

- **Keyboard Navigation**: Tab/Shift+Tab to move between elements
- **Focus Trap**: Focus stays within modal when open
- **Escape Key**: Closes the modal
- **ARIA Attributes**: Proper `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- **Screen Reader Support**: Proper heading hierarchy and labels

## Troubleshooting

### Shortcuts not showing in cheatsheet

Make sure shortcuts are registered **before** opening the cheatsheet:

```typescript
onMount(() => {
  registerKeyboardShortcuts() // Register first
  attachKeyboardHandler() // Then attach handler
})
```

### '?' key not working

Check that:

1. Keyboard handler is attached: `attachKeyboardHandler()`
2. The shortcut is registered with the correct key: `key: '?'`
3. You're not focused on an input element (keyboard shortcuts are disabled in inputs)

### Modal not closing

Verify:

1. `onClose` callback is provided
2. Modal store is properly imported and used
3. Escape key handler is working (check browser console for errors)

## Next Steps

After integration:

1. **Add Help Button**: Add a button in your UI to open the cheatsheet
2. **Update Documentation**: Document all shortcuts in your README
3. **User Testing**: Test with users to ensure shortcuts are discoverable
4. **Tooltips**: Add shortcuts to tooltips using the RichTooltip component

## See Also

- [Keyboard Registry Documentation](/src/lib/keyboard/README.md)
- [Modal Store Documentation](/src/stores/modalStore.ts)
- [RichTooltip Component](/src/lib/components/RichTooltip.svelte)
- [DaisyUI Modal Docs](https://daisyui.com/components/modal/)
- [DaisyUI KBD Docs](https://daisyui.com/components/kbd/)
