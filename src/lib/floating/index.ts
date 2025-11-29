/**
 * FloatingUI utilities barrel export
 *
 * Central export point for floating element positioning and management utilities.
 * Provides utilities for creating dropdowns, popovers, tooltips, and other floating UI elements
 * using @floating-ui/dom with centralized state management.
 *
 * @module floating
 *
 * @example
 * ```typescript
 * import { floatingManager, positionElement } from '$lib/floating';
 *
 * // Register and manage a dropdown
 * floatingManager.register('menu', menuButton, menuContent);
 * floatingManager.toggle('menu');
 *
 * // Or manually position an element
 * await positionElement(button, tooltip, { placement: 'top' });
 * ```
 */

// Export types
export type { FloatingOptions, FloatingState } from './types'

// Export positioning utilities
export { positionElement } from './position'

// Export manager class and singleton instance
export { FloatingManager, floatingManager } from './manager'
