<script lang="ts">
  import { appMode, type AppMode } from './session'

  const modes: { id: AppMode; label: string; hint: string }[] = [
    { id: 'igs', label: 'IGS', hint: 'Explore movement and conversation' },
    { id: 'mondrian', label: 'Mondrian', hint: 'Draw movement paths over the floorplan' },
  ]
</script>

<div id="mode-switcher" class="join" role="radiogroup" aria-label="Tool">
  {#each modes as mode (mode.id)}
    <button
      type="button"
      role="radio"
      aria-checked={$appMode === mode.id}
      title={mode.hint}
      class="join-item btn btn-sm"
      class:btn-primary={$appMode === mode.id}
      onclick={() => appMode.set(mode.id)}
    >
      {mode.label}
    </button>
  {/each}
</div>
