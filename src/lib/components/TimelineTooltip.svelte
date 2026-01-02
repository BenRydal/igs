<script lang="ts">
  import { browser } from '$app/environment'
  import { TimelineHoverStore } from '../../stores/interactionStore'
  import { formatTime } from '../utils/format'

  const GAP = 15
  const TOOLTIP_HEIGHT = 24

  let hoverData = $derived($TimelineHoverStore)
  let timeText = $derived(hoverData ? formatTime(hoverData.time) : '')

  let tooltipStyle = $derived.by(() => {
    if (!hoverData || !browser) return null

    // Convert canvas-relative coords to viewport coords
    const canvas = document.querySelector('canvas')
    const canvasRect = canvas?.getBoundingClientRect()
    const mouseX = hoverData.mouseX + (canvasRect?.left ?? 0)
    const mouseY = hoverData.mouseY + (canvasRect?.top ?? 0)

    // Center tooltip horizontally on cursor
    const estimatedWidth = timeText.length * 9 + 16
    const x = Math.max(GAP, Math.min(mouseX - estimatedWidth / 2, window.innerWidth - estimatedWidth - GAP))

    // Position above mouse, clamped to canvas
    const y = Math.max(GAP, Math.min(mouseY - TOOLTIP_HEIGHT - 10, (canvasRect?.bottom ?? window.innerHeight) - TOOLTIP_HEIGHT - GAP))

    return `left: ${x}px; top: ${y}px;`
  })
</script>

{#if tooltipStyle}
  <div class="timeline-tooltip" style={tooltipStyle}>
    {timeText}
  </div>
{/if}

<style>
  .timeline-tooltip {
    position: fixed;
    z-index: 1000;
    pointer-events: none;
    background: rgba(0, 0, 0, 0.75);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 14px;
    font-family: ui-monospace, 'SF Mono', Monaco, monospace;
    white-space: nowrap;
    animation: fadeIn 0.1s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
