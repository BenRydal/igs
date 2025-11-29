# Menu Item Components Usage Guide

This guide explains how to use the reusable ToggleMenuItem and RadioMenuItem components in the IGS application.

## ToggleMenuItem

A reusable component for checkbox-style menu items with optional visual styles.

### Location

`/Users/edwin/git/phd/igs/src/lib/components/ToggleMenuItem.svelte`

### Props Interface

```typescript
interface Props {
  label: string // Display text for the menu item
  checked: boolean // Current checked state
  onChange: (checked: boolean) => void // Callback when state changes
  disabled?: boolean // Disable the menu item (default: false)
  showCheckIcon?: boolean // Show checkmark icon when checked (default: true)
  showCheckbox?: boolean // Show DaisyUI checkbox instead of icon (default: false)
  class?: string // Additional CSS classes
}
```

### Usage Examples

#### Icon Style (Checkmark appears when checked)

```svelte
<script>
  import ToggleMenuItem from '$lib/components/ToggleMenuItem.svelte'
  import ConfigStore from '../../stores/configStore'

  const FILTER_TOGGLES = ['movementToggle', 'conversationToggle', 'videoToggle']

  function toggleSelection(toggle, options) {
    ConfigStore.update((store) => ({ ...store, [toggle]: !store[toggle] }))
  }
</script>

<ul class="menu dropdown-content rounded-box z-[1] w-52 p-2 shadow bg-base-100">
  {#each FILTER_TOGGLES as toggle}
    <ToggleMenuItem
      label={capitalizeFirstLetter(toggle.replace('Toggle', ''))}
      checked={$ConfigStore[toggle]}
      onChange={() => toggleSelection(toggle, FILTER_TOGGLES)}
    />
  {/each}
</ul>
```

#### Checkbox Style (Actual DaisyUI checkbox)

```svelte
<ToggleMenuItem
  label="Enable All Features"
  checked={allEnabled}
  showCheckbox={true}
  onChange={toggleSelectAllCodes}
/>
```

#### With Custom Styling

```svelte
<ToggleMenuItem
  label="Advanced Mode"
  checked={advancedMode}
  onChange={(newValue) => (advancedMode = newValue)}
  class="font-bold text-primary"
/>
```

#### Disabled State

```svelte
<ToggleMenuItem
  label="Premium Feature"
  checked={premiumEnabled}
  disabled={!hasPremium}
  onChange={handlePremiumToggle}
/>
```

## RadioMenuItem

A reusable component for mutually exclusive menu selections (radio button style).

### Location

`/Users/edwin/git/phd/igs/src/lib/components/RadioMenuItem.svelte`

### Props Interface

```typescript
interface Props {
  label: string // Display text for the menu item
  selected: boolean // Whether this option is currently selected
  onSelect: () => void // Callback when this option is selected
  disabled?: boolean // Disable the menu item (default: false)
  class?: string // Additional CSS classes
}
```

### Usage Examples

#### Basic Radio Group

```svelte
<script>
  import RadioMenuItem from '$lib/components/RadioMenuItem.svelte'

  let viewMode = $state<'2D' | '3D' | 'mixed'>('2D')

  const modes = [
    { value: '2D', label: '2D View' },
    { value: '3D', label: '3D View' },
    { value: 'mixed', label: 'Mixed View' },
  ]
</script>

<ul class="menu dropdown-content rounded-box z-[1] w-52 p-2 shadow bg-base-100">
  {#each modes as mode}
    <RadioMenuItem
      label={mode.label}
      selected={viewMode === mode.value}
      onSelect={() => (viewMode = mode.value)}
    />
  {/each}
</ul>
```

#### With Disabled Options

```svelte
<RadioMenuItem
  label="Expert Mode"
  selected={difficulty === 'expert'}
  disabled={!isExpertUnlocked}
  onSelect={() => (difficulty = 'expert')}
/>
```

## Features

### Accessibility

Both components include:

- Proper ARIA roles (`menuitemcheckbox` / `menuitemradio`)
- `aria-checked` attributes for screen readers
- Keyboard navigation support (Enter and Space keys)
- Focus indicators with visible outlines
- Tab navigation support
- Disabled state properly communicated

### Visual States

- **Hover**: Light background highlight (rgba(0, 0, 0, 0.05))
- **Focus**: Blue outline (2px solid #3b82f6)
- **Active**: Darker background when clicked (rgba(0, 0, 0, 0.1))
- **Disabled**: 50% opacity with not-allowed cursor

### Icons Used

- **ToggleMenuItem**: `~icons/mdi/check` (MdCheck)
- **RadioMenuItem**: `~icons/mdi/circle` and `~icons/mdi/circle-outline`

## Replacing Existing Pattern

### Before (in +page.svelte)

```svelte
{#each filterToggleOptions as toggle}
  <li>
    <button
      onclick={() => toggleSelection(toggle, filterToggleOptions)}
      class="w-full text-left flex items-center"
    >
      <div class="w-4 h-4 mr-2">
        {#if $ConfigStore[toggle]}
          <MdCheck />
        {/if}
      </div>
      {capitalizeFirstLetter(toggle.replace('Toggle', ''))}
    </button>
  </li>
{/each}
```

### After (using ToggleMenuItem)

```svelte
{#each filterToggleOptions as toggle}
  <ToggleMenuItem
    label={capitalizeFirstLetter(toggle.replace('Toggle', ''))}
    checked={$ConfigStore[toggle]}
    onChange={() => toggleSelection(toggle, filterToggleOptions)}
  />
{/each}
```

## Benefits

- Consistent behavior across all menus
- Built-in accessibility
- Keyboard navigation support
- Reusable across the application
- Type-safe with TypeScript
- Follows Svelte 5 patterns ($state, $bindable, $props)
- DaisyUI compatible styling
