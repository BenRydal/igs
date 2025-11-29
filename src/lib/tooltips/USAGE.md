# RichTooltip Usage Guide

This guide demonstrates how to use the RichTooltip component system in the IGS application.

## Basic Import

```typescript
import { RichTooltip, getTooltip } from '$lib/tooltips'
```

## Simple Usage with Registry

The recommended approach is to use the tooltip registry for consistent messaging:

```svelte
<script>
  import { RichTooltip, getTooltip } from '$lib/tooltips'
  import IconButton from '$lib/components/IconButton.svelte'
  import MdPlay from '~icons/mdi/play'

  const playPauseTooltip = getTooltip('play-pause')
</script>

<RichTooltip
  title={playPauseTooltip.title}
  description={playPauseTooltip.description}
  shortcut={playPauseTooltip.shortcut}
>
  <IconButton icon={MdPlay} onclick={handlePlayPause} />
</RichTooltip>
```

## Direct Usage without Registry

For custom tooltips not in the registry:

```svelte
<RichTooltip
  title="Custom Control"
  description="This is a custom tooltip that isn't in the registry"
  shortcut="Ctrl+X"
  placement="bottom"
  delay={300}
>
  <button class="btn">Custom Button</button>
</RichTooltip>
```

## Complete Example: Play/Pause Button

```svelte
<script lang="ts">
  import { RichTooltip, getTooltip } from '$lib/tooltips'
  import MdPlay from '~icons/mdi/play'
  import MdPause from '~icons/mdi/pause'

  let isPlaying = $state(false)
  const tooltip = getTooltip('play-pause')

  function togglePlayPause() {
    isPlaying = !isPlaying
  }
</script>

<RichTooltip
  title={tooltip.title}
  description={tooltip.description}
  shortcut={tooltip.shortcut}
  placement="top"
>
  <button
    class="btn btn-circle btn-primary"
    onclick={togglePlayPause}
    aria-label={isPlaying ? 'Pause' : 'Play'}
  >
    {#if isPlaying}
      <MdPause />
    {:else}
      <MdPlay />
    {/if}
  </button>
</RichTooltip>
```

## Multiple Controls with Different Placements

```svelte
<script>
  import { RichTooltip, getTooltip } from '$lib/tooltips'
</script>

<div class="toolbar">
  <!-- Left side tooltip -->
  <RichTooltip {...getTooltip('upload-button')} placement="right">
    <button class="btn">Upload</button>
  </RichTooltip>

  <!-- Top tooltip -->
  <RichTooltip {...getTooltip('play-pause')} placement="top">
    <button class="btn">Play</button>
  </RichTooltip>

  <!-- Bottom tooltip -->
  <RichTooltip {...getTooltip('toggle-3d')} placement="bottom">
    <button class="btn">3D</button>
  </RichTooltip>
</div>
```

## Props Reference

| Prop          | Type        | Default  | Description                   |
| ------------- | ----------- | -------- | ----------------------------- |
| `title`       | `string`    | Required | Main title text               |
| `description` | `string`    | `''`     | Longer description (optional) |
| `shortcut`    | `string`    | `''`     | Keyboard shortcut (optional)  |
| `placement`   | `Placement` | `'top'`  | Where to show tooltip         |
| `delay`       | `number`    | `500`    | Delay in ms before showing    |
| `children`    | `Snippet`   | Required | Element to attach to          |

### Placement Options

- `'top'` - Above the element
- `'bottom'` - Below the element
- `'left'` - To the left
- `'right'` - To the right
- `'top-start'`, `'top-end'` - Top with left/right alignment
- `'bottom-start'`, `'bottom-end'` - Bottom with left/right alignment
- `'left-start'`, `'left-end'` - Left with top/bottom alignment
- `'right-start'`, `'right-end'` - Right with top/bottom alignment

## Accessibility Features

The RichTooltip component includes:

- ✅ **ARIA attributes**: Proper `role="tooltip"` and `aria-describedby`
- ✅ **Keyboard support**: Shows on focus, hides on blur
- ✅ **Screen reader friendly**: Tooltip content is announced
- ✅ **No pointer events**: Tooltip doesn't interfere with clicks
- ✅ **Immediate focus show**: Zero delay for keyboard users

## Registry Utilities

### Get a Single Tooltip

```typescript
import { getTooltip } from '$lib/tooltips'

const tooltip = getTooltip('play-pause')
// { title: 'Play/Pause', description: '...', shortcut: 'Space' }
```

### Check if Tooltip Exists

```typescript
import { hasTooltip } from '$lib/tooltips'

if (hasTooltip('my-control')) {
  // Use registered tooltip
} else {
  // Use fallback
}
```

### Get All IDs

```typescript
import { getAllTooltipIds } from '$lib/tooltips'

const ids = getAllTooltipIds()
// ['upload-button', 'play-pause', 'toggle-3d', ...]
```

### Get Tooltips by Prefix

```typescript
import { getTooltipsByPrefix } from '$lib/tooltips'

// Get all user-related tooltips
const userTooltips = getTooltipsByPrefix('user-')
// { 'user-enable': {...}, 'user-color': {...}, ... }
```

## Adding New Tooltips to Registry

Edit `/src/lib/tooltips/registry.ts`:

```typescript
export const tooltipRegistry: Record<string, TooltipContent> = {
  // ... existing tooltips ...

  'my-new-control': {
    title: 'My Control',
    description: "What this control does and why it's useful",
    shortcut: 'Cmd+N', // Optional
  },
}
```

## Best Practices

1. **Use the registry** - Keeps tooltip content centralized and consistent
2. **Keep titles short** - One to three words maximum
3. **Make descriptions helpful** - Explain "what" and "why"
4. **Include shortcuts when available** - Helps users learn keyboard controls
5. **Choose appropriate placement** - Avoid covering important UI
6. **Don't overuse** - Only add tooltips where they provide value
7. **Test with keyboard** - Ensure focus states work properly

## Keyboard Shortcut Formatting

Examples of properly formatted shortcuts:

- Single key: `'Space'`, `'D'`, `'1'`, `'?'`
- With modifier: `'Cmd+K'`, `'Ctrl+S'`, `'Alt+F4'`
- Multiple modifiers: `'Cmd+Shift+P'`, `'Ctrl+Alt+Delete'`

Use `Cmd` for Mac and `Ctrl` for Windows/Linux (the registry currently uses `Cmd` as the standard).

## Integration with Existing Components

### With IconButton

```svelte
<RichTooltip {...getTooltip('open-settings')}>
  <IconButton icon={MdSettings} onclick={openSettings} />
</RichTooltip>
```

### With FloatingDropdown

```svelte
<RichTooltip {...getTooltip('load-example')}>
  <FloatingDropdown id="examples" buttonText="Examples">
    <!-- dropdown content -->
  </FloatingDropdown>
</RichTooltip>
```

### With Custom Button

```svelte
<RichTooltip title="Export" description="Export visualization as PNG image" shortcut="Cmd+E">
  <button class="btn btn-primary" onclick={handleExport}>
    <MdDownload />
    Export
  </button>
</RichTooltip>
```
