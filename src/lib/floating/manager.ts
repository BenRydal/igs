/**
 * FloatingUI element manager
 *
 * Manages the lifecycle and state of floating elements (dropdowns, popovers, tooltips)
 * Handles registration, opening/closing, auto-update, and click-outside behavior
 */

import { autoUpdate } from '@floating-ui/dom'
import type { FloatingState, FloatingOptions } from './types'
import { positionElement } from './position'
import { Z_INDEX } from '$lib/styles'

/**
 * FloatingManager class for managing floating elements
 *
 * Provides centralized control over all floating elements in the application.
 * Handles state tracking, positioning, auto-update lifecycle, and cleanup.
 *
 * @example
 * ```typescript
 * import { floatingManager } from '$lib/floating';
 *
 * // Register a dropdown
 * const button = document.getElementById('menu-button');
 * const dropdown = document.getElementById('menu-dropdown');
 * floatingManager.register('main-menu', button, dropdown);
 *
 * // Toggle it open/closed
 * floatingManager.toggle('main-menu');
 *
 * // Close all floating elements
 * floatingManager.closeAll();
 * ```
 */
export class FloatingManager {
  /**
   * Internal registry of all floating elements
   */
  private elements: Map<string, FloatingState> = new Map()

  /**
   * Default positioning options for all floating elements
   */
  private defaultOptions: FloatingOptions = {
    placement: 'top',
    offset: 6,
    flip: true,
    shift: { padding: 5 },
    zIndex: Z_INDEX.DROPDOWN,
    autoUpdate: true,
  }

  /**
   * Register a floating element for management
   *
   * Associates a button/trigger element with its corresponding floating content.
   * The floating element will be hidden initially.
   *
   * @param id - Unique identifier for this floating element
   * @param button - Reference element that triggers the floating element
   * @param content - The floating element to show/hide
   *
   * @example
   * ```typescript
   * floatingManager.register('settings-menu', settingsButton, settingsDropdown);
   * ```
   */
  register(id: string, button: HTMLElement, content: HTMLElement): void {
    // Clean up existing registration if it exists
    if (this.elements.has(id)) {
      this.close(id)
    }

    // Initialize state
    this.elements.set(id, {
      button,
      content,
      isOpen: false,
      cleanup: null,
    })

    // Ensure content starts hidden
    content.style.display = 'none'
  }

  /**
   * Unregister a floating element
   *
   * Removes the element from management and cleans up any active state.
   *
   * @param id - Identifier of the floating element to unregister
   */
  unregister(id: string): void {
    if (this.elements.has(id)) {
      this.close(id)
      this.elements.delete(id)
    }
  }

  /**
   * Toggle a floating element between open and closed states
   *
   * If the element is currently open, it will be closed.
   * If it's closed, it will be opened and all other floating elements will be closed.
   *
   * @param id - Identifier of the floating element to toggle
   * @param options - Optional positioning configuration (overrides defaults)
   *
   * @example
   * ```typescript
   * floatingManager.toggle('color-picker', { placement: 'bottom' });
   * ```
   */
  toggle(id: string, options?: FloatingOptions): void {
    const element = this.elements.get(id)
    if (!element || !element.button || !element.content) {
      console.warn(`FloatingManager: Cannot toggle element "${id}" - not found or missing elements`)
      return
    }

    if (element.isOpen) {
      this.close(id)
    } else {
      // Close all other floating elements first
      this.closeAll()
      this.open(id, options)
    }
  }

