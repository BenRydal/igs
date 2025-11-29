# IGS Undo/Redo System - Technical Overview

This document provides a technical overview of the undo/redo implementation for IGS.

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────┐
│                    Svelte Components                     │
│  (Settings panels, toggles, sliders, color pickers)     │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Call action helpers
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   Action Helpers                         │
│  (toggleMovement, setUserColor, clearData, etc.)        │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ 1. Update store
                     │ 2. Push to history
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   History Store                          │
│  { past: HistoryAction[], future: HistoryAction[] }     │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Stores undo/redo closures
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Keyboard/Manual Triggers                    │
│           Cmd+Z → undo()  |  Cmd+Shift+Z → redo()       │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Interaction** → Component event (onclick, oninput, etc.)
2. **Action Helper** → Calls appropriate helper function
3. **Store Update** → Helper updates the actual store
4. **History Push** → Helper pushes action to history store
5. **Undo/Redo** → User triggers undo/redo via keyboard or button
6. **Closure Execution** → History store calls stored undo/redo function
7. **Store Revert** → Store returns to previous state

## File Structure

```
src/
├── stores/
│   └── historyStore.ts         # Core history state (past/future stacks)
│
└── lib/
    └── history/
        ├── index.ts             # Main exports
        ├── undoable.ts          # Generic wrapper
        ├── keyboard.ts          # Keyboard shortcuts
        ├── config-actions.ts    # ConfigStore helpers
        ├── user-actions.ts      # UserStore helpers
        ├── data-actions.ts      # Data clearing helpers
        ├── README.md            # Quick start guide
        ├── USAGE.md             # API reference
        ├── INTEGRATION_EXAMPLES.md  # Real-world examples
        ├── EXAMPLE_COMPONENT.md     # Full component example
        └── OVERVIEW.md          # This file
```

## History Store Implementation

```typescript
interface HistoryAction {
  actionType: string // Category (e.g., "config.toggle", "user.color")
  actionLabel: string // Human-readable (e.g., "Changed Teacher color")
  undo: () => void // Function to undo the action
  redo: () => void // Function to redo the action
}

interface HistoryState {
  past: HistoryAction[] // Stack of completed actions
  future: HistoryAction[] // Stack of undone actions (for redo)
}
```

### Operations

**Push (New Action)**

```typescript
push(action) {
	state.past.push(action)
	state.future = [] // Clear future on new action
}
```

**Undo**

```typescript
undo() {
	const action = state.past.pop()
	action.undo()           // Execute undo
	state.future.unshift(action)
}
```

**Redo**

```typescript
redo() {
	const action = state.future.shift()
	action.redo()           // Execute redo
	state.past.push(action)
}
```

## Action Helper Pattern

All action helpers follow this pattern:

```typescript
export function actionHelper(params) {
	// 1. Capture current state
	const before = get(Store)

	// 2. Validate if needed
	if (invalidCondition) return

	// 3. Apply the change
	Store.update(...)

	// 4. Push to history
	historyStore.push({
		actionType: 'category.action',
		actionLabel: 'User-friendly description',
		undo: () => Store.update(...restore before...),
		redo: () => Store.update(...apply change...),
	})
}
```

## Debouncing Strategy

For continuous inputs (sliders), we use a module-level debounce:

```typescript
let sliderDebounceTimer: ReturnType<typeof setTimeout> | null = null
let sliderInitialValue: number | null = null
let sliderKey: string | null = null

export function setConfigNumber(key, value, label, debounce = 300) {
	// Track initial value on first call
	if (sliderKey !== key || sliderInitialValue === null) {
		sliderInitialValue = current[key]
		sliderKey = key
	}

	// Apply immediately (responsive UI)
	Store.update(...)

	// Debounce history entry
	clearTimeout(sliderDebounceTimer)
	sliderDebounceTimer = setTimeout(() => {
		historyStore.push(/* only if value changed */)
		// Reset tracking
	}, debounce)
}
```

**Benefits:**

- UI remains responsive (updates immediately)
- History only records final value after user stops dragging
- Single undo reverts entire slider interaction
- Configurable debounce time (default 300ms)

## Memory Management

### What Gets Stored

**Good:** Store minimal state

```typescript
// ✓ GOOD: Only store the changed value
historyStore.push({
  undo: () => ConfigStore.update((c) => ({ ...c, movementToggle: false })),
  redo: () => ConfigStore.update((c) => ({ ...c, movementToggle: true })),
})
```

**Bad:** Store full objects

```typescript
// ✗ BAD: Storing entire user arrays with all DataPoints
const allUsers = get(UserStore) // Could be huge!
historyStore.push({
  undo: () => UserStore.set(allUsers),
  // ...
})
```

### When to Clear History

```typescript
// Clear history when loading new data
fileInput.addEventListener('change', () => {
  loadNewData()
  historyStore.clear() // Old actions no longer valid
})
```

## Type Safety

All helpers are type-safe:

```typescript
// ConfigStoreType defines all valid keys and their types
export function toggleConfig(key: keyof ConfigStoreType, label: string) {
  const beforeValue = before[key]

  if (typeof beforeValue !== 'boolean') {
    console.warn(`toggleConfig: ${key} is not a boolean`)
    return
  }
  // ...
}
```

