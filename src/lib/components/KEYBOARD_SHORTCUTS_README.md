# Keyboard Shortcuts Components

This directory contains components for displaying and managing keyboard shortcuts in the IGS application.

## Components

### KeyboardCheatsheet.svelte

Main modal component that displays all registered keyboard shortcuts grouped by category.

**Features:**

- Opens on `?` key press
- Displays shortcuts from keyboard registry
- Groups by category (Playback, View, Selection, etc.)
- Platform-aware key formatting (Mac vs Windows)
- Full accessibility support

**Quick Start:**

```svelte
<KeyboardCheatsheet
  isOpen={currentModal?.id === 'shortcuts'}
  onClose={() => closeModal('shortcuts')}
/>
```

See `KeyboardCheatsheet.example.md` for detailed usage.

### KeyboardCheatsheetDemo.svelte

Interactive demo component with example shortcuts for testing and development.

**Usage:**

```svelte
<script>
  import KeyboardCheatsheetDemo from '$lib/components/KeyboardCheatsheetDemo.svelte'
</script>

<KeyboardCheatsheetDemo />
```

Create a test route at `/test/keyboard` to view the demo.

## Documentation

- **`KeyboardCheatsheet.example.md`** - Component usage examples
- **`KEYBOARD_CHEATSHEET_INTEGRATION.md`** - Complete integration guide

## Related Systems

- **Keyboard Registry**: `/src/lib/keyboard/registry.ts`
- **Modal Store**: `/src/stores/modalStore.ts`
- **Z-Index System**: `/src/lib/styles/z-index.ts`

## Integration

See `KEYBOARD_CHEATSHEET_INTEGRATION.md` for step-by-step integration instructions.

## Testing

1. **Manual**: Press `?` to open the cheatsheet
2. **Demo Component**: Create test route with `KeyboardCheatsheetDemo.svelte`
3. **TypeScript**: Run `yarn check` to verify compilation

## Summary

See `.claude/KEYBOARD_CHEATSHEET_SUMMARY.md` for complete implementation details.
