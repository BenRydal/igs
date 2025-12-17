<script lang="ts">
  import type { Command, HighlightSegment } from './types'

  interface Props {
    command: Command
    index: number
    selectedIndex: number
    labelSegments?: HighlightSegment[]
    onExecute: (command: Command) => void
    onSelect: (index: number) => void
  }

  let { command, index, selectedIndex, labelSegments, onExecute, onSelect }: Props = $props()

  let isSelected = $derived(selectedIndex === index)
</script>

<button
  id="command-{command.id}"
  data-index={index}
  class="w-full px-4 py-3 flex items-center gap-3 hover:bg-base-300 transition-colors {isSelected
    ? 'bg-base-300'
    : ''}"
  onclick={() => onExecute(command)}
  onmouseenter={() => onSelect(index)}
  role="option"
  aria-selected={isSelected}
>
  <!-- Icon -->
  {#if command.icon}
    <span class="text-xl flex-shrink-0">{command.icon}</span>
  {/if}

  <!-- Label and description -->
  <div class="flex-1 text-left">
    <div class="font-medium text-base-content">
      {#if labelSegments}
        {#each labelSegments as segment}
          {#if segment.highlighted}
            <mark class="bg-primary text-primary-content px-0.5 rounded">{segment.text}</mark>
          {:else}
            {segment.text}
          {/if}
        {/each}
      {:else}
        {command.label}
      {/if}
    </div>
    {#if command.description}
      <div class="text-sm text-base-content/60">{command.description}</div>
    {/if}
  </div>

  <!-- Active indicator -->
  {#if command.isActive?.()}
    <div class="badge badge-primary badge-sm">active</div>
  {/if}

  <!-- Shortcut -->
  {#if command.shortcut}
    <kbd class="kbd kbd-sm">{command.shortcut}</kbd>
  {/if}
</button>
