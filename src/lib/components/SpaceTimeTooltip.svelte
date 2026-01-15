<script lang="ts">
  const STORAGE_KEY = 'igs-spacetime-tooltip-seen'

  let show = $state(false)
  let dontShowAgain = $state(false)

  export function trigger() {
    if (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY)) {
      return
    }
    show = true
  }

  function dismiss() {
    show = false
    if (dontShowAgain && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'true')
    }
  }
</script>

{#if show}
  <div class="fixed top-20 right-4 z-50 max-w-sm bg-base-100 rounded-lg shadow-xl p-5 border border-base-300">
    <h3 class="font-semibold text-base mb-2">Understanding the 3D View</h3>
    <p class="text-base-content/70 text-sm leading-relaxed">
      In this space-time view, the Z-axis represents time while the X/Y axes correspond to the floor plan.
    </p>
    <p class="text-base-content/70 text-sm leading-relaxed mt-2">
      Stops appear as circles on the floor plan (larger circles = longer stops) and as thick lines in the space-time view.
    </p>
    <div class="mt-4 flex items-center justify-between">
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" class="checkbox checkbox-sm" bind:checked={dontShowAgain} />
        <span class="text-sm text-base-content/60">Don't show again</span>
      </label>
      <button class="btn btn-primary btn-sm" onclick={dismiss}>Got it</button>
    </div>
  </div>
{/if}
