import type { ActionReturn } from 'svelte/action'

/**
 * Closes a details element when a click lands outside it.
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
