# IGS Undo/Redo System

A complete undo/redo system for the IGS application that makes all store updates reversible.

## Features

- **Full undo/redo support** for all store operations
- **Keyboard shortcuts** (Cmd+Z / Ctrl+Z for undo, Cmd+Shift+Z / Ctrl+Shift+Z for redo)
- **Debounced slider changes** (prevents hundreds of history entries when dragging sliders)
- **Type-safe helpers** for all config, user, and data operations
- **Memory efficient** (stores only the changes, not entire state snapshots)
- **Easy integration** with existing Svelte components

## Quick Start

### 1. Import and use in your component

```svelte
<script lang="ts">
  import { toggleMovement, setAnimationRate } from '$lib/history'
  import ConfigStore from '$stores/configStore'
</script>

<button onclick={toggleMovement}>Toggle Movement</button>
<input type="range" oninput={(e) => setAnimationRate(e.target.valueAsNumber)} />
```

### 2. Register keyboard shortcuts in your layout

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { registerHistoryKeyboard } from '$lib/history'
  import { onMount } from 'svelte'

  onMount(() => {
    const cleanup = registerHistoryKeyboard()
    return cleanup
  })
</script>
```

Now users can undo/redo with Cmd+Z / Ctrl+Z!

## File Structure

```
src/lib/history/
├── index.ts                    # Main exports
├── undoable.ts                 # Generic undoable wrapper
├── config-actions.ts           # Config store helpers
├── user-actions.ts             # User store helpers
├── data-actions.ts             # Data clearing helpers
├── keyboard.ts                 # Keyboard shortcut registration
├── USAGE.md                    # Detailed usage guide
├── INTEGRATION_EXAMPLES.md     # Real-world examples
└── README.md                   # This file

src/stores/
└── historyStore.ts             # Core history state management
```

## Available Actions

### Config Actions

```typescript
// Boolean toggles
toggleMovement()
toggleStops()
toggleCircle()
toggleSlice()
toggleHighlight()
toggleAlign()
toggleColorMode()
toggleDataHasCodes()

// Numeric sliders (auto-debounced)
setAnimationRate(0.1)
setSamplingInterval(0.5)
setStopSliderValue(1)
setConversationRectWidth(5)
setMovementStrokeWeight(1)
setStopStrokeWeight(9)

// String inputs
setWordToSearch('hello')

// Reset
resetConfig()
```

### User Actions

```typescript
// Individual users
toggleUserEnabled('Teacher')
toggleUserConversationEnabled('Teacher')
setUserColor('Teacher', '#ff0000')

// All users
toggleAllUsers(true)
toggleAllUsersConversation(false)
```

### Data Actions

```typescript
clearUsers()
clearCodes()
clearAllData()
```

### Custom Actions

```typescript
import { undoable } from '$lib/history'

undoable(
  'custom.action',
  'My custom action',
  () => performAction(),
  () => undoAction(),
  () => redoAction()
)
```

## Documentation

- **[USAGE.md](./USAGE.md)** - Complete API reference with examples
- **[INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md)** - Real-world integration patterns

## How It Works

1. **Action Helpers** wrap store updates and record them in history
2. **History Store** maintains two stacks: `past` and `future`
3. **Undo** pops from past, calls `action.undo()`, pushes to future
4. **Redo** pops from future, calls `action.redo()`, pushes to past
5. **New Actions** clear the future stack (can't redo after new action)

## TypeScript Safety

All helpers are fully typed and will show errors if used incorrectly:

```typescript
toggleConfig('animationRate', 'label') // ✗ ERROR: not a boolean
setConfigNumber('movementToggle', 5, 'label') // ✗ ERROR: not a number
toggleUserEnabled('Teacher') // ✓ OK
```

## Performance

- Slider changes are debounced (default 300ms)
- Only changed values are stored, not full state snapshots
- History can be cleared with `historyStore.clear()`
- No-op if value hasn't changed (e.g., setting same color)

## Testing

```typescript
import { expect, test } from 'vitest'
import { get } from 'svelte/store'
import { toggleMovement, historyStore } from '$lib/history'
import ConfigStore from '$stores/configStore'

test('toggleMovement is undoable', () => {
  const initial = get(ConfigStore).movementToggle

  toggleMovement()
  expect(get(ConfigStore).movementToggle).toBe(!initial)

  historyStore.undo()
  expect(get(ConfigStore).movementToggle).toBe(initial)

  historyStore.redo()
  expect(get(ConfigStore).movementToggle).toBe(!initial)
})
```

## Migration Guide

Converting existing components is straightforward:

**Before:**

```svelte
<button onclick={() => ConfigStore.update((c) => ({ ...c, movementToggle: !c.movementToggle }))}>
  Toggle
</button>
```

**After:**

```svelte
<button onclick={toggleMovement}> Toggle </button>
```

See [INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md) for more examples.

## Keyboard Shortcuts

- **Cmd+Z** (Mac) / **Ctrl+Z** (Windows/Linux): Undo
- **Cmd+Shift+Z** (Mac) / **Ctrl+Shift+Z** (Windows/Linux): Redo

## Accessing History State

```svelte
<script lang="ts">
  import { historyStore } from '$lib/history'
</script>

<button onclick={() => historyStore.undo()} disabled={$historyStore.past.length === 0}>
  Undo
</button>

<button onclick={() => historyStore.redo()} disabled={$historyStore.future.length === 0}>
  Redo
</button>

{#if $historyStore.past.length > 0}
  <p>Last action: {$historyStore.past[$historyStore.past.length - 1].actionLabel}</p>
{/if}
```

## Contributing

When adding new undoable actions:

1. Add the helper function to the appropriate file (`config-actions.ts`, `user-actions.ts`, etc.)
2. Export it from `index.ts`
3. Add usage examples to `USAGE.md`
4. Add integration examples to `INTEGRATION_EXAMPLES.md`
5. Write tests

## License

Part of the IGS (Interaction Geography Slicer) project.