  /**
   * Open a floating element
   *
   * Shows the floating element, positions it, and sets up auto-update and click-outside listeners.
   * Automatically closes all other floating elements.
   *
   * @param id - Identifier of the floating element to open
   * @param options - Optional positioning configuration (overrides defaults)
   *
   * @example
   * ```typescript
   * floatingManager.open('tooltip', { placement: 'right', autoUpdate: false });
   * ```
   */
  open(id: string, options?: FloatingOptions): void {
    const element = this.elements.get(id)
    if (!element || !element.button || !element.content) {
      console.warn(`FloatingManager: Cannot open element "${id}" - not found or missing elements`)
      return
    }

    // Close all other floating elements
    for (const [otherId] of this.elements) {
      if (otherId !== id) {
        this.close(otherId)
      }
    }

    // Mark as open
    element.isOpen = true

    // Merge options with defaults
    const config = { ...this.defaultOptions, ...options }

    // Show the element
    element.content.style.display = 'block'

    // Move to document body to avoid clipping by overflow containers
    document.body.appendChild(element.content)

    // Position initially
    positionElement(element.button, element.content, config)

    // Set up auto-update if enabled
    let autoUpdateCleanup: (() => void) | null = null
    if (config.autoUpdate) {
      autoUpdateCleanup = autoUpdate(element.button, element.content, () => {
        if (element.button && element.content) {
          positionElement(element.button, element.content, config)
        }
      })
    }

    // Set up click-outside listener
    const handleClickOutside = (event: MouseEvent) => {
      if (
        element.content &&
        element.button &&
        !element.content.contains(event.target as Node) &&
        !element.button.contains(event.target as Node)
      ) {
        this.close(id)
      }
    }

    // Add listener with slight delay to prevent immediate closure
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 0)

    // Store cleanup function
    element.cleanup = () => {
      autoUpdateCleanup?.()
      document.removeEventListener('click', handleClickOutside)
    }
  }

  /**
   * Close a floating element
   *
   * Hides the element and cleans up auto-update and event listeners.
   *
   * @param id - Identifier of the floating element to close
   *
   * @example
   * ```typescript
   * floatingManager.close('dropdown');
   * ```
   */
  close(id: string): void {
    const element = this.elements.get(id)
    if (!element) return

    // Mark as closed
    element.isOpen = false

    // Hide the element
    if (element.content) {
      element.content.style.display = 'none'
    }

    // Run cleanup function
    if (element.cleanup) {
      element.cleanup()
      element.cleanup = null
    }
  }

  /**
   * Close all floating elements
   *
   * Iterates through all registered elements and closes them.
   *
   * @example
   * ```typescript
   * // Close everything when opening a modal
   * floatingManager.closeAll();
   * ```
   */
  closeAll(): void {
    for (const id of this.elements.keys()) {
      this.close(id)
    }
  }

  /**
   * Check if a floating element is currently open
   *
   * @param id - Identifier of the floating element to check
   * @returns true if the element is open, false otherwise
   *
   * @example
   * ```typescript
   * if (floatingManager.isOpen('menu')) {
   *   console.log('Menu is open');
   * }
   * ```
   */
  isOpen(id: string): boolean {
    const element = this.elements.get(id)
    return element?.isOpen ?? false
  }

  /**
   * Get all currently open floating element IDs
   *
   * @returns Array of IDs for floating elements that are currently open
   *
   * @example
   * ```typescript
   * const openElements = floatingManager.getOpenElements();
   * console.log('Open:', openElements); // ['tooltip-1', 'dropdown-menu']
   * ```
   */
  getOpenElements(): string[] {
    const openIds: string[] = []
    for (const [id, element] of this.elements) {
      if (element.isOpen) {
        openIds.push(id)
      }
    }
    return openIds
  }

  /**
   * Set default options for all floating elements
   *
   * These options will be used unless overridden in open() or toggle() calls.
   *
   * @param options - Default positioning options
   *
   * @example
   * ```typescript
   * floatingManager.setDefaultOptions({
   *   placement: 'bottom',
   *   zIndex: Z_INDEX.TOOLTIP
   * });
   * ```
   */
  setDefaultOptions(options: FloatingOptions): void {
    this.defaultOptions = { ...this.defaultOptions, ...options }
  }

  /**
   * Get the current default options
   *
   * @returns Current default positioning options
   */
  getDefaultOptions(): FloatingOptions {
    return { ...this.defaultOptions }
  }
}

/**
 * Global singleton instance of FloatingManager
 *
 * Use this exported instance throughout your application to manage floating elements.
 *
 * @example
 * ```typescript
 * import { floatingManager } from '$lib/floating';
 *
 * floatingManager.register('my-tooltip', button, tooltipContent);
 * floatingManager.open('my-tooltip');
 * ```
 */
export const floatingManager = new FloatingManager()
