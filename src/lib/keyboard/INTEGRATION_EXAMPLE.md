# Integration Example

## Complete Integration Guide

### Step 1: Root Layout Setup

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { registerAllShortcuts, attachKeyboardHandler, detachKeyboardHandler } from '$lib/keyboard'

  onMount(() => {
    // Initialize keyboard system
    registerAllShortcuts()
    attachKeyboardHandler()
  })

  onDestroy(() => {
    // Clean up on unmount
    detachKeyboardHandler()
  })
</script>

<slot />
```

### Step 2: P5 Sketch Component (Handle View Events)

```svelte
<!-- src/routes/+page.svelte or wherever your p5 sketch lives -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { p5Store } from '$lib/stores/p5Store'

  let is3DMode = false
  let currentRotation = 0

  // Event handlers
  let toggle3DHandler: (e: Event) => void
  let rotateFloorplanHandler: (e: CustomEvent) => void
  let toggleVideoHandler: (e: Event) => void

  onMount(() => {
    // Handle 3D toggle (triggered by 'd' key)
    toggle3DHandler = (e: Event) => {
      is3DMode = !is3DMode
      const sketch = $p5Store
      if (sketch && sketch.handle3D) {
        sketch.handle3D.toggle3D()
      }
    }

    // Handle floor plan rotation (triggered by 'r' and Shift+'r')
    rotateFloorplanHandler = (e: CustomEvent) => {
      const direction = e.detail?.direction || 'right'
      const sketch = $p5Store

      if (direction === 'right') {
        currentRotation = (currentRotation + 90) % 360
      } else {
        currentRotation = (currentRotation - 90 + 360) % 360
      }

      if (sketch && sketch.floorPlan) {
        sketch.floorPlan.setRotation(currentRotation)
      }
    }

    // Handle video toggle (triggered by 'v' key)
    toggleVideoHandler = (e: Event) => {
      const sketch = $p5Store
      if (sketch && sketch.videoController) {
        sketch.videoController.toggleVisibility()
      }
    }

    // Attach event listeners
    window.addEventListener('igs:toggle-3d', toggle3DHandler)
    window.addEventListener('igs:rotate-floorplan', rotateFloorplanHandler as EventListener)
    window.addEventListener('igs:toggle-video', toggleVideoHandler)
  })

  onDestroy(() => {
    // Remove event listeners
    window.removeEventListener('igs:toggle-3d', toggle3DHandler)
    window.removeEventListener('igs:rotate-floorplan', rotateFloorplanHandler as EventListener)
    window.removeEventListener('igs:toggle-video', toggleVideoHandler)
  })
</script>

<div id="sketch-container"></div>
```

### Step 3: Modal Components

```svelte
<!-- src/lib/components/Modals.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'

  let showCheatsheet = false
  let showHelp = false

  // Event handlers
  let openCheatsheetHandler: (e: Event) => void
  let toggleHelpHandler: (e: Event) => void
  let downloadCodesHandler: (e: Event) => void
  let openCommandPaletteHandler: (e: Event) => void

  onMount(() => {
    openCheatsheetHandler = () => {
      showCheatsheet = true
    }

    toggleHelpHandler = () => {
      showHelp = !showHelp
    }

    downloadCodesHandler = () => {
      // Implement code download logic
      console.log('Downloading codes...')
      // Your download implementation here
    }

    openCommandPaletteHandler = () => {
      // Open command palette modal
      console.log('Opening command palette...')
      // Your command palette implementation here
    }

    window.addEventListener('igs:open-cheatsheet', openCheatsheetHandler)
    window.addEventListener('igs:toggle-help', toggleHelpHandler)
    window.addEventListener('igs:download-codes', downloadCodesHandler)
    window.addEventListener('igs:open-command-palette', openCommandPaletteHandler)
  })

  onDestroy(() => {
    window.removeEventListener('igs:open-cheatsheet', openCheatsheetHandler)
    window.removeEventListener('igs:toggle-help', toggleHelpHandler)
    window.removeEventListener('igs:download-codes', downloadCodesHandler)
    window.removeEventListener('igs:open-command-palette', openCommandPaletteHandler)
  })
</script>

