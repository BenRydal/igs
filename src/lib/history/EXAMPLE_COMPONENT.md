# Example: Complete Undo/Redo Component

This is a complete working example showing how to integrate the undo/redo system into a Svelte component.

## Example Component: Settings Panel with Undo/Redo

```svelte
<!-- src/lib/components/SettingsWithUndo.svelte -->
<script lang="ts">
  import ConfigStore from '$stores/configStore'
  import UserStore from '$stores/userStore'
  import {
    historyStore,
    toggleMovement,
    toggleStops,
    toggleCircle,
    setAnimationRate,
    setSamplingInterval,
    setStopSliderValue,
    toggleUserEnabled,
    setUserColor,
    resetConfig,
  } from '$lib/history'

  // Reactive values for undo/redo state
  const canUndo = $derived($historyStore.past.length > 0)
  const canRedo = $derived($historyStore.future.length > 0)
  const lastAction = $derived(
    canUndo ? $historyStore.past[$historyStore.past.length - 1].actionLabel : ''
  )
  const nextAction = $derived(canRedo ? $historyStore.future[0].actionLabel : '')
</script>

<div class="settings-panel">
  <!-- Undo/Redo Controls -->
  <section class="history-controls">
    <h3>History</h3>
    <div class="button-group">
      <button
        class="btn btn-sm"
        onclick={() => historyStore.undo()}
        disabled={!canUndo}
        title={lastAction}
      >
        ⟲ Undo
        {#if lastAction}
          <span class="action-label">({lastAction})</span>
        {/if}
      </button>
      <button
        class="btn btn-sm"
        onclick={() => historyStore.redo()}
        disabled={!canRedo}
        title={nextAction}
      >
        ⟳ Redo
        {#if nextAction}
          <span class="action-label">({nextAction})</span>
        {/if}
      </button>
    </div>
    <div class="history-info">
      <small>
        {$historyStore.past.length} action{$historyStore.past.length !== 1 ? 's' : ''} in history
      </small>
    </div>
  </section>

  <!-- Visualization Settings -->
  <section class="viz-settings">
    <h3>Visualization</h3>

    <label class="toggle-label">
      <input type="checkbox" checked={$ConfigStore.movementToggle} onchange={toggleMovement} />
      <span>Show Movement Trails</span>
    </label>

    <label class="toggle-label">
      <input type="checkbox" checked={$ConfigStore.stopsToggle} onchange={toggleStops} />
      <span>Show Stop Points</span>
    </label>

    <label class="toggle-label">
      <input type="checkbox" checked={$ConfigStore.circleToggle} onchange={toggleCircle} />
      <span>Circle Selection Mode</span>
    </label>

    <label class="slider-label">
      <span>Animation Speed: {$ConfigStore.animationRate.toFixed(3)}</span>
      <input
        type="range"
        min="0.01"
        max="0.2"
        step="0.01"
        value={$ConfigStore.animationRate}
        oninput={(e) => setAnimationRate(e.target.valueAsNumber)}
      />
    </label>

    <label class="slider-label">
      <span>Sampling Interval: {$ConfigStore.samplingInterval}</span>
      <input
        type="range"
        min="0.1"
        max="2"
        step="0.1"
        value={$ConfigStore.samplingInterval}
        oninput={(e) => setSamplingInterval(e.target.valueAsNumber)}
      />
    </label>

    <label class="slider-label">
      <span>Stop Threshold: {$ConfigStore.stopSliderValue}</span>
      <input
        type="range"
        min="0.1"
        max="5"
        step="0.1"
        value={$ConfigStore.stopSliderValue}
        oninput={(e) => setStopSliderValue(e.target.valueAsNumber)}
      />
    </label>
  </section>

  <!-- User Settings -->
  <section class="user-settings">
    <h3>Users</h3>
    {#each $UserStore as user}
      <div class="user-row">
        <label class="user-toggle">
          <input
            type="checkbox"
            checked={user.enabled}
            onchange={() => toggleUserEnabled(user.name)}
          />
          <span>{user.name}</span>
        </label>
        <input
          type="color"
          value={user.color}
          onchange={(e) => setUserColor(user.name, e.target.value)}
          title="Change {user.name}'s color"
        />
      </div>
    {/each}
  </section>

  <!-- Reset Section -->
  <section class="reset-section">
    <button class="btn btn-warning" onclick={resetConfig}>Reset All Settings</button>
    <small>You can undo this with Cmd+Z</small>
  </section>

  <!-- Keyboard Hint -->
  <section class="keyboard-hint">
    <small>
      <strong>Keyboard Shortcuts:</strong>
      <br />
      Cmd+Z (Mac) / Ctrl+Z (Win) = Undo
      <br />
      Cmd+Shift+Z / Ctrl+Shift+Z = Redo
    </small>
  </section>
</div>

<style>
  .settings-panel {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1rem;
    max-width: 600px;
  }

  section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: #fafafa;
  }

  h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #333;
  }

  .history-controls {
    background: #f0f7ff;
    border-color: #b3d9ff;
  }

  .button-group {
    display: flex;
    gap: 0.5rem;
  }

  .btn {
    padding: 0.5rem 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: white;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .btn:hover:not(:disabled) {
    background: #f5f5f5;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-warning {
    background: #fff3cd;
    border-color: #ffc107;
    color: #856404;
  }

  .btn-warning:hover:not(:disabled) {
    background: #ffe69c;
  }

  .action-label {
    color: #666;
    font-size: 0.85rem;
    font-style: italic;
  }

  .history-info {
    color: #666;
    font-size: 0.85rem;
  }

  .toggle-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  .toggle-label input[type='checkbox'] {
    cursor: pointer;
  }

  .slider-label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .slider-label span {
    font-size: 0.9rem;
    color: #555;
  }

  .slider-label input[type='range'] {
    width: 100%;
  }

  .user-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem;
    background: white;
    border-radius: 4px;
  }

  .user-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  input[type='color'] {
    width: 40px;
    height: 40px;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
  }

  .reset-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    background: #fff3cd;
    border-color: #ffc107;
  }

  .keyboard-hint {
    background: #e8f5e9;
    border-color: #81c784;
  }

  .keyboard-hint small {
    color: #2e7d32;
    line-height: 1.5;
  }
</style>
```

