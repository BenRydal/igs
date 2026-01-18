/**
 * Unified action system types
 *
 * This module defines the single source of truth for app actions.
 * Both keyboard shortcuts and command palette read from this.
 */

/**
 * Action categories for organizing actions
 */
export type ActionCategory =
  | 'filter' // Data display toggles (movement, stops, conversation)
  | 'selection' // Selection tools (circle, slice, highlight)
  | 'view' // View controls (3D, video, rotate)
  | 'playback' // Animation controls (play/pause, speed, seek)
  | 'clear' // Clear data actions
  | 'examples' // Load example datasets
  | 'settings' // Settings, help, modals

/**
 * Keyboard shortcut configuration
 */
export interface ShortcutConfig {
  /**
   * The key to press (KeyboardEvent.key value)
   * e.g., 'm', 'Space', 'Escape', 'ArrowLeft'
   */
  key: string

  /**
   * Modifier keys required
   */
  modifiers?: {
    ctrl?: boolean
    alt?: boolean
    shift?: boolean
    meta?: boolean // Cmd on Mac
  }

  /**
   * Whether to prevent browser default behavior
   * @default true
   */
  preventDefault?: boolean
}

/**
 * Unified app action definition
 *
 * This is the single source of truth for an action.
 * Both keyboard shortcuts and command palette derive from this.
 */
export interface AppAction {
  /**
   * Unique identifier (e.g., 'toggle-movement', 'clear-all')
   */
  id: string

  /**
   * Human-readable label (e.g., 'Toggle Movement Trails')
   */
  label: string

  /**
   * Longer description of what the action does
   */
  description: string

  /**
   * Keywords for fuzzy search in command palette
   */
  keywords?: string[]

  /**
   * Icon for display (emoji or icon class)
   */
  icon?: string

  /**
   * Category for grouping
   */
  category: ActionCategory

  /**
   * Keyboard shortcut configuration (optional)
   * If not provided, action is only available via command palette
   */
  shortcut?: ShortcutConfig

  /**
   * The action to execute
   */
  action: () => void

  /**
   * Optional function to check if action is currently active/enabled
   * Used to show active state indicators in UI
   */
  isActive?: () => boolean

  /**
   * Conditional function to determine if action should be available
   * @returns true if action should be available
   */
  when?: () => boolean

  /**
   * If true, action is only shown in command palette (no keyboard shortcut even if shortcut is defined)
   * Useful for actions that have shortcuts defined but shouldn't be registered globally
   */
  commandPaletteOnly?: boolean
}

/**
 * Format a shortcut config as a display string
 * e.g., { key: 'm' } -> 'M'
 * e.g., { key: 'k', modifiers: { meta: true } } -> 'Cmd+K'
 */
export function formatShortcutDisplay(shortcut: ShortcutConfig): string {
  const parts: string[] = []

  if (shortcut.modifiers?.ctrl) parts.push('Ctrl')
  if (shortcut.modifiers?.alt) parts.push('Alt')
  if (shortcut.modifiers?.shift) parts.push('Shift')
  if (shortcut.modifiers?.meta) parts.push('Cmd')

  // Format special keys
  let key = shortcut.key
  if (key === ' ') key = 'Space'
  else if (key === 'ArrowLeft') key = '←'
  else if (key === 'ArrowRight') key = '→'
  else if (key === 'ArrowUp') key = '↑'
  else if (key === 'ArrowDown') key = '↓'
  else if (key.length === 1) key = key.toUpperCase()

  parts.push(key)

  return parts.join('+')
}
