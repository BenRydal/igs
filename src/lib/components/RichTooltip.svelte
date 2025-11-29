<script lang="ts">
  import { onMount, onDestroy, type Snippet } from 'svelte'
  import { computePosition, flip, shift, offset, arrow } from '@floating-ui/dom'
  import type { Placement } from '@floating-ui/dom'
  import { Z_INDEX } from '$lib/styles/z-index'

  /**
   * Props interface for RichTooltip component
   */
  interface Props {
    /**
     * Main title of the tooltip
     */
    title: string
    /**
     * Optional longer description
     */
    description?: string
    /**
     * Optional keyboard shortcut (e.g., "Space", "Cmd+K")
     */
    shortcut?: string
    /**
     * Placement of the tooltip relative to the trigger element
     * @default 'top'
     */
    placement?: Placement
    /**
     * Delay in milliseconds before showing the tooltip
     * @default 500
     */
    delay?: number
    /**
     * The element to attach the tooltip to
     */
    children: Snippet
  }

  let {
    title,
    description = '',
    shortcut = '',
    placement = 'top',
    delay = 500,
    children,
  }: Props = $props()

  // State
  let triggerElement = $state<HTMLElement | null>(null)
  let tooltipElement = $state<HTMLDivElement | null>(null)
  let arrowElement = $state<HTMLDivElement | null>(null)
  let isVisible = $state(false)
  let hoverTimeout: ReturnType<typeof setTimeout> | null = null
  let cleanupAutoUpdate: (() => void) | null = null
  let tooltipId = $state(`tooltip-${Math.random().toString(36).substr(2, 9)}`)

  /**
   * Update tooltip position
   */
  async function updatePosition() {
    if (!triggerElement || !tooltipElement || !arrowElement) return

    const {
      x,
      y,
      placement: finalPlacement,
      middlewareData,
    } = await computePosition(triggerElement, tooltipElement, {
      placement,
      middleware: [offset(8), flip(), shift({ padding: 5 }), arrow({ element: arrowElement })],
    })

    // Apply tooltip position
    Object.assign(tooltipElement.style, {
      left: `${x}px`,
      top: `${y}px`,
    })

    // Apply arrow position
    const { x: arrowX, y: arrowY } = middlewareData.arrow || {}
    const staticSide = {
      top: 'bottom',
      right: 'left',
      bottom: 'top',
      left: 'right',
    }[finalPlacement.split('-')[0]]

    if (arrowX !== undefined) {
      arrowElement.style.left = `${arrowX}px`
    }
    if (arrowY !== undefined) {
      arrowElement.style.top = `${arrowY}px`
    }

    if (staticSide) {
      arrowElement.style[staticSide as 'top' | 'bottom' | 'left' | 'right'] = '-4px'
    }
  }

  /**
   * Show the tooltip after delay
   */
  function handleMouseEnter() {
    // Clear any existing timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
    }

    // Set new timeout to show tooltip
    hoverTimeout = setTimeout(() => {
      isVisible = true
      updatePosition()
    }, delay)
  }

  /**
   * Hide the tooltip immediately
   */
  function handleMouseLeave() {
    // Clear timeout if user leaves before tooltip shows
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      hoverTimeout = null
    }

    isVisible = false
  }

  /**
   * Handle trigger element focus
   */
  function handleFocus() {
    // Show immediately on focus (accessibility)
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
    }
    isVisible = true
    updatePosition()
  }

  /**
   * Handle trigger element blur
   */
  function handleBlur() {
    isVisible = false
  }

  /**
   * Setup auto-update on scroll/resize
   */
  function setupAutoUpdate() {
    if (cleanupAutoUpdate) {
      cleanupAutoUpdate()
    }

    const updateHandler = () => {
      if (isVisible) {
        updatePosition()
      }
    }

    window.addEventListener('scroll', updateHandler, true)
    window.addEventListener('resize', updateHandler)

    cleanupAutoUpdate = () => {
      window.removeEventListener('scroll', updateHandler, true)
      window.removeEventListener('resize', updateHandler)
    }
  }

  /**
   * Attach event listeners to trigger element
   */
  function attachListeners() {
    if (!triggerElement) return

    triggerElement.addEventListener('mouseenter', handleMouseEnter)
    triggerElement.addEventListener('mouseleave', handleMouseLeave)
    triggerElement.addEventListener('focus', handleFocus)
    triggerElement.addEventListener('blur', handleBlur)
  }

  /**
   * Remove event listeners from trigger element
   */
  function detachListeners() {
    if (!triggerElement) return

    triggerElement.removeEventListener('mouseenter', handleMouseEnter)
    triggerElement.removeEventListener('mouseleave', handleMouseLeave)
    triggerElement.removeEventListener('focus', handleFocus)
    triggerElement.removeEventListener('blur', handleBlur)
  }

  // Effect to attach/detach listeners when trigger element changes
  $effect(() => {
    if (triggerElement) {
      attachListeners()
      setupAutoUpdate()
    }

    return () => {
      detachListeners()
      if (hoverTimeout) {
        clearTimeout(hoverTimeout)
      }
      if (cleanupAutoUpdate) {
        cleanupAutoUpdate()
      }
    }
  })

  // Cleanup on destroy
  onDestroy(() => {
    detachListeners()
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
    }
    if (cleanupAutoUpdate) {
      cleanupAutoUpdate()
    }
  })
