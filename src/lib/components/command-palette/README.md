# Command Palette

A comprehensive command palette system for IGS with fuzzy search, keyboard navigation, and recent commands tracking.

## Features

- **Fuzzy Search**: Intelligent fuzzy matching across command labels, descriptions, keywords, and categories
- **Keyboard Navigation**: Full keyboard support with Cmd+K/Ctrl+K to open, arrow keys to navigate, Enter to select
- **Recent Commands**: Tracks your 5 most recently used commands with localStorage persistence
- **50+ Commands**: Complete coverage of all IGS actions organized by category
- **Active State Indicators**: Visual feedback for toggle commands (shows "active" badge)
- **Grouped Results**: Search results organized by category for easy scanning
- **Smooth Animations**: Polished UI with fade and slide transitions

## Usage

### Basic Integration

```svelte
<script>
  import { CommandPalette } from '$lib/components/command-palette'
  import { activeModal } from '$stores/modalStore'

  let isOpen = $state(false)

  $effect(() => {
    isOpen = $activeModal?.id === 'commandPalette'
  })
</script>

<CommandPalette bind:isOpen />
```

### Opening the Palette

The command palette can be opened in three ways:

1. **Keyboard shortcut**: Press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)
2. **Programmatically**: Set `isOpen = true` or use the modal store
3. **Custom event**: Dispatch an 'open-command-palette' event

```typescript
import { openModal } from '$stores/modalStore'

// Open via modal store
openModal('commandPalette')
```

## Command Categories

Commands are organized into 7 categories:

### Filter Commands

- Toggle Movement Trails
- Toggle Stop Points
- Toggle Conversation Alignment
- Toggle Path Color Mode

### Selection Commands

- Circle Selection Tool
- Slice Selection Tool
- Highlight Selection Tool
- Clear All Selections

### View Commands

- Rotate View Left/Right
- Toggle 2D/3D View
- Toggle Video Player

### Clear Commands

- Clear Movement Data
- Clear Conversation Data
- Clear Code Data
- Clear All Data

### Example Datasets (12 total)

- Sports: Michael Jordan's Last Shot
- Museums: Family Gallery Visit
- Classrooms: Sandy Lessons, AP Math, 3rd Grade
- TIMSS Video Studies: 6 international classroom examples

### Playback Commands

- Play/Pause Animation
- Increase/Decrease Speed
- Reset Timeline

### Settings Commands

- Open Settings
- Open Data Explorer
- Open Help

## Keyboard Shortcuts

| Key                 | Action                   |
| ------------------- | ------------------------ |
| `Cmd+K` / `Ctrl+K`  | Toggle command palette   |
| `↑` / `↓`           | Navigate commands        |
| `Enter`             | Execute selected command |
| `Tab` / `Shift+Tab` | Navigate commands        |
| `Esc`               | Close palette            |

## Architecture

### File Structure

```
command-palette/
├── types.ts              # TypeScript interfaces
├── fuzzy-search.ts       # Fuzzy matching algorithm
├── recent-commands.ts    # localStorage tracking
├── commands.ts           # Command registry (50+ commands)
├── CommandPalette.svelte # Main component
├── index.ts              # Barrel exports
└── README.md             # This file
```

### Fuzzy Search Algorithm

The fuzzy search scoring system:

- **Start of string match**: +15 points
- **Start of word match**: +10 points
- **Consecutive matches**: +5 bonus per consecutive character
- **Case matches**: +1 point
- **Length penalty**: -0.1 per character (prefers shorter matches)

### Recent Commands

Recent commands are stored in localStorage with:

- Maximum 5 entries
- Timestamp of last use
- Use count tracking
- Automatic sorting by recency

Storage key: `igs-recent-commands`

## Extending the System

### Adding New Commands

Add commands to `commands.ts`:

```typescript
{
  id: 'my-command',
  label: 'My New Command',
  description: 'What this command does',
  keywords: ['search', 'terms'],
  icon: '🎯',
  category: 'settings',
  shortcut: 'Cmd+Shift+X',
  action: () => {
    // Your action here
  },
  isActive: () => {
    // Optional: return true if command is currently active
    return get(someStore).someValue
  },
}
```

### Adding New Categories

Update the `category` type in `types.ts`:

```typescript
category: 'filter' |
  'selection' |
  'view' |
  'clear' |
  'examples' |
  'playback' |
  'settings' |
  'your-new-category'
```

And add the label in `commands.ts`:

```typescript
export function getCategoryLabel(category: Command['category']): string {
  const labels: Record<Command['category'], string> = {
    // ... existing categories
    'your-new-category': 'Your Category Label',
  }
  return labels[category] || category
}
```

## Styling

The component uses:

- **DaisyUI** classes for consistent theming
- **Tailwind CSS** for layout and utilities
- **Custom scrollbar** styling for the command list
- **Z-index**: Uses `Z_INDEX.COMMAND_PALETTE` (200) to ensure it appears above modals

## Accessibility

- **ARIA roles**: `dialog`, `combobox`, `listbox`, `option`
- **Keyboard navigation**: Full keyboard support
- **Focus management**: Auto-focus search input on open
- **Screen readers**: Proper ARIA labels and announcements
- **Focus trap**: Prevents focus from leaving the modal

## Performance

- **Lazy loading**: Commands are only computed when needed
- **Efficient search**: Fuzzy matching is optimized for real-time typing
- **Minimal re-renders**: Uses Svelte 5 runes for fine-grained reactivity
- **localStorage caching**: Recent commands persist across sessions

## Browser Support

- Modern browsers with ES2020+ support
- localStorage required for recent commands feature
- Graceful degradation if localStorage is unavailable
