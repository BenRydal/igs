# Quick Reference - IGS Undo/Redo

## Import

```typescript
import {
  // Core
  historyStore,
  undoable,
  registerHistoryKeyboard,

  // Config Toggles
  toggleMovement,
  toggleStops,
  toggleCircle,
  toggleSlice,
  toggleHighlight,
  toggleAlign,
  toggleColorMode,
  toggleDataHasCodes,

  // Config Numbers
  setAnimationRate,
  setSamplingInterval,
  setStopSliderValue,
  setConversationRectWidth,
  setMovementStrokeWeight,
  setStopStrokeWeight,

  // Config Strings
  setWordToSearch,

  // Config Reset
  resetConfig,

  // Users
  toggleUserEnabled,
  toggleUserConversationEnabled,
  setUserColor,
  toggleAllUsers,
  toggleAllUsersConversation,

  // Data
  clearUsers,
  clearCodes,
  clearAllData,
} from '$lib/history'
```

## Basic Usage

### Toggles

```svelte
<button onclick={toggleMovement}>Toggle</button>
```

### Sliders (auto-debounced)

```svelte
<input
  type="range"
  value={$ConfigStore.animationRate}
  oninput={(e) => setAnimationRate(e.target.valueAsNumber)}
/>
```

### Color Picker

```svelte
<input type="color" value={user.color} onchange={(e) => setUserColor(user.name, e.target.value)} />
```

### Undo/Redo Buttons

```svelte
<button onclick={() => historyStore.undo()} disabled={$historyStore.past.length === 0}>
  Undo
</button>

<button onclick={() => historyStore.redo()} disabled={$historyStore.future.length === 0}>
  Redo
</button>
```

## Keyboard Shortcuts

Register once in `src/routes/+layout.svelte`:

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

Then:

- **Cmd+Z** (Mac) / **Ctrl+Z** (Windows): Undo
- **Cmd+Shift+Z** / **Ctrl+Shift+Z**: Redo

## Custom Actions

```typescript
import { undoable } from '$lib/history'

undoable(
  'my.action', // Action type
  'My action', // Label
  () => doSomething(), // Execute
  () => undoIt(), // Undo
  () => redoIt() // Redo (optional)
)
```

Or directly:

```typescript
import { historyStore } from '$lib/history'
import { get } from 'svelte/store'

const before = get(MyStore)
MyStore.update(...)

historyStore.push({
	actionType: 'my.action',
	actionLabel: 'My action',
	undo: () => MyStore.set(before),
	redo: () => MyStore.update(...),
})
```

## History State

```svelte
$historyStore.past // Array of completed actions $historyStore.future // Array of undone actions
(for redo) $historyStore.past.length === 0 // Can't undo $historyStore.future.length === 0 // Can't
redo
```

## All Config Helpers

| Helper                        | Config Key              | Type    | Description        |
| ----------------------------- | ----------------------- | ------- | ------------------ |
| `toggleMovement()`            | `movementToggle`        | boolean | Movement trails    |
| `toggleStops()`               | `stopsToggle`           | boolean | Stop points        |
| `toggleCircle()`              | `circleToggle`          | boolean | Circle selection   |
| `toggleSlice()`               | `sliceToggle`           | boolean | Slice selection    |
| `toggleHighlight()`           | `highlightToggle`       | boolean | Highlight mode     |
| `toggleAlign()`               | `alignToggle`           | boolean | Talk alignment     |
| `toggleColorMode()`           | `isPathColorMode`       | boolean | Color by codes     |
| `toggleDataHasCodes()`        | `dataHasCodes`          | boolean | Data has codes     |
| `setAnimationRate(n)`         | `animationRate`         | number  | Animation speed    |
| `setSamplingInterval(n)`      | `samplingInterval`      | number  | Sampling interval  |
| `setStopSliderValue(n)`       | `stopSliderValue`       | number  | Stop threshold     |
| `setConversationRectWidth(n)` | `conversationRectWidth` | number  | Conversation width |
| `setMovementStrokeWeight(n)`  | `movementStrokeWeight`  | number  | Movement stroke    |
| `setStopStrokeWeight(n)`      | `stopStrokeWeight`      | number  | Stop stroke        |
| `setWordToSearch(s)`          | `wordToSearch`          | string  | Search word        |
| `resetConfig()`               | all                     | -       | Reset to defaults  |

## All User Helpers

| Helper                                  | Description                    |
| --------------------------------------- | ------------------------------ |
| `toggleUserEnabled(userId)`             | Toggle user visibility         |
| `toggleUserConversationEnabled(userId)` | Toggle conversation visibility |
| `setUserColor(userId, color)`           | Change user color              |
| `toggleAllUsers(enabled)`               | Show/hide all users            |
| `toggleAllUsersConversation(enabled)`   | Show/hide all conversations    |

## All Data Helpers

| Helper           | Description         |
| ---------------- | ------------------- |
| `clearUsers()`   | Clear all user data |
| `clearCodes()`   | Clear all codes     |
| `clearAllData()` | Clear everything    |

## Common Patterns

### Show last action

```svelte
{#if $historyStore.past.length > 0}
  Last: {$historyStore.past[$historyStore.past.length - 1].actionLabel}
{/if}
```

### History counter

```svelte
{$historyStore.past.length} action{$historyStore.past.length !== 1 ? 's' : ''}
```

### Undo with label

```svelte
<button disabled={$historyStore.past.length === 0}>
  Undo {$historyStore.past.length > 0
    ? `(${$historyStore.past[$historyStore.past.length - 1].actionLabel})`
    : ''}
</button>
```

### Debug panel

```svelte
{#if import.meta.env.DEV}
  <div>
    Past: {$historyStore.past.map((a) => a.actionLabel).join(', ')}
    <br />
    Future: {$historyStore.future.map((a) => a.actionLabel).join(', ')}
  </div>
{/if}
```

## Migration Pattern

1. Find direct store update:

   ```svelte
   ConfigStore.update(c => ({ ...c, movementToggle: !c.movementToggle }))
   ```

2. Replace with helper:

   ```svelte
   toggleMovement()
   ```

3. Import helper:
   ```svelte
   import {toggleMovement} from '$lib/history'
   ```

## Best Practices

✅ **Do:**

- Use provided helpers
- Debounce continuous inputs (sliders)
- Clear history when loading new files
- Check if value changed before pushing to history

❌ **Don't:**

- Create history for every animation frame
- Store entire large objects
- Make temporary UI state undoable
- Nest undoable actions

## Files

| File                                | Purpose            |
| ----------------------------------- | ------------------ |
| `src/stores/historyStore.ts`        | Core history state |
| `src/lib/history/index.ts`          | Main exports       |
| `src/lib/history/config-actions.ts` | Config helpers     |
| `src/lib/history/user-actions.ts`   | User helpers       |
| `src/lib/history/data-actions.ts`   | Data helpers       |
| `src/lib/history/keyboard.ts`       | Keyboard shortcuts |
| `src/lib/history/undoable.ts`       | Generic wrapper    |

## Documentation

- **README.md** - Quick start
- **USAGE.md** - Complete API reference
- **INTEGRATION_EXAMPLES.md** - Real-world examples
- **EXAMPLE_COMPONENT.md** - Full component
- **OVERVIEW.md** - Technical details
- **INTEGRATION_CHECKLIST.md** - Step-by-step guide
- **QUICK_REFERENCE.md** - This file

## Support

Issues? Check:

1. This quick reference
2. USAGE.md for detailed docs
3. INTEGRATION_EXAMPLES.md for examples
4. EXAMPLE_COMPONENT.md for full component