## Usage in Your App

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
  import SettingsWithUndo from '$lib/components/SettingsWithUndo.svelte'
</script>

<div class="app">
  <h1>IGS Settings</h1>
  <SettingsWithUndo />
</div>
```

## Features Demonstrated

1. **Undo/Redo Buttons** with disabled states and action labels
2. **Toggle Checkboxes** for boolean config values
3. **Range Sliders** with debounced history (smooth dragging, single undo)
4. **User Management** with visibility toggles and color pickers
5. **Reset Button** with undo support
6. **Visual Feedback** showing current history state
7. **Keyboard Shortcuts** with hint panel

## Try It Out

1. Toggle movement trails on
2. Adjust the animation speed slider
3. Change a user's color
4. Press Cmd+Z to undo the color change
5. Press Cmd+Z again to undo the slider change
6. Press Cmd+Z again to undo the toggle
7. Press Cmd+Shift+Z to redo each action

## Customization

You can customize this component by:

- Adding more config options
- Showing full history timeline
- Adding action categories/filters
- Implementing "jump to" history point
- Adding confirmation dialogs for destructive actions
- Styling to match your theme (DaisyUI, Tailwind, etc.)

## Advanced: History Viewer

Add this to show the full history timeline:

```svelte
{#if import.meta.env.DEV}
  <section class="history-debug">
    <h3>History Timeline (Dev Only)</h3>
    <ul>
      {#each $historyStore.past as action, i}
        <li class="past-action">
          {i + 1}. {action.actionLabel}
          <span class="action-type">({action.actionType})</span>
        </li>
      {/each}
      {#if $historyStore.past.length > 0}
        <li class="current-marker">← You are here</li>
      {/if}
      {#each $historyStore.future as action}
        <li class="future-action">
          {action.actionLabel}
          <span class="action-type">({action.actionType})</span>
        </li>
      {/each}
    </ul>
  </section>
{/if}
```
