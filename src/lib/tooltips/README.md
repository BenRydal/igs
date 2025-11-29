# Rich Tooltip System

A comprehensive tooltip system for the IGS application built with Svelte 5, TypeScript, and FloatingUI.

## 📁 Files Created

```
/src/lib/tooltips/
├── index.ts                  # Barrel exports
├── registry.ts               # Tooltip content registry (30+ tooltips)
├── RichTooltipDemo.svelte   # Demo/reference component
├── USAGE.md                  # Detailed usage guide
└── README.md                 # This file

/src/lib/components/
└── RichTooltip.svelte        # Main tooltip component
```

## ✨ Features

### Core Features

- **Svelte 5 runes**: Uses `$state`, `$effect`, `$derived` for reactive state
- **FloatingUI positioning**: Smart placement with automatic flip and shift
- **Keyboard accessible**: ARIA attributes, focus support, immediate show on focus
- **Configurable delays**: Custom hover delay (default 500ms)
- **Arrow pointer**: Visual arrow points to trigger element
- **Z-index management**: Uses `Z_INDEX.TOOLTIP` for proper layering

### Visual Design

- Dark slate-800 background
- White text with slate-300 descriptions
- Rounded corners and subtle shadow
- Keyboard shortcut badges with `<kbd>` styling
- Max width 320px for readability

### Accessibility

- ✅ `role="tooltip"` for screen readers
- ✅ `aria-describedby` linking
- ✅ Focus/blur support (immediate show on focus)
- ✅ No pointer events (doesn't interfere with interactions)
- ✅ Keyboard navigation friendly

## 🎯 Component Props

```typescript
interface Props {
  title: string // Required: Main tooltip title
  description?: string // Optional: Longer description
  shortcut?: string // Optional: Keyboard shortcut (e.g., "Space")
  placement?: Placement // Optional: 'top' | 'bottom' | 'left' | 'right' | etc.
  delay?: number // Optional: Delay in ms (default: 500)
  children: Snippet // Required: Element to attach tooltip to
}
```

## 📚 Tooltip Registry

The registry (`registry.ts`) contains **30+ pre-defined tooltips** organized by category:

### Categories

- **File Management**: upload, clear operations, download
- **Playback Controls**: play/pause, timeline, animation speed
- **View Controls**: 2D/3D toggle, rotation, zoom, video
- **Display Toggles**: movement, conversation, visualization modes
- **Data Controls**: user/code visibility and colors
- **Modal Actions**: settings, help, data explorer
- **Examples**: example loading, word search

### Registry Utilities

```typescript
// Get tooltip by ID
const tooltip = getTooltip('play-pause')

// Check if exists
if (hasTooltip('my-control')) { ... }

// Get all IDs
const ids = getAllTooltipIds()

// Get by prefix
const userTooltips = getTooltipsByPrefix('user-')
```

## 🚀 Quick Start

### Basic Usage

```svelte
<script>
  import { RichTooltip, getTooltip } from '$lib/tooltips'
</script>

<RichTooltip {...getTooltip('play-pause')}>
  <button class="btn">Play</button>
</RichTooltip>
```

### Custom Tooltip

```svelte
<RichTooltip
  title="Export"
  description="Export visualization as PNG"
  shortcut="Cmd+E"
  placement="bottom"
>
  <button>Export</button>
</RichTooltip>
```

See **USAGE.md** for comprehensive examples.

## 🎨 Visual Examples

### Standard Tooltip

```
┌─────────────────────────────┐
│ Play/Pause          [Space] │
│ Start or pause the timeline │
│ animation playback          │
└─────────────────────────────┘
           ▼
      [Button]
```

### With Arrow

The arrow automatically positions itself to point at the trigger element and adjusts based on tooltip placement.

## 🔧 Technical Implementation

### Positioning System

- Uses `@floating-ui/dom` for smart positioning
- Middleware stack: `offset(8)` → `flip()` → `shift({ padding: 5 })` → `arrow()`
- Auto-updates on scroll/resize
- Respects viewport boundaries

### State Management

- Reactive state with Svelte 5 `$state` rune
- Effect-based event listener management
- Proper cleanup on component destroy
- Timeout handling for hover delays

### Performance

- Zero-delay for keyboard focus (accessibility)
- Configurable hover delay (default 500ms)
- Efficient event listeners (added/removed as needed)
- No re-renders when not visible

## 📖 Documentation

- **USAGE.md**: Complete usage guide with examples
- **RichTooltipDemo.svelte**: Live demo component showing all features
- Inline JSDoc comments throughout codebase

## 🎯 Design Decisions

1. **Centralized registry**: Keeps tooltip content consistent and maintainable
2. **Svelte 5 patterns**: Uses modern runes instead of legacy stores
3. **FloatingUI integration**: Reuses existing positioning infrastructure
4. **Accessibility first**: Keyboard and screen reader support built-in
5. **Flexible placement**: Supports all FloatingUI placement options
6. **Zero dependencies**: Only uses packages already in project

## 🔄 Integration Points

- **FloatingUI**: Reuses `@floating-ui/dom` (already installed)
- **Z-index system**: Uses `Z_INDEX.TOOLTIP` (value: 60)
- **Keyboard shortcuts**: Aligns with `src/lib/keyboard/` system
- **Component patterns**: Follows existing Svelte 5 component patterns

## 📊 Statistics

- **Lines of code**: ~774 total
  - RichTooltip.svelte: 326 lines
  - registry.ts: 273 lines
  - index.ts: 9 lines
  - Supporting docs: ~166 lines
- **Tooltip definitions**: 30+ pre-configured
- **Props**: 6 configurable options
- **Placement options**: 12 (top, bottom, left, right + variants)

## 🚦 Next Steps

### Recommended Integration

1. Import into existing components (TopNavbar, BottomNavPanel, etc.)
2. Replace basic HTML `title` attributes with RichTooltip
3. Add tooltips to IconButton components
4. Enhance FloatingDropdown triggers with tooltips

### Future Enhancements

- [ ] Add tooltip to existing IconButton component (optional prop)
- [ ] Integrate with keyboard shortcut system (auto-populate shortcuts)
- [ ] Add theme support (light/dark modes)
- [ ] Add animation transitions (fade in/out)
- [ ] Support for rich HTML content in descriptions

## 📝 Code Style

- Tabs (not spaces), tab width 2
- Single quotes
- Print width 150
- Strict TypeScript mode
- Follows project conventions

## 🤝 Contributing

When adding new tooltips:

1. Add to `registry.ts` with ID, title, description, shortcut (if applicable)
2. Use descriptive IDs with category prefixes (`user-`, `code-`, `play-`, etc.)
3. Keep titles short (1-3 words)
4. Make descriptions helpful (explain "what" and "why")
5. Format shortcuts consistently (`Cmd+K`, `Space`, `1`, etc.)

## 📄 License

Same as IGS project.
