<script lang="ts">
  import { browser } from '$app/environment'
  import HoveredConversationStore from '../../stores/interactionStore'
  import { formatTime } from '../utils/format'

  let { hideTooltip = false }: { hideTooltip?: boolean } = $props()

  // Constants
  const MAX_TURNS = 5
  const GAP = 15
  const TOOLTIP_WIDTH = 300
  const TRIANGLE_BORDER = 10
  const TRIANGLE_MIN_Y = 20
  const TURN_HEIGHT = 70
  const DIVIDER_HEIGHT = 8
  const CONTAINER_PADDING = 24
  const MORE_INDICATOR_HEIGHT = 35
  const DEFAULT_COLOR = '#666'

  let hoveredData = $derived($HoveredConversationStore)

  // Estimate tooltip height based on number of turns
  let estimatedHeight = $derived.by(() => {
    if (!hoveredData) return 100
    const numTurns = Math.min(hoveredData.turns.length, MAX_TURNS)
    const moreIndicator = hoveredData.turns.length > MAX_TURNS ? MORE_INDICATOR_HEIGHT : 0
    return numTurns * TURN_HEIGHT + (numTurns - 1) * DIVIDER_HEIGHT + CONTAINER_PADDING + moreIndicator
  })

  // Calculate tooltip position
  let tooltipPosition = $derived.by(() => {
    if (!hoveredData || !browser) return { style: '', triangleClass: 'point-left' }

    // Convert canvas-relative coords to viewport coords
    const canvas = document.querySelector('canvas')
    const canvasRect = canvas?.getBoundingClientRect()
    const mouseX = hoveredData.mouseX + (canvasRect?.left ?? 0)
    const mouseY = hoveredData.mouseY + (canvasRect?.top ?? 0)

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const tooltipHeight = estimatedHeight

    let x: number
    let y: number
    let triangleClass: string
    let useRightPosition = false

    // Horizontal: prefer right side, flip to left if doesn't fit
    if (mouseX + GAP + TOOLTIP_WIDTH < viewportWidth) {
      x = mouseX + GAP
      triangleClass = 'point-left'
    } else {
      x = viewportWidth - mouseX + GAP
      triangleClass = 'point-right'
      useRightPosition = true
    }

    // Vertical: position so triangle points at mouse
    const idealTriangleY = 30
    y = mouseY - idealTriangleY - TRIANGLE_BORDER
    y = Math.max(GAP, Math.min(y, viewportHeight - tooltipHeight - GAP))

    // Calculate triangle Y to point at mouse, clamped to tooltip bounds
    const triangleMaxY = Math.max(TRIANGLE_MIN_Y, tooltipHeight - TRIANGLE_MIN_Y - TRIANGLE_BORDER * 2)
    const triangleY = Math.max(TRIANGLE_MIN_Y, Math.min(mouseY - y - TRIANGLE_BORDER, triangleMaxY))

    const position = useRightPosition ? 'right' : 'left'
    return {
      style: `${position}: ${x}px; top: ${y}px; --triangle-y: ${triangleY}px;`,
      triangleClass
    }
  })

  // Derived values for template
  let displayedTurns = $derived(hoveredData?.turns.slice(0, MAX_TURNS) ?? [])
  let remainingCount = $derived((hoveredData?.turns.length ?? 0) - MAX_TURNS)
</script>

{#if !hideTooltip && hoveredData && hoveredData.turns.length > 0}
  <div class="tooltip-wrapper {tooltipPosition.triangleClass}" style={tooltipPosition.style}>
    <div class="triangle"></div>
    <div class="tooltip-content">
      <div class="turns-container">
        {#each displayedTurns as turn}
          <div class="turn" style="--speaker-color: {turn.color || DEFAULT_COLOR}">
            <div class="turn-header">
              <span class="turn-time">{formatTime(turn.time)}</span>
              <span class="turn-speaker" style="color: {turn.color || DEFAULT_COLOR}">
                {turn.speaker}
              </span>
            </div>
            <div class="turn-text">{turn.text}</div>
          </div>
        {/each}
      </div>
      {#if remainingCount > 0}
        <div class="more-indicator">
          +{remainingCount} more turn{remainingCount === 1 ? '' : 's'}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .tooltip-wrapper {
    position: fixed;
    z-index: 1000;
    pointer-events: none;
    animation: fadeIn 0.15s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.97);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .tooltip-content {
    max-width: 320px;
    min-width: 200px;
    background: #fefefe;
    border: 1px solid #e0e0e0;
    border-radius: 10px;
    box-shadow:
      0 2px 4px rgba(0, 0, 0, 0.04),
      0 8px 16px rgba(0, 0, 0, 0.08),
      0 16px 32px rgba(0, 0, 0, 0.04);
    padding: 12px;
  }

  .triangle {
    position: absolute;
    width: 0;
    height: 0;
    border: 10px solid transparent;
  }

  .triangle::after {
    content: '';
    position: absolute;
    width: 0;
    height: 0;
    border: 9px solid transparent;
  }

  .point-left .triangle {
    top: var(--triangle-y, 12px);
    left: -9px;
    border-right-color: #e0e0e0;
    border-left-width: 0;
  }

  .point-left .triangle::after {
    top: -9px;
    left: 1px;
    border-right-color: #fefefe;
    border-left-width: 0;
  }

  .point-right .triangle {
    top: var(--triangle-y, 12px);
    right: -9px;
    border-left-color: #e0e0e0;
    border-right-width: 0;
  }

  .point-right .triangle::after {
    top: -9px;
    right: 1px;
    border-left-color: #fefefe;
    border-right-width: 0;
  }

  .turns-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .turn {
    padding: 8px 10px;
    border-radius: 6px;
    background: #f8f9fa;
    border-left: 3px solid var(--speaker-color, #666);
  }

  .turn-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 4px;
  }

  .turn-time {
    font-size: 10px;
    color: #888;
    font-family: ui-monospace, 'SF Mono', Monaco, monospace;
    background: rgba(0, 0, 0, 0.05);
    padding: 2px 5px;
    border-radius: 3px;
  }

  .turn-speaker {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  .turn-text {
    font-size: 13px;
    color: #444;
    line-height: 1.5;
  }

  .more-indicator {
    font-size: 11px;
    color: #888;
    text-align: center;
    padding: 8px 0 2px;
    margin-top: 4px;
    border-top: 1px solid #eee;
    font-style: italic;
  }
</style>
