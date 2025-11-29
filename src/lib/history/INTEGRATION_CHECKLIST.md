# Integration Checklist

Use this checklist to integrate the undo/redo system into your IGS application.

## Setup (One-time)

- [x] History store created at `src/stores/historyStore.ts`
- [x] Action helpers created in `src/lib/history/`
- [ ] Register keyboard shortcuts in root layout (`src/routes/+layout.svelte`)

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

<slot />
```

## Component Migration

For each component that updates stores:

- [ ] Import action helpers from `$lib/history`
- [ ] Replace direct store updates with helper calls
- [ ] Test undo/redo works correctly
- [ ] Optionally add undo/redo UI buttons

### Example Migration

**Before:**

```svelte
<script lang="ts">
  import ConfigStore from '$stores/configStore'
</script>

<button onclick={() => ConfigStore.update((c) => ({ ...c, movementToggle: !c.movementToggle }))}>
  Toggle Movement
</button>
```

**After:**

```svelte
<script lang="ts">
  import { toggleMovement } from '$lib/history'
</script>

<button onclick={toggleMovement}> Toggle Movement </button>
```

## Component Checklist

### Settings/Config Components

- [ ] Replace config toggle buttons with `toggleMovement()`, `toggleStops()`, etc.
- [ ] Replace sliders with `setAnimationRate()`, `setSamplingInterval()`, etc.
- [ ] Replace text inputs with `setWordToSearch()`, etc.
- [ ] Replace reset buttons with `resetConfig()`

### User Management Components

- [ ] Replace user visibility toggles with `toggleUserEnabled(userId)`
- [ ] Replace user conversation toggles with `toggleUserConversationEnabled(userId)`
- [ ] Replace color pickers with `setUserColor(userId, color)`
- [ ] Replace show/hide all with `toggleAllUsers(enabled)`

### Data Management Components

- [ ] Replace clear data buttons with `clearUsers()`, `clearCodes()`, `clearAllData()`

## UI Components (Optional)

Consider adding these UI elements:

### Undo/Redo Buttons

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
```

### History Counter

```svelte
<div>
  {$historyStore.past.length} action{$historyStore.past.length !== 1 ? 's' : ''} in history
</div>
```

### Last Action Label

```svelte
{#if $historyStore.past.length > 0}
  <small>Last: {$historyStore.past[$historyStore.past.length - 1].actionLabel}</small>
{/if}
```

### Keyboard Shortcut Hint

```svelte
<div class="hint">
  <strong>Tip:</strong> Use Cmd+Z (Mac) or Ctrl+Z (Windows) to undo
</div>
```

## Testing Checklist

- [ ] Test basic undo/redo with keyboard shortcuts
- [ ] Test undo/redo with UI buttons (if added)
- [ ] Test slider debouncing (drag slider, undo once to revert entire drag)
- [ ] Test that new actions clear future (can't redo after new action)
- [ ] Test reset config can be undone
- [ ] Test clearing data can be undone
- [ ] Test user color changes can be undone
- [ ] Test multiple undo/redo in sequence
- [ ] Test undo/redo with multiple users

## Documentation Review

- [ ] Read [README.md](./README.md) - Quick start guide
- [ ] Read [USAGE.md](./USAGE.md) - Complete API reference
- [ ] Read [INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md) - Real-world examples
- [ ] Read [EXAMPLE_COMPONENT.md](./EXAMPLE_COMPONENT.md) - Full component example
- [ ] Read [OVERVIEW.md](./OVERVIEW.md) - Technical architecture

## Component Coverage

Track which components have been migrated:

### Settings Components

- [ ] `src/lib/components/SettingsModal.svelte`
- [ ] `src/lib/components/TopNavbar.svelte`
- [ ] `src/lib/components/BottomNav.svelte`
- [ ] `src/lib/components/TimelinePanel.svelte`

### User Components

- [ ] User list/table components
- [ ] User color picker components

### Data Components

- [ ] File upload/clear components
- [ ] Data management modal

### Other Components

- [ ] _(Add your custom components here)_

## Known Limitations

Be aware of these limitations when integrating:

1. **File loads clear history** - Loading new data should call `historyStore.clear()`
2. **No nested undo** - Don't call undoable actions from within other undoable actions
3. **Large data sets** - Be careful with large UserStore arrays (store minimal state)
4. **Animation state** - Don't make every animation frame undoable
5. **Temporary UI state** - Don't undo hover states, tooltips, etc.

## Performance Monitoring

Add this to monitor history size in development:

```svelte
{#if import.meta.env.DEV}
  <div class="debug-history">
    <small>
      History: {$historyStore.past.length} past, {$historyStore.future.length} future
      {#if $historyStore.past.length > 100}
        <span class="warning">⚠ Consider clearing history</span>
      {/if}
    </small>
  </div>
{/if}
```

## Troubleshooting

Common issues and solutions:

### Undo doesn't work

- [ ] Check keyboard shortcuts are registered in layout
- [ ] Check action helper is being called (not direct store update)
- [ ] Check browser console for errors

### Multiple undo needed for single slider drag

- [ ] Check you're using `setConfigNumber()` not `toggleConfig()`
- [ ] Check debounce parameter (default 300ms)

### Memory issues

- [ ] Check you're storing minimal state (not entire arrays)
- [ ] Clear history when loading new files
- [ ] Check for memory leaks in undo/redo closures

### TypeScript errors

- [ ] Check you're using correct helper for data type
- [ ] Check store key exists in ConfigStoreType
- [ ] Update TypeScript version if needed

## Support

For issues or questions:

1. Check the documentation files
2. Review the example component
3. Check the integration examples
4. Review the technical overview

## Next Steps

After integration:

1. [ ] Test thoroughly with real usage
2. [ ] Get user feedback on undo/redo behavior
3. [ ] Consider adding history viewer component
4. [ ] Consider adding history persistence (localStorage)
5. [ ] Consider adding undo preview (show what will change)

## Validation

Validate your integration:

```bash
# Run type checking
yarn check

# Run build
yarn build

# Run dev server and test manually
yarn dev
```

Expected behavior:

- ✓ No TypeScript errors
- ✓ Build succeeds
- ✓ Cmd+Z undoes last action
- ✓ Cmd+Shift+Z redoes last undone action
- ✓ Slider drag creates single history entry
- ✓ New action clears redo stack
