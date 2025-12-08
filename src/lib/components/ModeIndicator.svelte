<script lang="ts">
  import { onMount } from 'svelte'
  import ConfigStore from '../../stores/configStore'
  import { Z_INDEX } from '$lib/styles/z-index'
  import MdCircleOutline from '~icons/mdi/circle-outline'
  import MdChartPie from '~icons/mdi/chart-pie'
  import MdFormatColorHighlight from '~icons/mdi/format-color-highlight'

  interface Props {
    class?: string
  }

  let { class: className = '' }: Props = $props()

  // Mode configuration
  const modes = {
    circle: {
      icon: MdCircleOutline,
      label: 'Circle Mode',
      description: 'Hover to highlight points within a circle',
      shortcut: '1',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/30',
    },
    slice: {
      icon: MdChartPie,
      label: 'Slice Mode',
      description: 'Hover to highlight points within a pie slice',
      shortcut: '2',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
      borderColor: 'border-secondary/30',
    },
    highlight: {
      icon: MdFormatColorHighlight,
      label: 'Highlight Mode',
      description: 'Hover to highlight individual points',
      shortcut: '3',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      borderColor: 'border-accent/30',
    },
  } as const

  type ModeKey = keyof typeof modes

  // Subscribe to config store
  let config = $state<typeof ConfigStore>()
  let activeMode = $derived.by(() => {
    if (!config) return null
    if (config.circleToggle) return 'circle' as const
    if (config.sliceToggle) return 'slice' as const
    if (config.highlightToggle) return 'highlight' as const
    return null
  })

  let modeConfig = $derived(activeMode ? modes[activeMode] : null)
  let isVisible = $derived(activeMode !== null)

  // Animation state for mode changes
  let prevMode = $state<ModeKey | null>(null)
  let shouldAnimate = $state(false)

  onMount(() => {
    const unsubscribe = ConfigStore.subscribe((value) => {
      config = value
    })

    return () => {
      unsubscribe()
    }
  })

  // Watch for mode changes to trigger animation
  $effect(() => {
    if (activeMode !== prevMode) {
      shouldAnimate = true
      prevMode = activeMode
      // Reset animation flag after animation completes
      setTimeout(() => {
        shouldAnimate = false
      }, 300)
    }
  })
</script>

{#if isVisible && modeConfig}
  <div
    class="mode-indicator {className}"
    class:mode-pulse={shouldAnimate}
    style="z-index: {Z_INDEX.FAB}"
    role="status"
    aria-live="polite"
    aria-label="Current selection mode: {modeConfig.label}"
  >
    <div class="mode-content {modeConfig.bgColor} {modeConfig.borderColor} {modeConfig.color}">
      <!-- Icon -->
      <div class="mode-icon">
        {#if activeMode === 'circle'}
          <MdCircleOutline />
        {:else if activeMode === 'slice'}
          <MdChartPie />
        {:else if activeMode === 'highlight'}
          <MdFormatColorHighlight />
        {/if}
      </div>

      <!-- Label and description -->
      <div class="mode-text">
        <div class="mode-label">{modeConfig.label}</div>
        <div class="mode-description">{modeConfig.description}</div>
      </div>

      <!-- Keyboard shortcuts -->
      <div class="mode-shortcuts">
        <kbd class="kbd kbd-xs">{modeConfig.shortcut}</kbd>
        <kbd class="kbd kbd-xs kbd-escape">Esc</kbd>
      </div>
    </div>
  </div>
{/if}

<style>
  .mode-indicator {
    position: fixed;
    bottom: 7rem;
    left: 1rem;
    min-width: 280px;
    max-width: 320px;
    animation: fadeIn 0.3s ease-in-out;
  }

  .mode-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: oklch(var(--b1) / 0.95);
    border: 1px solid;
    border-radius: 0.75rem;
    box-shadow:
      0 4px 6px -1px rgb(0 0 0 / 0.1),
      0 2px 4px -2px rgb(0 0 0 / 0.1);
    backdrop-filter: blur(8px);
    transition: all 0.2s ease-in-out;
  }

  .mode-content:hover {
    box-shadow:
      0 10px 15px -3px rgb(0 0 0 / 0.1),
      0 4px 6px -4px rgb(0 0 0 / 0.1);
  }

  .mode-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mode-icon :global(svg) {
    width: 1.5rem;
    height: 1.5rem;
  }

  .mode-text {
    flex: 1;
    min-width: 0;
  }

  .mode-label {
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1.25;
  }

  .mode-description {
    font-size: 0.75rem;
    opacity: 0.7;
    line-height: 1.2;
    margin-top: 0.125rem;
  }

  .mode-shortcuts {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex-shrink: 0;
  }

  .kbd-escape {
    opacity: 0.5;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-0.5rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes modePulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.02);
    }
    100% {
      transform: scale(1);
    }
  }

  .mode-pulse {
    animation: modePulse 0.3s ease-in-out;
  }

  /* Responsive design for mobile */
  @media (max-width: 640px) {
    .mode-indicator {
      bottom: 6.5rem;
      left: 0.5rem;
      min-width: 240px;
      max-width: 280px;
    }

    .mode-content {
      padding: 0.5rem 0.75rem;
      gap: 0.5rem;
    }

    .mode-icon :global(svg) {
      width: 1.25rem;
      height: 1.25rem;
    }

    .mode-label {
      font-size: 0.8125rem;
    }

    .mode-description {
      font-size: 0.6875rem;
    }

    .mode-shortcuts {
      display: none;
    }
  }

  /* Smaller screens - ultra compact */
  @media (max-width: 480px) {
    .mode-indicator {
      bottom: 6.25rem;
      min-width: 180px;
      max-width: 200px;
    }

    .mode-description {
      display: none;
    }
  }
</style>
