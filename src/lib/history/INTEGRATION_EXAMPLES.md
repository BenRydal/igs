# Integration Examples

This document shows how to integrate the undo/redo system into existing IGS components.

## Example 1: Toggle Button Component

Replace direct store updates with undoable actions:

**Before:**

```svelte
<script lang="ts">
  import ConfigStore from '$stores/configStore'
</script>

<button onclick={() => ConfigStore.update((c) => ({ ...c, movementToggle: !c.movementToggle }))}>
  {$ConfigStore.movementToggle ? 'Hide' : 'Show'} Movement
</button>
```

**After:**

```svelte
<script lang="ts">
  import ConfigStore from '$stores/configStore'
  import { toggleMovement } from '$lib/history'
</script>

<button onclick={toggleMovement}>
  {$ConfigStore.movementToggle ? 'Hide' : 'Show'} Movement
</button>
```

## Example 2: Range Slider Component

Automatically debounce slider changes:

**Before:**

```svelte
<script lang="ts">
  import ConfigStore from '$stores/configStore'
</script>

<input
  type="range"
  min="0.01"
  max="0.2"
  step="0.01"
  value={$ConfigStore.animationRate}
  oninput={(e) => ConfigStore.update((c) => ({ ...c, animationRate: e.target.valueAsNumber }))}
/>
```

**After:**

```svelte
<script lang="ts">
  import ConfigStore from '$stores/configStore'
  import { setAnimationRate } from '$lib/history'
</script>

<input
  type="range"
  min="0.01"
  max="0.2"
  step="0.01"
  value={$ConfigStore.animationRate}
  oninput={(e) => setAnimationRate(e.target.valueAsNumber)}
/>
```

## Example 3: User List Component

Make user visibility toggles undoable:

**Before:**

```svelte
<script lang="ts">
  import UserStore from '$stores/userStore'
</script>

{#each $UserStore as user}
  <div>
    <input
      type="checkbox"
      checked={user.enabled}
      onchange={() => {
        UserStore.update((users) =>
          users.map((u) => (u.name === user.name ? { ...u, enabled: !u.enabled } : u))
        )
      }}
    />
    <span>{user.name}</span>
  </div>
{/each}
```

**After:**

```svelte
<script lang="ts">
  import UserStore from '$stores/userStore'
  import { toggleUserEnabled } from '$lib/history'
</script>

{#each $UserStore as user}
  <div>
    <input type="checkbox" checked={user.enabled} onchange={() => toggleUserEnabled(user.name)} />
    <span>{user.name}</span>
  </div>
{/each}
```

## Example 4: Color Picker Component

Make color changes undoable:

**Before:**

```svelte
<script lang="ts">
  import UserStore from '$stores/userStore'

  let selectedUser: string
  let selectedColor: string

  function handleColorChange() {
    UserStore.update((users) =>
      users.map((u) => (u.name === selectedUser ? { ...u, color: selectedColor } : u))
    )
  }
</script>

<input type="color" bind:value={selectedColor} onchange={handleColorChange} />
```

**After:**

```svelte
<script lang="ts">
  import { setUserColor } from '$lib/history'

  let selectedUser: string
  let selectedColor: string
</script>

<input
  type="color"
  bind:value={selectedColor}
  onchange={() => setUserColor(selectedUser, selectedColor)}
/>
```

## Example 5: Settings Panel with Undo/Redo UI

Create a settings panel with visible undo/redo controls:

