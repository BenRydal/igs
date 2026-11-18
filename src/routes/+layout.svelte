<script lang="ts">
  import '../app.css'
  import { onMount } from 'svelte'
  import ToastContainer from '#lib/components/ToastContainer.svelte'
  import { CommandPalette } from '#lib/components/command-palette/index.ts'
  import KeyboardCheatsheet from '#lib/components/KeyboardCheatsheet.svelte'
  import { registerAllShortcuts, attachKeyboardHandler } from '#lib/keyboard/index.ts'
  import { registerUndoRedoShortcuts } from '#lib/history/keyboard.ts'
  import { setupModalListeners } from '../stores/modalStore'
  import { workspace } from '#lib/workspace/workspace.svelte.ts'

  // State for modals
  let showCommandPalette = $state(false)

  onMount(() => {
    // Register all keyboard shortcuts
    registerAllShortcuts()
    attachKeyboardHandler()

    // Register undo/redo shortcuts (Cmd+Z, Cmd+Shift+Z)
    registerUndoRedoShortcuts()

    // Set up modal listeners (escape key handling, etc.)
    return setupModalListeners()
  })
</script>

<ToastContainer />
<CommandPalette bind:isOpen={showCommandPalette} />
<KeyboardCheatsheet
  isOpen={workspace.cheatsheetOpen}
  onClose={() => (workspace.cheatsheetOpen = false)}
/>
<slot />
