/**
 * P5 Canvas Utilities
 *
 * Shared utilities for interacting with the p5.js canvas instance.
 */

import P5Store from '../../stores/p5Store'
import { get } from 'svelte/store'

/**
 * Trigger p5 canvas redraw immediately.
 * Use this after making changes that should be reflected on the canvas.
 *
 * @example
 * // After updating user colors
 * UserStore.update(users => users.map(u => ({ ...u, color: '#ff0000' })))
 * redrawCanvas()
 */
export function redrawCanvas(): void {
  const p5Instance = get(P5Store)
  p5Instance?.loop()
}
