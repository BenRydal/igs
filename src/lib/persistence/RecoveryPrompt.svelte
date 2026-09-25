<script lang="ts">
  import { Z_INDEX } from '$lib/styles/z-index'
  import { discardSavedSession, recoveryOffer, type RecoveryOffer } from './autosave'

  let { onRestore }: { onRestore: (offer: RecoveryOffer) => Promise<void> } = $props()

  let busy = $state(false)

  function describe(offer: RecoveryOffer): string {
    const { snapshot } = offer
    const parts: string[] = []
    const people = snapshot.users.length
    if (people > 0) parts.push(`${people} ${people === 1 ? 'person' : 'people'}`)
    if (snapshot.hasFloorplan) parts.push('floorplan')
    if (snapshot.video?.type === 'youtube' || offer.video) parts.push('video')
    return parts.join(', ')
  }

  function savedAgo(savedAt: number): string {
    const minutes = Math.round((Date.now() - savedAt) / 60000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes} min ago`
    const hours = Math.round(minutes / 60)
    if (hours < 48) return `${hours} h ago`
    return new Date(savedAt).toLocaleDateString()
  }

  async function restore(offer: RecoveryOffer) {
    busy = true
    try {
      await onRestore(offer)
    } finally {
      busy = false
    }
  }
</script>

{#if $recoveryOffer}
  {@const offer = $recoveryOffer}
  <div
    class="recovery-prompt"
    style:z-index={Z_INDEX.MODAL_NESTED}
    role="alertdialog"
    aria-labelledby="recovery-title"
  >
    <h2 id="recovery-title" class="text-sm font-semibold">Restore your last session?</h2>
    <p class="text-sm opacity-70">
      {describe(offer)} · saved {savedAgo(offer.snapshot.savedAt)}
    </p>
    {#if offer.snapshot.video?.type === 'file' && !offer.video}
      <p class="text-xs opacity-70">The video file wasn't saved; you'll need to load it again.</p>
    {/if}
    <div class="flex justify-end gap-2">
      <button class="btn btn-sm btn-ghost" disabled={busy} onclick={() => discardSavedSession()}>
        Start fresh
      </button>
      <button class="btn btn-sm btn-primary" disabled={busy} onclick={() => restore(offer)}>
        Restore
      </button>
    </div>
  </div>
{/if}

<style>
  .recovery-prompt {
    position: fixed;
    right: 1rem;
    bottom: 1rem;
    width: min(22rem, calc(100vw - 2rem));
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    border-radius: 0.5rem;
    background: var(--color-base-100);
    border: 1px solid var(--color-base-300);
    box-shadow: 0 8px 24px rgb(0 0 0 / 0.15);
  }
</style>
