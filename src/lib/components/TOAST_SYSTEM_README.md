# Toast Notification System

A complete toast notification system for IGS with support for undo/redo feedback and other user messages.

## Files Created

### 1. `/src/stores/toastStore.ts`

Central store managing toast notifications with:

- TypeScript interfaces for type safety
- Auto-dismiss functionality
- Action button support
- Max toast limits (5)
- Convenience methods for all toast types

### 2. `/src/lib/components/ToastContainer.svelte`

UI component that:

- Displays toasts in top-right corner
- Handles animations (fly in, fade out, flip reordering)
- Supports DaisyUI theme colors
- Provides dismiss buttons
- Implements accessibility features

### 3. `/src/lib/components/Toast.example.md`

Comprehensive documentation including:

- Usage examples
- Common patterns
- API reference
- Accessibility notes
- Styling guide

### 4. `/src/lib/components/ToastDemo.svelte`

Interactive demo component showcasing:

- All toast types (info, success, warning, error)
- Different durations
- Action buttons (undo, retry)
- Stress testing

## Integration

The `ToastContainer` has been added to `/src/routes/+layout.svelte` so it's available globally.

```svelte
<script>
  import '../app.css'
  import ToastContainer from '$lib/components/ToastContainer.svelte'
</script>

<ToastContainer />
<slot />
```

## Quick Start

### Basic Usage

```typescript
import { toastStore, showToast } from '$stores/toastStore'

// Simple toasts
toastStore.info('Information message')
toastStore.success('Operation successful!')
toastStore.warning('Warning message')
toastStore.error('Error occurred')

// Or using showToast
showToast('Custom message', 'success')
```

### With Action Button (Undo/Redo)

```typescript
// Undo example
showToast('Item deleted', 'info', {
  duration: 5000,
  action: {
    label: 'Undo',
    onClick: () => restoreItem(),
  },
})

// Redo example
toastStore.info('Action undone', {
  action: {
    label: 'Redo',
    onClick: () => redoAction(),
  },
})
```

### Custom Duration

```typescript
// Quick toast (1 second)
showToast('Copied!', 'success', { duration: 1000 })

// Long toast (10 seconds)
showToast('Processing...', 'info', { duration: 10000 })

// Persistent (manual dismiss only)
showToast('Please review', 'warning', { duration: 0 })
```

## Design Decisions

### Z-Index

Uses `Z_INDEX.TOAST` (300) which places toasts above all other UI elements including modals (110). This ensures important feedback is always visible.

### Position

Top-right corner (`toast-top toast-end`) keeps toasts visible without blocking the main canvas area.

### Animation

- **Entry**: Fly in from right (200ms) - clear visual indication
- **Exit**: Fade out (150ms) - smooth dismissal
- **Reorder**: Flip animation (200ms) - smooth stack changes

### Limits

Maximum 5 toasts prevents screen clutter. Oldest toasts are automatically removed when limit is reached.

### Default Duration

3 seconds (3000ms) balances readability with non-intrusiveness. Adjustable per toast.

### Accessibility

- `role="alert"` announces new toasts to screen readers
- `aria-live="polite"` prevents interrupting user
- `aria-label` on dismiss buttons
- Keyboard accessible buttons
- DaisyUI theme-aware colors ensure contrast

## Common Use Cases

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
```

### Error Handling

```typescript
try {
  await riskyOperation()
  toastStore.success('Operation completed')
} catch (error) {
  toastStore.error(`Failed: ${error.message}`, {
    action: {
      label: 'Retry',
      onClick: () => riskyOperation(),
    },
  })
}
```

### Loading States

```typescript
const toastId = showToast('Processing...', 'info', { duration: 0 })

try {
  await longTask()
  toastStore.remove(toastId)
  toastStore.success('Complete')
} catch (error) {
  toastStore.remove(toastId)
  toastStore.error('Failed')
}
```

### Undo/Redo Integration

```typescript
function handleUndo() {
  undoManager.undo()
  const action = undoManager.getLastAction()
  showToast(`Undid: ${action.description}`, 'info', {
    duration: 2000,
    action: {
      label: 'Redo',
      onClick: () => handleRedo(),
    },
  })
}

function handleRedo() {
  undoManager.redo()
  const action = undoManager.getLastAction()
  toastStore.info(`Redid: ${action.description}`, {
    duration: 2000,
  })
}
```

## API Reference

### Store Methods

#### `toastStore.add(message, type, options)`

Add a new toast and return its ID.

**Parameters:**

- `message: string` - Text to display
- `type: 'info' | 'success' | 'warning' | 'error'` - Visual style
- `options?: ToastOptions` - Configuration object

**Returns:** `string` - Unique toast ID

#### `toastStore.remove(id)`

Remove a specific toast by ID.

**Parameters:**

- `id: string` - Toast ID to remove

#### `toastStore.clear()`

Remove all toasts.

#### Convenience Methods

- `toastStore.info(message, options?)` - Add info toast
- `toastStore.success(message, options?)` - Add success toast
- `toastStore.warning(message, options?)` - Add warning toast
- `toastStore.error(message, options?)` - Add error toast

### Types

```typescript
interface Toast {
  id: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  duration: number // ms, 0 = persistent
  createdAt: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastOptions {
  duration?: number // default: 3000
  action?: {
    label: string
    onClick: () => void
  }
}
```

## Testing

To test the toast system, you can:

1. **Use the demo component:**

   ```svelte
   <script>
     import ToastDemo from '$lib/components/ToastDemo.svelte'
   </script>

   <ToastDemo />
   ```

2. **Browser console:**

   ```javascript
   // Import in browser console (if exposed)
   window.showToast = (msg, type) => {
     // Your app's toast trigger
   }
   ```

3. **Keyboard shortcuts:**
   Add keyboard shortcuts for common operations that trigger toasts (undo/redo, save, etc.)

## Future Enhancements

Potential improvements:

- [ ] Sound effects for different toast types
- [ ] Progress bar for timed toasts
- [ ] Grouping similar toasts
- [ ] Custom icons per toast
- [ ] Position configuration (per toast or global)
- [ ] Rich HTML content support
- [ ] Queue priority system

## Troubleshooting

### Toasts not appearing

1. Check that `ToastContainer` is in your layout
2. Verify z-index isn't being overridden
3. Check browser console for errors

### Toasts blocking clicks

The container uses `pointer-events: none` with `pointer-events: auto` on children. If you modify the styles, ensure this pattern is preserved.

### Theme colors not working

Ensure DaisyUI is properly configured in your Tailwind config and the theme is loaded.

### Animations not smooth

Ensure Svelte transitions are enabled and not disabled via `{#if}` conditional removal.
