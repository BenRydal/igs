<script lang="ts">
  import '../app.css'
  import { onMount } from 'svelte'
  import ToastContainer from '$lib/components/ToastContainer.svelte'
  import { CommandPalette } from '$lib/components/command-palette'
  import KeyboardCheatsheet from '$lib/components/KeyboardCheatsheet.svelte'
  import { registerAllShortcuts, attachKeyboardHandler } from '$lib/keyboard'
  import { registerUndoRedoShortcuts } from '$lib/history/keyboard'
  import { setupModalListeners } from '../stores/modalStore'

  // State for modals
  let showCheatsheet = $state(false)
  let showCommandPalette = $state(false)

  onMount(() => {
    // Register all keyboard shortcuts
    registerAllShortcuts()
    attachKeyboardHandler()

    // Register undo/redo shortcuts (Cmd+Z, Cmd+Shift+Z)
    registerUndoRedoShortcuts()

    // Set up modal listeners (escape key handling, etc.)
    const cleanupModalListeners = setupModalListeners()

    // Listen for custom events dispatched by shortcuts
    const handleCheatsheet = () => (showCheatsheet = true)

    window.addEventListener('igs:open-cheatsheet', handleCheatsheet)

    return () => {
      window.removeEventListener('igs:open-cheatsheet', handleCheatsheet)
      cleanupModalListeners()
    }
  })
</script>

<ToastContainer />
<CommandPalette bind:isOpen={showCommandPalette} />
<KeyboardCheatsheet isOpen={showCheatsheet} onClose={() => (showCheatsheet = false)} />
<slot />
