# Undoable Actions

This module provides a complete undo/redo system for IGS. All state changes can be made undoable by using the provided action helpers.

## Quick Start

### 1. Register Keyboard Shortcuts

In your root layout (e.g., `src/routes/+layout.svelte`):

```svelte
<script lang="ts">
  import { registerHistoryKeyboard } from '$lib/history'
  import { onMount } from 'svelte'

  onMount(() => {
    const cleanup = registerHistoryKeyboard()
    return cleanup
  })
</script>
```

Now Cmd+Z (Mac) / Ctrl+Z (Windows/Linux) will undo, and Cmd+Shift+Z / Ctrl+Shift+Z will redo.

### 2. Use Undoable Actions

Instead of directly updating stores, use the action helpers:

```svelte
<script lang="ts">
  import { toggleMovement, setAnimationRate, toggleUserEnabled } from '$lib/history'
</script>

<button onclick={toggleMovement}>Toggle Movement</button>
<input type="range" oninput={(e) => setAnimationRate(e.target.valueAsNumber)} />
<button onclick={() => toggleUserEnabled('Teacher')}>Toggle Teacher</button>
```

## Config Actions

### Boolean Toggles

```typescript
import {
	toggleMovement,
	toggleStops,
	toggleCircle,
	toggleSlice,
	toggleHighlight,
	toggleAlign,
	toggleColorMode,
	toggleDataHasCodes
} from '$lib/history'

// In a component
<button onclick={toggleMovement}>Toggle Movement Trails</button>
<button onclick={toggleStops}>Toggle Stop Points</button>
```

Or use the generic toggle function:

```typescript
import { toggleConfig } from '$lib/history'

toggleConfig('movementToggle', 'movement trails')
```

### Numeric Values (Sliders)

The numeric setters automatically debounce slider changes (default 300ms) so dragging a slider doesn't create hundreds of history entries:

```typescript
import {
	setAnimationRate,
	setSamplingInterval,
	setStopSliderValue,
	setConversationRectWidth,
	setMovementStrokeWeight,
	setStopStrokeWeight
} from '$lib/history'

// In a component
<input
	type="range"
	min="0.01"
	max="0.2"
	step="0.01"
	oninput={(e) => setAnimationRate(e.target.valueAsNumber)}
/>
```

Or use the generic numeric setter:

```typescript
import { setConfigNumber } from '$lib/history'

// Default 300ms debounce
setConfigNumber('animationRate', 0.1, 'animation speed')

// Custom debounce time
setConfigNumber('animationRate', 0.1, 'animation speed', 500)
```

### String Values

```typescript
import { setWordToSearch } from '$lib/history'

<input
	type="text"
	oninput={(e) => setWordToSearch(e.target.value)}
/>
```

Or use the generic string setter:

```typescript
import { setConfigString } from '$lib/history'

setConfigString('wordToSearch', 'hello', 'search word')
```

### Reset Config

```typescript
import { resetConfig } from '$lib/history'

<button onclick={resetConfig}>Reset All Settings</button>
```

## User Actions

### Toggle Individual Users

```typescript
import { toggleUserEnabled, toggleUserConversationEnabled } from '$lib/history'

toggleUserEnabled('Teacher')
toggleUserConversationEnabled('Teacher')
```

### Change User Colors

```typescript
import { setUserColor } from '$lib/history'

setUserColor('Teacher', '#ff0000')
```

### Toggle All Users

```typescript
import { toggleAllUsers, toggleAllUsersConversation } from '$lib/history'

// Show/hide all users
toggleAllUsers(true) // Show all
toggleAllUsers(false) // Hide all

// Show/hide all conversations
toggleAllUsersConversation(true)
toggleAllUsersConversation(false)
```

## Data Actions

```typescript
import { clearUsers, clearCodes, clearAllData } from '$lib/history'

// Each is undoable
clearUsers()
clearCodes()
clearAllData()
```

## Advanced: Custom Undoable Actions

