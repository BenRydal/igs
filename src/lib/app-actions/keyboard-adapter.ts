/**
 * Keyboard adapter
 *
 * Converts AppAction definitions to KeyboardShortcut format
 * for use with the keyboard shortcut registry.
 */

import type { KeyboardShortcut } from '../keyboard/types'
import type { AppAction, ActionCategory } from './types'
import { getAllActions } from './registry'

/**
 * Map action categories to keyboard shortcut categories
 */
const categoryMap: Record<ActionCategory, KeyboardShortcut['category']> = {
  filter: 'data',
  selection: 'selection',
  view: 'view',
  playback: 'playback',
  clear: 'data', // Clear actions don't typically have shortcuts, but map to data
  examples: 'navigation', // Examples don't typically have shortcuts
  settings: 'modal',
}

/**
 * Convert an AppAction to a KeyboardShortcut
 * Returns null for actions without shortcuts or marked as commandPaletteOnly
 */
function actionToKeyboardShortcut(action: AppAction): KeyboardShortcut | null {
  if (!action.shortcut || action.commandPaletteOnly) {
    return null
  }

  return {
    id: action.id,
    key: action.shortcut.key,
    modifiers: action.shortcut.modifiers,
    label: action.label,
    description: action.description,
    category: categoryMap[action.category],
    action: action.action,
    when: action.when,
    preventDefault: action.shortcut.preventDefault,
  }
}

/**
 * Get all keyboard shortcuts derived from actions
 *
 * This returns shortcuts for actions that have a `shortcut` config
 * and are not marked as `commandPaletteOnly`.
 */
export function getKeyboardShortcuts(): KeyboardShortcut[] {
  return getAllActions()
    .map(actionToKeyboardShortcut)
    .filter((shortcut): shortcut is KeyboardShortcut => shortcut !== null)
}