{#if showCheatsheet}
  <div class="modal">
    <h2>Keyboard Shortcuts</h2>
    <!-- Your cheatsheet content -->
    <button on:click={() => (showCheatsheet = false)}>Close</button>
  </div>
{/if}

{#if showHelp}
  <div class="modal">
    <h2>Help</h2>
    <!-- Your help content -->
    <button on:click={() => (showHelp = false)}>Close</button>
  </div>
{/if}
```

### Step 4: Shortcuts Cheatsheet Component

```svelte
<!-- src/lib/components/ShortcutsCheatsheet.svelte -->
<script lang="ts">
  import {
    playbackShortcuts,
    viewShortcuts,
    selectionShortcuts,
    dataShortcuts,
    modalShortcuts,
  } from '$lib/keyboard'

  const categories = [
    { label: 'Playback', shortcuts: playbackShortcuts, color: 'blue' },
    { label: 'View', shortcuts: viewShortcuts, color: 'green' },
    { label: 'Selection', shortcuts: selectionShortcuts, color: 'purple' },
    { label: 'Data Display', shortcuts: dataShortcuts, color: 'orange' },
    { label: 'Application', shortcuts: modalShortcuts, color: 'red' },
  ]

  function formatModifiers(modifiers?: {
    ctrl?: boolean
    shift?: boolean
    alt?: boolean
    meta?: boolean
  }): string {
    if (!modifiers) return ''

    const parts = []
    if (modifiers.ctrl) parts.push('Ctrl')
    if (modifiers.meta) parts.push('Cmd')
    if (modifiers.alt) parts.push('Alt')
    if (modifiers.shift) parts.push('Shift')

    return parts.join('+')
  }

  function formatKey(key: string): string {
    // Display special keys nicely
    const keyMap: Record<string, string> = {
      ' ': 'Space',
      ArrowLeft: '←',
      ArrowRight: '→',
      ArrowUp: '↑',
      ArrowDown: '↓',
      Escape: 'Esc',
    }
    return keyMap[key] || key
  }
</script>

<div class="cheatsheet">
  <h2>Keyboard Shortcuts</h2>

  {#each categories as category}
    <div class="category" data-color={category.color}>
      <h3>{category.label}</h3>
      <table>
        <tbody>
          {#each category.shortcuts as shortcut}
            <tr>
              <td class="keys">
                {#if shortcut.modifiers}
                  <kbd>{formatModifiers(shortcut.modifiers)}</kbd>
                  <span>+</span>
                {/if}
                <kbd>{formatKey(shortcut.key)}</kbd>
              </td>
              <td class="label">{shortcut.label}</td>
              <td class="description">{shortcut.description}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/each}
</div>

<style>
  .cheatsheet {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .category {
    margin-bottom: 2rem;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  tr {
    border-bottom: 1px solid #eee;
  }

  td {
    padding: 0.75rem;
  }

  .keys {
    white-space: nowrap;
    font-weight: 600;
  }

  kbd {
    background: #f5f5f5;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    font-family: monospace;
    font-size: 0.9em;
  }

  .label {
    font-weight: 500;
    min-width: 150px;
  }

  .description {
    color: #666;
  }
</style>
```

### Step 5: File Input Component (for 'o' key)

```svelte
<!-- src/lib/components/FileInput.svelte -->
<script lang="ts">
  import { handleFiles } from '$lib/core'

  let fileInput: HTMLInputElement

  function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement
    if (target.files && target.files.length > 0) {
      handleFiles(target.files)
    }
  }
</script>

<!-- Hidden file input that gets triggered by 'o' shortcut -->
<input
  type="file"
  bind:this={fileInput}
  on:change={handleFileChange}
  accept=".csv,.jpg,.jpeg,.png,.mp4"
  multiple
  style="display: none;"
/>
```

## Testing the Integration

1. **Start the dev server**: `yarn dev`

2. **Test playback shortcuts**:
   - Load a CSV file
   - Press `Space` to play/pause
   - Press `←` and `→` to seek
   - Press `Home` and `End` to jump

3. **Test view shortcuts**:
   - Press `d` to toggle 3D
   - Press `r` to rotate
   - Press `v` to toggle video

4. **Test selection shortcuts**:
   - Press `1`, `2`, `3` to switch modes
   - Press `Esc` to clear

5. **Test display shortcuts**:
   - Press `m`, `s`, `a`, `c` to toggle displays

6. **Test application shortcuts**:
   - Press `Shift+?` to see cheatsheet
   - Press `h` for help
   - Press `o` to open files
   - Press `Ctrl/Cmd+Shift+S` to download
   - Press `Ctrl/Cmd+K` for command palette

## Debugging

Enable logging to see shortcut activity:

```typescript
import { registry } from '$lib/keyboard'

// Log all registered shortcuts
console.log('Registered shortcuts:', registry.getAll())

// Log by category
console.log('Playback shortcuts:', registry.getByCategory('playback'))

// Check if specific shortcut is registered
const playPause = registry.get('playback.play-pause')
console.log('Play/Pause shortcut:', playPause)
```

## Common Issues

### Shortcuts not working

- Ensure `registerAllShortcuts()` is called
- Ensure `attachKeyboardHandler()` is called
- Check browser console for errors

### Event not firing

- Verify event listener is attached
- Check event name matches exactly (case-sensitive)
- Ensure component is mounted when event fires

### Store not updating

- Check if store import is correct
- Verify store update syntax
- Use `$store` in template to see reactive updates
