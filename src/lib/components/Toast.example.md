# Toast Notifications

Toast notifications provide non-intrusive feedback to users about actions, errors, and system events.

## Features

- 4 types: info, success, warning, error
- Auto-dismiss with configurable duration
- Optional action button (e.g., "Undo")
- Stack multiple toasts (max 5)
- Smooth animations (fly in, fade out, flip reordering)
- Accessible (ARIA live regions)

## Setup

Add the `ToastContainer` component once in your app layout:

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import ToastContainer from '$lib/components/ToastContainer.svelte'
</script>

<ToastContainer />
<slot />
```

## Basic Usage

### Import

```svelte
<script>
  import { showToast, toastStore } from '$stores/toastStore'
</script>
```

### Simple Toasts

```typescript
// Using convenience function
showToast('File uploaded', 'success')
showToast('Network error', 'error')
showToast('Processing...', 'info')
showToast('Low disk space', 'warning')

// Using store methods
toastStore.success('Operation complete')
toastStore.error('Failed to save')
toastStore.info('New update available')
toastStore.warning('Session expiring soon')
```

### Custom Duration

```typescript
// Persistent toast (manual dismiss only)
showToast('Please review settings', 'warning', { duration: 0 })

// Long duration (10 seconds)
showToast('Download starting', 'info', { duration: 10000 })

// Short duration (1 second)
showToast('Copied!', 'success', { duration: 1000 })
```

## Action Buttons

Add an action button for undo, retry, or other quick actions:

```typescript
// Undo action
showToast('Item deleted', 'info', {
  duration: 5000,
  action: {
    label: 'Undo',
    onClick: () => {
      restoreItem()
      toastStore.success('Item restored')
    },
  },
})

// Retry action
showToast('Upload failed', 'error', {
  duration: 0, // Persistent until dismissed
  action: {
    label: 'Retry',
    onClick: () => retryUpload(),
  },
})

// View details action
showToast('Export complete', 'success', {
  action: {
    label: 'View',
    onClick: () => openExportFolder(),
  },
})
```

## Store API

### Methods

- `toastStore.add(message, type, options)` - Add a toast (returns ID)
- `toastStore.remove(id)` - Remove specific toast
- `toastStore.clear()` - Remove all toasts
- `toastStore.info(message, options)` - Add info toast
- `toastStore.success(message, options)` - Add success toast
- `toastStore.warning(message, options)` - Add warning toast
- `toastStore.error(message, options)` - Add error toast

### Subscription

```svelte
<script>
  import { toastStore } from '$stores/toastStore'

  // Subscribe to toast array
  $: currentToasts = $toastStore
  $: toastCount = $toastStore.length
</script>

{#if toastCount > 0}
  <p>{toastCount} active notification{toastCount !== 1 ? 's' : ''}</p>
{/if}
```

## Common Patterns

### File Operations

```typescript
// Upload success
toastStore.success('File uploaded successfully')

// Save with undo
const previousState = saveState()
saveFile()
showToast('Changes saved', 'success', {
  action: {
    label: 'Undo',
    onClick: () => restoreState(previousState),
  },
})

// Export complete
toastStore.info('Export complete', {
  action: {
    label: 'Download',
    onClick: () => window.open(exportUrl),
  },
})
```

### Error Handling

```typescript
try {
  await riskyOperation()
  toastStore.success('Operation completed')
} catch (error) {
  toastStore.error(`Failed: ${error.message}`, {
    duration: 5000,
    action: {
      label: 'Retry',
      onClick: () => riskyOperation(),
    },
  })
}
```

### Loading States

```typescript
// Start operation
const toastId = showToast('Processing...', 'info', { duration: 0 })

try {
  await longRunningTask()
  toastStore.remove(toastId)
  toastStore.success('Processing complete')
} catch (error) {
  toastStore.remove(toastId)
  toastStore.error('Processing failed')
}
```

### Undo/Redo Feedback

```typescript
// Undo action
function handleUndo() {
  undoManager.undo()
  const lastAction = undoManager.getLastAction()
  showToast(`Undid: ${lastAction.description}`, 'info', {
    duration: 2000,
    action: {
      label: 'Redo',
      onClick: () => undoManager.redo(),
    },
  })
}

// Redo action
function handleRedo() {
  undoManager.redo()
  const lastAction = undoManager.getLastAction()
  toastStore.info(`Redid: ${lastAction.description}`, {
    duration: 2000,
  })
}
```

## Styling

The component uses DaisyUI alert classes and supports theme switching:

- `alert-info` - Blue (info messages)
- `alert-success` - Green (success messages)
- `alert-warning` - Yellow (warning messages)
- `alert-error` - Red (error messages)

### Position

Toasts appear in the **top-right corner** using DaisyUI's `toast-top toast-end` classes.

To change position, modify the container classes:

```svelte
<!-- Top left -->
<div class="toast toast-top toast-start">

<!-- Bottom right -->
<div class="toast toast-bottom toast-end">

<!-- Bottom center -->
<div class="toast toast-bottom toast-center">
```

## Accessibility

- Uses `role="alert"` for screen reader announcements
- `aria-live="polite"` ensures non-intrusive announcements
- Keyboard accessible dismiss buttons
- Sufficient color contrast for all toast types
- Close button has `aria-label="Dismiss"`

## Technical Details

### Z-Index

Toasts use `Z_INDEX.TOAST` (300) to appear above modals and other UI elements.

### Limits

- Maximum 5 toasts displayed at once (oldest removed first)
- Default duration: 3000ms (3 seconds)
- Duration 0 = persistent (manual dismiss only)

### Animations

- **Entry**: Fly in from right (100px, 200ms)
- **Exit**: Fade out (150ms)
- **Reorder**: Flip animation (200ms)

### Performance

- Uses Svelte transitions for smooth animations
- Auto-cleanup with `setTimeout` for timed toasts
- Efficient updates via Svelte stores
- No memory leaks (timers cleared on removal)