TypeScript catches errors at compile time:

```typescript
toggleConfig('animationRate', 'label')
// Error: animationRate is number, not boolean
```

## Testing Strategy

### Unit Tests

```typescript
import { expect, test } from 'vitest'
import { get } from 'svelte/store'
import { toggleMovement, historyStore } from '$lib/history'
import ConfigStore from '$stores/configStore'

test('toggle creates history entry', () => {
  const initial = get(ConfigStore).movementToggle

  toggleMovement()

  expect(get(ConfigStore).movementToggle).toBe(!initial)
  expect(get(historyStore).past.length).toBe(1)
  expect(get(historyStore).past[0].actionType).toBe('config.toggle')
})

test('undo reverts change', () => {
  const initial = get(ConfigStore).movementToggle

  toggleMovement()
  historyStore.undo()

  expect(get(ConfigStore).movementToggle).toBe(initial)
  expect(get(historyStore).past.length).toBe(0)
  expect(get(historyStore).future.length).toBe(1)
})

test('redo reapplies change', () => {
  const initial = get(ConfigStore).movementToggle

  toggleMovement()
  historyStore.undo()
  historyStore.redo()

  expect(get(ConfigStore).movementToggle).toBe(!initial)
  expect(get(historyStore).future.length).toBe(0)
})
```

### Integration Tests

```typescript
test('slider debounce prevents spam', async () => {
  const initial = get(ConfigStore).animationRate

  // Simulate dragging slider
  setAnimationRate(0.1)
  setAnimationRate(0.11)
  setAnimationRate(0.12)
  // Only one history entry after debounce

  await new Promise((resolve) => setTimeout(resolve, 400))
  expect(get(historyStore).past.length).toBe(1)
})
```

## Performance Considerations

### Optimization Checklist

✅ **Do:**

- Use debouncing for continuous inputs
- Check if value actually changed before pushing to history
- Clear history when loading new files
- Store only changed values, not entire objects
- Use provided helpers (they're optimized)

❌ **Don't:**

- Create history entries every animation frame
- Store large DataPoint arrays if only one property changed
- Make every UI state change undoable (tooltips, hovers, etc.)
- Create nested undoable actions (causes duplicates)

### Profiling

Monitor history size in development:

```svelte
{#if import.meta.env.DEV}
  <div class="debug">
    History: {$historyStore.past.length} past, {$historyStore.future.length} future
    {#if $historyStore.past.length > 50}
      <span class="warning">Consider clearing history!</span>
    {/if}
  </div>
{/if}
```

## Extension Points

### Adding New Undoable Actions

1. **Determine the store** (ConfigStore, UserStore, custom store)
2. **Choose the file** (config-actions.ts, user-actions.ts, or create new)
3. **Follow the pattern:**

```typescript
export function myNewAction(params) {
	const before = get(MyStore)

	// Validate
	if (invalid) return

	// Apply
	MyStore.update(...)

	// Record
	historyStore.push({
		actionType: 'my.action',
		actionLabel: 'Did something',
		undo: () => MyStore.update(...),
		redo: () => MyStore.update(...),
	})
}
```

4. **Export from index.ts:**

```typescript
export * from './my-actions'
```

5. **Add to documentation:**

- USAGE.md (API reference)
- INTEGRATION_EXAMPLES.md (usage example)

### Custom Store Integration

For a new store (e.g., `VideoStore`):

```typescript
// src/lib/history/video-actions.ts
import { get } from 'svelte/store'
import VideoStore from '../../stores/videoStore'
import { historyStore } from '../../stores/historyStore'

export function setPlaybackRate(rate: number): void {
  const before = get(VideoStore).playbackRate

  VideoStore.update((v) => ({ ...v, playbackRate: rate }))

  historyStore.push({
    actionType: 'video.playback',
    actionLabel: `Changed playback rate to ${rate}x`,
    undo: () => VideoStore.update((v) => ({ ...v, playbackRate: before })),
    redo: () => VideoStore.update((v) => ({ ...v, playbackRate: rate })),
  })
}
```

## Future Enhancements

Possible improvements:

1. **History Persistence** - Save history to localStorage
2. **History Limits** - Auto-trim old actions (keep last 100)
3. **Action Batching** - Group related actions
4. **History Branching** - Tree-based undo (like Git)
5. **Action Merging** - Combine similar sequential actions
6. **Undo Preview** - Show what will change before undoing
7. **Selective Undo** - Cherry-pick actions to undo
8. **History Export** - Save action log for debugging

## Debugging

Enable debug mode:

```svelte
<script lang="ts">
  import { historyStore } from '$lib/history'

  // Log every history change
  $effect(() => {
    console.log('History updated:', {
      past: $historyStore.past.map((a) => a.actionLabel),
      future: $historyStore.future.map((a) => a.actionLabel),
    })
  })
</script>
```

## Browser Compatibility

Keyboard shortcuts work on:

- macOS: Cmd+Z / Cmd+Shift+Z
- Windows/Linux: Ctrl+Z / Ctrl+Shift+Z

Detection based on `navigator.platform`.

## References

- Svelte Stores: https://svelte.dev/docs/svelte-store
- Command Pattern: https://refactoring.guru/design-patterns/command
- Memento Pattern: https://refactoring.guru/design-patterns/memento
