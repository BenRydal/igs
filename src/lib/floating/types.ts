/**
 * FloatingUI type definitions
 *
 * Type definitions for floating element positioning and management
 */

import type { Placement, Middleware } from '@floating-ui/dom'

/**
 * Configuration options for positioning a floating element
 */
export interface FloatingOptions {
  /**
   * Preferred placement of the floating element relative to the reference
   * @default 'top'
   */
  placement?: Placement

  /**
   * Distance in pixels between the reference and floating element
   * @default 6
   */
  offset?: number

  /**
   * Whether to flip the floating element to the opposite side if it doesn't fit
   * @default true
   */
  flip?: boolean

  /**
   * Whether to shift the floating element to keep it in view
   * Can be boolean or an object with padding option
   * @default { padding: 5 }
   */
  shift?: boolean | { padding?: number }

  /**
   * Z-index value for the floating element
   * Should use values from Z_INDEX constants
   * @default Z_INDEX.DROPDOWN
   */
  zIndex?: number

  /**
   * Whether to automatically update position on scroll/resize
   * @default true
   */
  autoUpdate?: boolean
}

/**
 * Internal state tracking for a floating element
 */
export interface FloatingState {
  /**
   * Reference element that triggers the floating element
   */
  button: HTMLElement | null

  /**
   * The floating element itself
   */
  content: HTMLElement | null

  /**
   * Whether the floating element is currently open
   */
  isOpen: boolean

  /**
   * Cleanup function to stop auto-update and remove event listeners
   */
  cleanup: (() => void) | null
}
