<script lang="ts">
  import type { Component } from 'svelte'
  import IconIgs from '~icons/mdi/cube-outline'
  import IconMondrian from '~icons/mdi/draw'
  import type { Tool } from './tool'

  let { tool, onchange }: { tool: Tool; onchange: (next: Tool) => void } = $props()

  const options: { id: Tool; label: string; hint: string; icon: Component }[] = [
    { id: 'igs', label: 'IGS', hint: 'Visualize movement and conversation', icon: IconIgs },
    {
      id: 'mondrian',
      label: 'Mondrian',
      hint: 'Transcribe or speculate movement',
      icon: IconMondrian,
    },
  ]
</script>

<div class="join" role="radiogroup" aria-label="Tool">
  {#each options as option (option.id)}
    <button
      type="button"
      role="radio"
      aria-checked={tool === option.id}
      title={option.hint}
      class="join-item btn btn-sm max-sm:btn-square"
      class:btn-primary={tool === option.id}
      onclick={() => onchange(option.id)}
    >
      <!-- Icons on phones, where Mondrian's toolbar has no room for the words. -->
      <option.icon class="w-4 h-4 sm:hidden" aria-hidden="true" />
      <span class="max-sm:sr-only">{option.label}</span>
    </button>
  {/each}
</div>
