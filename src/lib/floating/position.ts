/**
 * FloatingUI positioning utilities
 *
 * Functions for positioning floating elements using @floating-ui/dom
 */

import { computePosition, flip, shift, offset } from '@floating-ui/dom'
import type { Middleware } from '@floating-ui/dom'
import type { FloatingOptions } from './types'
import { Z_INDEX } from '$lib/styles'

/**
 * Default options for floating element positioning
 */
const DEFAULT_OPTIONS: Required<FloatingOptions> = {
  placement: 'top',
  offset: 6,
  flip: true,
  shift: { padding: 5 },
  zIndex: Z_INDEX.DROPDOWN,
  autoUpdate: true,
}

/**
 * Position a floating element relative to a reference element
 *
 * Uses @floating-ui/dom to calculate optimal position based on available space,
 * and applies styles directly to the floating element.
 *
 * @param reference - The element to position relative to (e.g., button)
 * @param floating - The element to position (e.g., dropdown, tooltip)
 * @param options - Positioning configuration options
 * @returns Promise that resolves when positioning is complete
 *
 * @example
 * ```typescript
 * import { positionElement } from '$lib/floating';
 *
 * const button = document.getElementById('menu-button');
 * const menu = document.getElementById('menu');
 *
 * await positionElement(button, menu, {
 *   placement: 'bottom',
 *   offset: 8
 * });
 * ```
 */
export function positionElement(
  reference: HTMLElement,
  floating: HTMLElement,
  options?: FloatingOptions
): Promise<void> {
  // Merge user options with defaults
  const config = { ...DEFAULT_OPTIONS, ...options }

  // Build middleware array based on configuration
  const middleware: Middleware[] = []

  // Add offset middleware
  if (config.offset > 0) {
    middleware.push(offset(config.offset))
  }

  // Add flip middleware if enabled
  if (config.flip) {
    middleware.push(flip())
  }

  // Add shift middleware if enabled
  if (config.shift) {
    if (typeof config.shift === 'boolean') {
      middleware.push(shift())
    } else {
      middleware.push(shift(config.shift))
    }
  }

  // Compute position and apply styles
  return computePosition(reference, floating, {
    placement: config.placement,
    middleware,
  }).then(({ x, y }) => {
    Object.assign(floating.style, {
      left: `${x}px`,
      top: `${y}px`,
      position: 'absolute',
      width: 'max-content',
      zIndex: String(config.zIndex),
    })
  })
}
