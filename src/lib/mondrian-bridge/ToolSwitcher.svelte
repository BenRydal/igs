<script lang="ts">
  import type { Tool } from './tool'

  let { tool, onchange }: { tool: Tool; onchange: (next: Tool) => void } = $props()

  const options: { id: Tool; label: string; hint: string }[] = [
    { id: 'igs', label: 'IGS', hint: 'Visualize movement and conversation' },
    { id: 'mondrian', label: 'Mondrian', hint: 'Transcribe or speculate movement' },
  ]
</script>

<div class="join" role="radiogroup" aria-label="Tool">
  {#each options as option (option.id)}
    <button
      type="button"
      role="radio"
      aria-checked={tool === option.id}
      title={option.hint}
      class="join-item btn btn-sm"
      class:btn-primary={tool === option.id}
      onclick={() => onchange(option.id)}
    >
      {option.label}
    </button>
  {/each}
</div>
