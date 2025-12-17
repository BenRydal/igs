/**
 * Keyboard shortcut definition
 */
export interface KeyboardShortcut {
  /**
   * Unique identifier for the shortcut
   */
  id: string

  /**
   * The key to press (e.g., 'Space', 'd', '1', 'Escape')
   * Use KeyboardEvent.key values
   */
  key: string

  /**
   * Modifier keys required for this shortcut
   */
  modifiers?: {
    ctrl?: boolean
    alt?: boolean
    shift?: boolean
    meta?: boolean // Cmd on Mac, Windows key on Windows
  }

  /**
   * Human-readable label for the shortcut (e.g., "Play/Pause")
   */
  label: string

  /**
   * Longer description of what the shortcut does
   */
  description: string

  /**
   * Category for organizing shortcuts
   */
  category: 'playback' | 'view' | 'selection' | 'navigation' | 'data' | 'modal'

  /**
   * Function to execute when the shortcut is triggered
   */
  action: () => void

  /**
   * Whether the shortcut is currently enabled
   * @default true
   */
  enabled?: boolean

  /**
   * Conditional function to determine if shortcut should be active
   * @returns true if shortcut should be active, false otherwise
   */
  when?: () => boolean

  /**
   * Whether to prevent the default browser behavior for this shortcut
   * Set to false if you want the browser's default action to still occur
   * @default true
   */
  preventDefault?: boolean
}

/**
 * Category grouping for shortcuts
 */
export interface ShortcutCategory {
  id: string
  label: string
  shortcuts: KeyboardShortcut[]
}

/**
 * Internal representation of a keyboard event for matching
 */
export interface KeyboardEventMatch {
  key: string
  ctrl: boolean
  alt: boolean
  shift: boolean
  meta: boolean
}