</script>

<!-- Wrapper for trigger element -->
<div
  class="rich-tooltip-wrapper"
  bind:this={triggerElement}
  aria-describedby={isVisible ? tooltipId : undefined}
>
  {@render children()}
</div>

<!-- Tooltip content (rendered in document body) -->
{#if isVisible}
  <div
    bind:this={tooltipElement}
    id={tooltipId}
    class="rich-tooltip"
    role="tooltip"
    style="position: absolute; z-index: {Z_INDEX.TOOLTIP};"
  >
    <div class="rich-tooltip-content">
      <div class="rich-tooltip-header">
        <span class="rich-tooltip-title">{title}</span>
        {#if shortcut}
          <kbd class="rich-tooltip-shortcut">{shortcut}</kbd>
        {/if}
      </div>
      {#if description}
        <p class="rich-tooltip-description">{description}</p>
      {/if}
    </div>
    <div bind:this={arrowElement} class="rich-tooltip-arrow"></div>
  </div>
{/if}

<style>
  .rich-tooltip-wrapper {
    display: inline-block;
  }

  .rich-tooltip {
    max-width: 320px;
    background-color: rgb(30 41 59); /* slate-800 */
    color: white;
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    box-shadow:
      0 10px 15px -3px rgb(0 0 0 / 0.1),
      0 4px 6px -4px rgb(0 0 0 / 0.1);
    font-size: 0.875rem;
    line-height: 1.25rem;
    pointer-events: none;
    user-select: none;
  }

  .rich-tooltip-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .rich-tooltip-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .rich-tooltip-title {
    font-weight: 600;
    font-size: 0.875rem;
    line-height: 1.25rem;
    white-space: nowrap;
  }

  .rich-tooltip-description {
    margin: 0;
    color: rgb(203 213 225); /* slate-300 */
    font-size: 0.8125rem;
    line-height: 1.375;
  }

  .rich-tooltip-shortcut {
    display: inline-flex;
    align-items: center;
    padding: 0.125rem 0.375rem;
    background-color: rgb(51 65 85); /* slate-700 */
    border: 1px solid rgb(71 85 105); /* slate-600 */
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
      monospace;
    font-weight: 500;
    white-space: nowrap;
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  }

  .rich-tooltip-arrow {
    position: absolute;
    background-color: rgb(30 41 59); /* slate-800 */
    width: 8px;
    height: 8px;
    transform: rotate(45deg);
  }
</style>