For actions not covered by the helpers, use the `undoable` wrapper:

```typescript
import { undoable } from '$lib/history'

function myCustomAction() {
  const oldValue = getCurrentValue()
  const newValue = calculateNewValue()

  undoable(
    'custom.action', // Action type (for categorization)
    'Did something custom', // Label shown in history
    () => applyNewValue(), // Execute function
    () => applyOldValue(), // Undo function
    () => applyNewValue() // Redo function (optional, defaults to execute)
  )
}
```

Or push directly to the history store:

```typescript
import { historyStore } from '$lib/history'
import { get } from 'svelte/store'

const before = get(MyStore)
MyStore.update(...)

historyStore.push({
	actionType: 'my.action',
	actionLabel: 'My custom action',
	undo: () => MyStore.set(before),
	redo: () => MyStore.update(...)
})
```

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

## Complete Example Component

```svelte
<script lang="ts">
  import { toggleMovement, setAnimationRate, toggleUserEnabled, historyStore } from '$lib/history'
  import UserStore from '$stores/userStore'
  import ConfigStore from '$stores/configStore'

  const canUndo = $derived($historyStore.past.length > 0)
  const canRedo = $derived($historyStore.future.length > 0)
</script>

<div class="controls">
  <!-- Undo/Redo buttons -->
  <button onclick={() => historyStore.undo()} disabled={!canUndo}>
    Undo {canUndo ? `(${$historyStore.past[$historyStore.past.length - 1].actionLabel})` : ''}
  </button>
  <button onclick={() => historyStore.redo()} disabled={!canRedo}>
    Redo {canRedo ? `(${$historyStore.future[0].actionLabel})` : ''}
  </button>

  <!-- Toggle controls -->
  <label>
    <input type="checkbox" checked={$ConfigStore.movementToggle} onchange={toggleMovement} />
    Show Movement
  </label>

  <!-- Slider with debounced history -->
  <label>
    Animation Speed
    <input
      type="range"
      min="0.01"
      max="0.2"
      step="0.01"
      value={$ConfigStore.animationRate}
      oninput={(e) => setAnimationRate(e.target.valueAsNumber)}
    />
  </label>

  <!-- User toggles -->
  {#each $UserStore as user}
    <button onclick={() => toggleUserEnabled(user.name)}>
      {user.enabled ? 'Hide' : 'Show'}
      {user.name}
    </button>
  {/each}
</div>
```

## Keyboard Shortcuts

- **Cmd+Z** (Mac) / **Ctrl+Z** (Windows/Linux): Undo
- **Cmd+Shift+Z** (Mac) / **Ctrl+Shift+Z** (Windows/Linux): Redo

## Implementation Notes

### Debouncing

Slider changes are automatically debounced to prevent creating a history entry for every pixel dragged. The default debounce is 300ms but can be customized:

```typescript
setConfigNumber('animationRate', value, 'animation speed', 500) // 500ms debounce
```

### Memory Considerations

Each history entry stores closures that capture state. For large data structures (like User arrays with many DataPoints), consider:

1. Only making structural changes undoable (add/remove users, not individual datapoint edits)
2. Clearing history when loading new data files
3. Limiting history depth if needed

### TypeScript Safety

All action helpers are fully typed and will show TypeScript errors if you try to use the wrong type:

```typescript
toggleConfig('animationRate', 'label') // ERROR: animationRate is not boolean
setConfigNumber('movementToggle', 5, 'label') // ERROR: movementToggle is not number
```

## Testing Undo/Redo

```typescript
import { toggleMovement, historyStore } from '$lib/history'
import { get } from 'svelte/store'

// Perform action
toggleMovement()
console.log(get(historyStore).past.length) // 1

// Undo
historyStore.undo()
console.log(get(historyStore).past.length) // 0
console.log(get(historyStore).future.length) // 1

// Redo
historyStore.redo()
console.log(get(historyStore).past.length) // 1
console.log(get(historyStore).future.length) // 0
```
