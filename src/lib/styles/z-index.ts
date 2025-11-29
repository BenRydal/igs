/**
 * Z-Index Hierarchy System for IGS Application
 *
 * This module defines a centralized z-index layering system to prevent overlap issues
 * and maintain consistent stacking order throughout the application.
 *
 * ## Hierarchy Overview (lowest to highest):
 *
 * **Base Layers (0-9)**
 * - Canvas and background elements that should always be behind UI
 *
 * **UI Chrome (10-49)**
 * - Navigation bars, panels, and persistent UI elements
 *
 * **Interactive Elements (50-99)**
 * - Dropdowns, popovers, tooltips - elements that appear on interaction
 *
 * **Overlays (100-199)**
 * - Modals and their backdrops - elements that take over the screen
 *
 * **Top-Level (200-999)**
 * - Command palette, toasts - elements that should always be on top
 *
 * **Development (9999)**
 * - Debug overlays and development tools
 *
 * @example
 * ```typescript
 * import { Z_INDEX, getZIndex, getZIndexClass } from '$lib/styles/z-index';
 *
 * // In TypeScript
 * const modalZ = getZIndex('MODAL'); // 110
 *
 * // In Svelte component
 * <div style="z-index: {Z_INDEX.DROPDOWN}">Dropdown</div>
 *
 * // With Tailwind (using arbitrary values)
 * <div class="{getZIndexClass('MODAL')}">Modal</div>
 * ```
 */

/**
 * Z-Index layer definitions
 *
 * Each constant represents a specific layer in the visual hierarchy.
 * Higher values appear above lower values.
 */
export const Z_INDEX = {
  /**
   * Canvas base layer - p5.js visualization canvas
   * Should be at the very bottom of the stack
   */
  CANVAS: 0,

  /**
   * Floor plan image overlay on canvas
   * Sits above canvas but below all UI
   */
  FLOOR_PLAN: 1,

  // ==================== UI Chrome (10-49) ====================

  /**
   * Top navigation bar
   * Contains app title, file controls, and settings
   */
  NAVBAR: 10,

  /**
   * Bottom navigation/control panel
   * Contains primary controls and actions
   */
  BOTTOM_NAV: 10,

  /**
   * Timeline slider and playback controls
   * Needs to be above nav to handle interactions properly
   */
  TIMELINE: 15,

  /**
   * Side panels and drawers
   * Configuration panels, data displays
   */
  SIDE_PANEL: 20,

  // ==================== Interactive Elements (50-99) ====================

  /**
   * Dropdown menus
   * File selectors, option menus
   * Should appear above all chrome but below modals
   */
  DROPDOWN: 50,

  /**
   * Popovers and context menus
   * Right-click menus, inline help
   * Same level as dropdowns
   */
  POPOVER: 50,

  /**
   * Tooltips
   * Hover information, help text
   * Above dropdowns to ensure visibility
   */
  TOOLTIP: 60,

  /**
   * Floating action buttons
   * Persistent floating UI elements
   */
  FAB: 70,

  // ==================== Overlays (100-199) ====================

  /**
   * Modal backdrop/overlay
   * Semi-transparent background behind modals
   */
  MODAL_BACKDROP: 100,

  /**
   * Modal dialogs
   * Settings modals, confirmation dialogs
   * DaisyUI modals should use this value
   */
  MODAL: 110,

  /**
   * Interactive elements within modals
   * Dropdowns, tooltips, popovers inside modal content
   * Should be higher than modal to appear above
   */
  MODAL_DROPDOWN: 115,

  /**
   * Tooltips within modals
   */
  MODAL_TOOLTIP: 116,

  /**
   * Nested modals
   * Modals that appear on top of other modals
   * Use sparingly - nested modals can confuse users
   */
  MODAL_NESTED: 120,

  /**
   * Drawer overlays
   * Side drawers and slide-out panels
   */
  DRAWER: 105,

  // ==================== Top-Level (200-999) ====================

  /**
   * Command palette
   * Keyboard-triggered command interface
   * Should be above all modals
   */
  COMMAND_PALETTE: 200,

  /**
   * Toast notifications
   * Success/error/info messages
   * Highest priority for user feedback
   */
  TOAST: 300,

  /**
   * Loading overlays
   * Full-screen loading indicators
   */
  LOADING_OVERLAY: 250,

  // ==================== Development (9999) ====================

  /**
   * Debug overlay
   * Development tools, performance monitors
   * Should always be on top during development
   */
  DEBUG_OVERLAY: 9999,
} as const

/**
 * Type representing all available z-index layer names
 */
export type ZIndexLayer = keyof typeof Z_INDEX

/**
 * Type representing all possible z-index values
 */
export type ZIndexValue = (typeof Z_INDEX)[ZIndexLayer]

/**
 * Get the numeric z-index value for a layer
 *
 * @param layer - The layer name
 * @returns The z-index value
 *
 * @example
 * ```typescript
 * const modalZ = getZIndex('MODAL'); // 110
 * element.style.zIndex = String(getZIndex('DROPDOWN'));
 * ```
 */
export function getZIndex(layer: ZIndexLayer): number {
  return Z_INDEX[layer]
}

/**
 * Generate a Tailwind CSS class for z-index using arbitrary values
 *
 * Note: Tailwind's default z-index scale only goes up to z-50.
 * This function uses arbitrary values (e.g., z-[110]) for higher values.
 *
 * @param layer - The layer name
 * @returns Tailwind class string (e.g., 'z-10' or 'z-[110]')
 *
 * @example
 * ```svelte
 * <div class={getZIndexClass('MODAL')}>Modal content</div>
 * <!-- Outputs: <div class="z-[110]">Modal content</div> -->
 * ```
 */
export function getZIndexClass(layer: ZIndexLayer): string {
  const value = Z_INDEX[layer]

  // Tailwind has built-in classes for common values
  const tailwindDefaults = [0, 10, 20, 30, 40, 50]

  if (tailwindDefaults.includes(value)) {
    return `z-${value}`
  }

  // Use arbitrary value syntax for custom z-index values
  return `z-[${value}]`
}
