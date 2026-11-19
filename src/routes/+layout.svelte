<script lang="ts">
  import '../app.css'
  import { onMount } from 'svelte'
  import { attachActionKeys, type Action } from 'svelte-p5-components/actions'
  import { CommandPalette, ShortcutCheatsheet } from 'svelte-p5-components/actions/ui'
  import ToastContainer from '#lib/components/ToastContainer.svelte'
  import { registry, cheatsheetSections } from '#lib/app-actions/registry.ts'
  import { Z_INDEX } from '#lib/styles/z-index.ts'
  import { redrawCanvas } from '#lib/utils/p5.ts'
  import { setupModalListeners } from '../stores/modalStore'
  import { workspace } from '#lib/workspace/workspace.svelte.ts'

  function logActionError(error: unknown, action: Action) {
    console.error(`Error executing action "${action.id}":`, error)
  }

  let showCommandPalette = $state(false)

  onMount(() => {
    const detachKeys = attachActionKeys(registry, { onRun: redrawCanvas, onError: logActionError })
    const detachModals = setupModalListeners()
    return () => {
      detachKeys()
      detachModals()
    }
  })
</script>

<ToastContainer />
<div
  class="contents"
  style:--command-palette-z-index={Z_INDEX.COMMAND_PALETTE}
  style:--shortcut-cheatsheet-z-index={Z_INDEX.MODAL}
>
  <CommandPalette
    {registry}
    bind:open={showCommandPalette}
    recentKey="igs-recent-commands"
    onRun={redrawCanvas}
    onError={logActionError}
  />
  <ShortcutCheatsheet
    {registry}
    bind:open={workspace.cheatsheetOpen}
    sections={cheatsheetSections}
    title="Keyboard Shortcuts"
    closeLabel="Close keyboard shortcuts"
  >
    {#snippet footer()}
      Press <kbd>?</kbd> anytime to show this dialog
    {/snippet}
  </ShortcutCheatsheet>
</div>
<slot />
