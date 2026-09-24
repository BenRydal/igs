<script lang="ts">
  import type { AppMode } from './session'

  let { mode, onchange }: { mode: AppMode; onchange: (next: AppMode) => void } = $props()

  const options: { id: AppMode; label: string; hint: string }[] = [
    { id: 'igs', label: 'IGS', hint: 'Explore movement and conversation' },
    { id: 'mondrian', label: 'Mondrian', hint: 'Draw movement paths over the floorplan' },
  ]
</script>

<div id="mode-switcher" class="join" role="radiogroup" aria-label="Tool">
  {#each options as option (option.id)}
    <button
      type="button"
      role="radio"
      aria-checked={mode === option.id}
      title={option.hint}
      class="join-item btn btn-sm"
      class:btn-primary={mode === option.id}
      onclick={() => onchange(option.id)}
    >
      {option.label}
    </button>
  {/each}
</div>