```svelte
<script lang="ts">
  import ConfigStore from '$stores/configStore'
  import {
    historyStore,
    toggleMovement,
    toggleStops,
    setAnimationRate,
    resetConfig,
  } from '$lib/history'

  const canUndo = $derived($historyStore.past.length > 0)
  const canRedo = $derived($historyStore.future.length > 0)
  const lastAction = $derived(
    canUndo ? $historyStore.past[$historyStore.past.length - 1].actionLabel : ''
  )
  const nextAction = $derived(canRedo ? $historyStore.future[0].actionLabel : '')
</script>

<div class="settings-panel">
  <!-- Undo/Redo Controls -->
  <div class="history-controls">
    <button onclick={() => historyStore.undo()} disabled={!canUndo} title={lastAction}>
      ⟲ Undo {lastAction ? `(${lastAction})` : ''}
    </button>
    <button onclick={() => historyStore.redo()} disabled={!canRedo} title={nextAction}>
      ⟳ Redo {nextAction ? `(${nextAction})` : ''}
    </button>
  </div>

  <!-- Settings -->
  <div class="settings">
    <label>
      <input type="checkbox" checked={$ConfigStore.movementToggle} onchange={toggleMovement} />
      Show Movement Trails
    </label>

    <label>
      <input type="checkbox" checked={$ConfigStore.stopsToggle} onchange={toggleStops} />
      Show Stop Points
    </label>

    <label>
      Animation Speed: {$ConfigStore.animationRate.toFixed(2)}
      <input
        type="range"
        min="0.01"
        max="0.2"
        step="0.01"
        value={$ConfigStore.animationRate}
        oninput={(e) => setAnimationRate(e.target.valueAsNumber)}
      />
    </label>

    <button onclick={resetConfig}>Reset All Settings</button>
  </div>

  <!-- History Debug Info -->
  {#if import.meta.env.DEV}
    <div class="debug">
      <p>History: {$historyStore.past.length} past, {$historyStore.future.length} future</p>
    </div>
  {/if}
</div>

<style>
  .settings-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }

  .history-controls {
    display: flex;
    gap: 0.5rem;
  }

  .history-controls button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .settings {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .debug {
    font-size: 0.8rem;
    opacity: 0.6;
  }
</style>
```

## Example 6: Root Layout Integration

Add keyboard shortcuts in your root layout:

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { registerHistoryKeyboard } from '$lib/history'
  import { onMount } from 'svelte'

  onMount(() => {
    // Register Cmd+Z / Ctrl+Z keyboard shortcuts
    const cleanup = registerHistoryKeyboard()

    // Cleanup on unmount
    return cleanup
  })
</script>

<slot />
```

## Example 7: Clear Data Modal with Undo

Create a confirmation modal for clearing data with undo support:

```svelte
<script lang="ts">
  import { clearAllData, clearUsers, clearCodes } from '$lib/history'

  let showModal = false

  function handleClearAll() {
    clearAllData()
    showModal = false
    // User can still undo with Cmd+Z!
  }
</script>

<button onclick={() => (showModal = true)}>Clear Data</button>

