# KeyboardCheatsheet Component

A modal that displays all registered keyboard shortcuts grouped by category.

## Features

- Opens on `?` key press (via keyboard registry)
- Closes on Escape or backdrop click
- Shows shortcuts grouped by category (Playback, View, Selection, etc.)
- Displays key + modifiers (e.g., "⌘K" on Mac, "Ctrl+K" on Windows)
- Shows label for each shortcut
- Uses `registry.getCategories()` to dynamically get shortcuts
- Fully accessible with focus trap and ARIA attributes
- Responsive two-column layout on desktop, single column on mobile

## Usage

### 1. Register the '?' shortcut to open the cheatsheet

```typescript
// In your root layout or app initialization
import { registry } from '$lib/keyboard'
import { openModal } from '$stores/modalStore'

// Register the shortcut to open the cheatsheet
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
```

### 2. Add the component to your layout

```svelte
<script lang="ts">
  import { activeModal, closeModal } from '$stores/modalStore'
  import KeyboardCheatsheet from '$lib/components/KeyboardCheatsheet.svelte'

  // Subscribe to active modal
  let currentModal = $state($activeModal)

  $effect(() => {
    currentModal = $activeModal
  })
</script>

<!-- Your app content -->
<slot />

<!-- Keyboard Cheatsheet Modal -->
<KeyboardCheatsheet
  isOpen={currentModal?.id === 'shortcuts'}
  onClose={() => closeModal('shortcuts')}
/>
```

### 3. Register your app's keyboard shortcuts

```typescript
import { registry } from '$lib/keyboard'

// Playback shortcuts
registry.registerMany([
  {
    id: 'play-pause',
    key: ' ',
    label: 'Play/Pause',
    description: 'Toggle animation playback',
    category: 'playback',
    action: () => togglePlayback(),
  },
  {
    id: 'seek-forward',
    key: 'ArrowRight',
    label: 'Seek Forward',
    description: 'Jump forward 5 seconds',
    category: 'playback',
    action: () => seek(5),
  },
  {
    id: 'seek-backward',
    key: 'ArrowLeft',
    label: 'Seek Backward',
    description: 'Jump backward 5 seconds',
    category: 'playback',
    action: () => seek(-5),
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
    action: () => toggleView(),
  },
  {
    id: 'rotate-right',
    key: 'r',
    label: 'Rotate Right',
    description: 'Rotate camera to the right',
    category: 'view',
    action: () => rotateCamera('right'),
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
    action: () => setMode('circle'),
  },
  {
    id: 'slice-mode',
    key: '2',
    label: 'Slice Mode',
    description: 'Switch to slice selection mode',
    category: 'selection',
    action: () => setMode('slice'),
  },
  {
    id: 'clear-selection',
    key: 'Escape',
    label: 'Clear Selection',
    description: 'Clear current selection',
    category: 'selection',
    action: () => clearSelection(),
  },
])
```

## Props

| Prop      | Type         | Required | Description                         |
| --------- | ------------ | -------- | ----------------------------------- |
| `isOpen`  | `boolean`    | Yes      | Whether the modal is currently open |
| `onClose` | `() => void` | Yes      | Callback to close the modal         |

## Key Formatting

The component automatically formats key combinations for display:

- **Mac**: `⌘K`, `⌥⇧F`, `→`
- **Windows**: `Ctrl+K`, `Alt+Shift+F`, `→`

Special keys are displayed with symbols:

- Space → "Space"
- Arrow keys → `←`, `→`, `↑`, `↓`
- Escape → "Esc"
- Home/End → "Home", "End"

## Categories

Shortcuts are grouped by category:

- **Playback** - Play/pause, seeking, jump to start/end
- **View** - Toggle 2D/3D, rotation, video toggle
- **Selection** - Selection modes, clear selection
- **Navigation** - Timeline navigation, marker controls
- **Data** - Data filters, code toggles
- **Modal** - Open settings, help, etc.

## Accessibility

- Keyboard navigation with Tab/Shift+Tab
- Focus trap keeps focus inside modal
- Escape key to close
- ARIA attributes: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- Backdrop click to close

## Styling

Uses DaisyUI classes for consistent styling:

- Modal: `modal`, `modal-box`, `max-w-3xl`
- Keyboard keys: `kbd`, `kbd-sm`
- Grid layout: `grid-cols-1 md:grid-cols-2 gap-8`

## Example Integration in +page.svelte

```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import { registry, attachKeyboardHandler } from '$lib/keyboard'
  import { activeModal, openModal, closeModal } from '$stores/modalStore'
  import KeyboardCheatsheet from '$lib/components/KeyboardCheatsheet.svelte'

  // Register all shortcuts
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
      action: () => openModal('shortcuts'),
    })

    // Register app shortcuts...
    registerAppShortcuts()
  })

  // Subscribe to modal state
  let currentModal = $state($activeModal)

  $effect(() => {
    currentModal = $activeModal
  })
</script>

<!-- App content -->
<div>Your app here</div>

<!-- Keyboard Cheatsheet -->
<KeyboardCheatsheet
  isOpen={currentModal?.id === 'shortcuts'}
  onClose={() => closeModal('shortcuts')}
/>
```

## See Also

- [Keyboard Registry](/src/lib/keyboard/registry.ts)
- [Modal Store](/src/stores/modalStore.ts)
- [Settings Modal](/src/lib/components/SettingsModal.svelte)
