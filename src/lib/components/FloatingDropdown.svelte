<script lang="ts">
  import { onMount, onDestroy, type Snippet } from 'svelte'
  import { floatingManager } from '$lib/floating'
  import { clickOutside } from '$lib/actions/clickOutside'
  import { Z_INDEX } from '$lib/styles/z-index'
  import type { FloatingOptions } from '$lib/floating/types'

  /**
   * Props interface for FloatingDropdown component
   */
  interface Props {
    /**
     * Unique identifier for this dropdown instance
     */
    id: string
    /**
     * Text to display in the button (if not using buttonChildren snippet)
     */
    buttonText?: string
    /**
     * Additional CSS classes for the button
     */
    buttonClass?: string
    /**
     * Additional CSS classes for the dropdown content container
     */
    contentClass?: string
    /**
     * Placement of the dropdown relative to the button
     * @default 'bottom'
     */
    placement?: 'top' | 'bottom' | 'left' | 'right'
    /**
     * Offset distance from the button in pixels
     * @default 8
     */
    offset?: number
    /**
     * Whether to close the dropdown when clicking outside
     * @default true
     */
    closeOnClickOutside?: boolean
    /**
     * Whether to close the dropdown when pressing Escape key
     * @default true
     */
    closeOnEscape?: boolean
    /**
     * Snippet for dropdown content (required)
     */
    children: Snippet
    /**
     * Optional snippet for custom button content
     */
    buttonChildren?: Snippet
  }

  let {
    id,
    buttonText = 'Menu',
    buttonClass = 'btn btn-sm',
    contentClass = 'menu dropdown-content rounded-box w-52 p-2 shadow bg-base-100',
    placement = 'bottom',
    offset = 8,
    closeOnClickOutside = true,
    closeOnEscape = true,
    children,
    buttonChildren,
  }: Props = $props()

  // State
  let buttonElement = $state<HTMLButtonElement | null>(null)
  let contentElement = $state<HTMLDivElement | null>(null)
  let isOpen = $state(false)

  // Derived state - check if dropdown is open via manager
  $effect(() => {
    isOpen = floatingManager.isOpen(id)
  })

  /**
   * Toggle the dropdown open/closed
   */
  function toggle() {
    const options: FloatingOptions = {
      placement,
      offset,
      zIndex: Z_INDEX.DROPDOWN,
    }
    floatingManager.toggle(id, options)
  }

  /**
   * Open the dropdown programmatically
   */
  export function open() {
    const options: FloatingOptions = {
      placement,
      offset,
      zIndex: Z_INDEX.DROPDOWN,
    }
    floatingManager.open(id, options)
  }

  /**
   * Close the dropdown programmatically
   */
  export function close() {
    floatingManager.close(id)
  }

  /**
   * Handle button click
   */
  function handleButtonClick(event: MouseEvent) {
    event.stopPropagation()
    toggle()
  }

  /**
   * Handle keyboard navigation
   */
  function handleKeyDown(event: KeyboardEvent) {
    // Open on Enter or Space
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggle()
    }

    // Close on Escape
    if (closeOnEscape && event.key === 'Escape' && isOpen) {
      event.preventDefault()
      close()
    }
  }

  /**
   * Handle click outside
   */
  function handleClickOutside() {
    if (closeOnClickOutside && isOpen) {
      close()
    }
  }

  // Register with floating manager on mount
  onMount(() => {
    if (buttonElement && contentElement) {
      floatingManager.register(id, buttonElement, contentElement)
    }
  })

  // Cleanup on destroy
  onDestroy(() => {
    floatingManager.unregister(id)
  })
</script>

<div class="floating-dropdown-wrapper">
  <!-- Button trigger -->
  <button
    bind:this={buttonElement}
    class={buttonClass}
    onclick={handleButtonClick}
    onkeydown={handleKeyDown}
    aria-haspopup="true"
    aria-expanded={isOpen}
    aria-controls="{id}-content"
    type="button"
  >
    {#if buttonChildren}
      {@render buttonChildren()}
    {:else}
      {buttonText}
    {/if}
  </button>

  <!-- Dropdown content (managed by floatingManager) -->
  <div
    bind:this={contentElement}
    id="{id}-content"
    class={contentClass}
    role="menu"
    style="display: none; position: absolute; z-index: {Z_INDEX.DROPDOWN};"
    use:clickOutside={{
      onClickOutside: handleClickOutside,
      exclude: buttonElement ? [buttonElement] : [],
      enabled: isOpen,
    }}
  >
    {@render children()}
  </div>
</div>

<style>
  .floating-dropdown-wrapper {
    position: relative;
    display: inline-block;
  }
</style>
