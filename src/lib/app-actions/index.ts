/**
 * Unified Action System
 *
 * Single source of truth for all app actions.
 * Both keyboard shortcuts and command palette derive from this registry.
 */

// Types
export type { AppAction, ActionCategory, ShortcutConfig } from './types'

// Registry
export { findActionById, getCategoryLabel } from './registry'

// Keyboard adapter
export { getKeyboardShortcuts } from './keyboard-adapter'

// Command palette adapter
export { getCommands } from './command-adapter'