{#if showModal}
  <div class="modal">
    <div class="modal-content">
      <h2>Clear Data</h2>
      <p>This action can be undone with Cmd+Z</p>

      <div class="actions">
        <button
          onclick={() => {
            clearUsers()
            showModal = false
          }}
        >
          Clear Movement Data Only
        </button>
        <button
          onclick={() => {
            clearCodes()
            showModal = false
          }}
        >
          Clear Codes Only
        </button>
        <button onclick={handleClearAll}> Clear All Data </button>
        <button onclick={() => (showModal = false)}> Cancel </button>
      </div>
    </div>
  </div>
{/if}
```

## Example 8: Batch Operations

Make multiple related changes as a single undoable action:

```svelte
<script lang="ts">
  import { undoable } from '$lib/history'
  import UserStore from '$stores/userStore'
  import { get } from 'svelte/store'

  function randomizeAllColors() {
    const before = get(UserStore)

    undoable(
      'user.batch',
      'Randomized all colors',
      () => {
        UserStore.update((users) =>
          users.map((u) => ({
            ...u,
            color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
          }))
        )
      },
      () => UserStore.set(before)
    )
  }
</script>

<button onclick={randomizeAllColors}>Randomize All Colors</button>
```

## Example 9: Conditional Undo

Only make changes undoable if they actually changed something:

```svelte
<script lang="ts">
  import { setUserColor } from '$lib/history'
  import UserStore from '$stores/userStore'

  function handleColorPick(userId: string, newColor: string) {
    const user = $UserStore.find((u) => u.name === userId)
    if (!user) return

    // setUserColor already checks if color changed
    // It won't create a history entry if color is the same
    setUserColor(userId, newColor)
  }
</script>
```

## Example 10: History Viewer Component

Create a component to show the full history:

```svelte
<script lang="ts">
  import { historyStore } from '$lib/history'

  function jumpToAction(index: number) {
    const current = $historyStore.past.length
    const diff = index - current

    if (diff > 0) {
      // Redo multiple times
      for (let i = 0; i < diff; i++) {
        historyStore.redo()
      }
    } else if (diff < 0) {
      // Undo multiple times
      for (let i = 0; i < Math.abs(diff); i++) {
        historyStore.undo()
      }
    }
  }
</script>

<div class="history-viewer">
  <h3>Action History</h3>

  <ul>
    {#each $historyStore.past as action, i}
      <li class="past" onclick={() => jumpToAction(i + 1)}>
        {i + 1}. {action.actionLabel} ({action.actionType})
      </li>
    {/each}

    {#if $historyStore.past.length > 0}
      <li class="current">← Current State</li>
    {/if}

    {#each $historyStore.future as action, i}
      <li class="future" onclick={() => jumpToAction($historyStore.past.length + i + 1)}>
        {action.actionLabel} ({action.actionType})
      </li>
    {/each}
  </ul>

  <button onclick={() => historyStore.clear()}>Clear History</button>
</div>

<style>
  .history-viewer {
    max-height: 400px;
    overflow-y: auto;
    border: 1px solid #ccc;
    padding: 1rem;
  }

  ul {
    list-style: none;
    padding: 0;
  }

  li {
    padding: 0.25rem 0.5rem;
    cursor: pointer;
  }

  li:hover {
    background: #f0f0f0;
  }

  .past {
    color: #666;
  }

  .current {
    font-weight: bold;
    color: #0066cc;
    cursor: default;
  }

  .future {
    color: #999;
    font-style: italic;
  }
</style>
```

## Migration Checklist

When converting existing components to use the undo system:

1. ✅ Import the appropriate action helper from `$lib/history`
2. ✅ Replace direct store updates with helper calls
3. ✅ For sliders, use the numeric helpers (they debounce automatically)
4. ✅ For batch operations, use `undoable()` wrapper
5. ✅ Test undo/redo works correctly
6. ✅ Consider adding undo/redo UI buttons where appropriate
7. ✅ Register keyboard shortcuts in root layout if not already done

## Performance Considerations

### Good Practices

- ✅ Use provided helpers (they're optimized)
- ✅ Debounce rapid changes (sliders, text inputs)
- ✅ Check if value actually changed before creating history entry
- ✅ Clear history when loading new files to free memory

### Avoid

- ❌ Creating history entries for every animation frame
- ❌ Storing entire large objects when only small parts changed
- ❌ Making every trivial UI state change undoable (e.g., hover states)
- ❌ Nested undoable actions (causes duplicate history entries)

## Testing Your Integration

```typescript
import { expect, test } from 'vitest'
import { get } from 'svelte/store'
import { toggleMovement, historyStore } from '$lib/history'
import ConfigStore from '$stores/configStore'

test('toggleMovement is undoable', () => {
  const initial = get(ConfigStore).movementToggle

  // Perform action
  toggleMovement()
  expect(get(ConfigStore).movementToggle).toBe(!initial)
  expect(get(historyStore).past.length).toBe(1)

  // Undo
  historyStore.undo()
  expect(get(ConfigStore).movementToggle).toBe(initial)
  expect(get(historyStore).past.length).toBe(0)

  // Redo
  historyStore.redo()
  expect(get(ConfigStore).movementToggle).toBe(!initial)
  expect(get(historyStore).future.length).toBe(0)
})
```
