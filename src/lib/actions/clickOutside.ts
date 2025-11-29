import type { ActionReturn } from 'svelte/action'

/**
 * Configuration options for the clickOutside action
 */
export interface ClickOutsideOptions {
  /**
   * Callback function invoked when a click occurs outside the element
   */
  onClickOutside: (event: MouseEvent) => void
  /**
   * Array of elements to exclude from outside click detection
   */
  exclude?: HTMLElement[]
  /**
   * Toggle the action on/off. When false, the action is disabled
   */
  enabled?: boolean
}

/**
 * Svelte action that detects clicks outside of an element and triggers a callback.
 *
 * @param node - The HTML element to monitor
 * @param options - Configuration options
 * @returns Svelte action return object with destroy and update methods
 *
 * @example
 * ```svelte
 * <div use:clickOutside={{ onClickOutside: () => console.log('Clicked outside!') }}>
 *   Content
 * </div>
 * ```
 *
 * @example
 * ```svelte
 * <div use:clickOutside={{
 *   onClickOutside: handleClose,
 *   exclude: [triggerButton],
 *   enabled: isOpen
 * }}>
 *   Dropdown content
 * </div>
 * ```
 */
export function clickOutside(
  node: HTMLElement,
  options: ClickOutsideOptions
): ActionReturn<ClickOutsideOptions> {
  let { onClickOutside, exclude = [], enabled = true } = options

  const handleClick = (event: MouseEvent) => {
    // Don't process if action is disabled
    if (!enabled) return

    const target = event.target as Node

    // Check if click is inside the node
    if (node.contains(target)) return

    // Check if click is inside any excluded elements
    if (exclude.some((element) => element?.contains(target))) return

    // Click is outside - trigger callback
    onClickOutside(event)
  }

  // Add event listener
  if (enabled) {
    document.addEventListener('click', handleClick, true)
  }

  return {
    update(newOptions: ClickOutsideOptions) {
      const wasEnabled = enabled
      ;({ onClickOutside, exclude = [], enabled = true } = newOptions)

      // Handle enable/disable state changes
      if (enabled && !wasEnabled) {
        document.addEventListener('click', handleClick, true)
      } else if (!enabled && wasEnabled) {
        document.removeEventListener('click', handleClick, true)
      }
    },
    destroy() {
      document.removeEventListener('click', handleClick, true)
    },
  }
}

/**
 * Simplified version of clickOutside that automatically closes details elements.
 * This is a convenience wrapper for the common use case of closing dropdowns/details.
 *
 * @param node - The HTML element (typically a details element) to monitor
 * @returns Svelte action return object with destroy method
 *
 * @example
 * ```svelte
 * <details use:clickOutsideClose>
 *   <summary>Click me</summary>
 *   <div>Content that closes when clicking outside</div>
 * </details>
 * ```
 */
export function clickOutsideClose(node: HTMLElement): ActionReturn {
  const handleClick = (event: MouseEvent) => {
    if (!node.contains(event.target as Node)) {
      node.removeAttribute('open')
    }
  }

  document.addEventListener('click', handleClick, true)

  return {
    destroy() {
      document.removeEventListener('click', handleClick, true)
    },
  }
}
