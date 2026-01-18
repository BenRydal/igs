/**
 * Keyboard shortcuts
 *
 * This module registers keyboard shortcuts from the unified action registry.
 * Additional shortcuts (like alternative keys and cross-platform variants)
 * are added here.
 */

import type { KeyboardShortcut } from './types'
import { registry } from './registry'
import { getKeyboardShortcuts, findActionById } from '../app-actions'

/**
 * Create cross-platform shortcuts for both Ctrl and Meta modifiers
 * This creates both variants from a single action that uses meta
 */
function addCtrlVariant(shortcut: KeyboardShortcut): KeyboardShortcut[] {
  if (!shortcut.modifiers?.meta) {
    return [shortcut]
  }

  // Return both meta and ctrl variants
  return [
    shortcut,
    {
      ...shortcut,
      id: `${shortcut.id}-ctrl`,
      modifiers: {
        ...shortcut.modifiers,
        meta: false,
        ctrl: true,
      },
      description: shortcut.description,
    },
  ]
}

/**
 * Additional shortcuts that aren't in the registry
 * (alternative keys, platform variants, etc.)
 */
function getAdditionalShortcuts(): KeyboardShortcut[] {
  const additional: KeyboardShortcut[] = []

  // Add '+' as alternative key for speed up (in addition to '=')
  const speedUpAction = findActionById('playback-speed-up')
  if (speedUpAction) {
    additional.push({
      id: 'playback-speed-up-plus',
      key: '+',
      label: 'Speed Up',
      description: 'Increase animation playback speed (alternative key)',
      category: 'playback',
      action: speedUpAction.action,
    })
  }

  return additional
}

/**
 * Get all shortcuts from the action registry plus additional variants
 */
function buildAllShortcuts(): KeyboardShortcut[] {
  // Get shortcuts from action registry
  const registryShortcuts = getKeyboardShortcuts()

  // Add Ctrl variants for shortcuts that have Meta modifier
  const withCtrlVariants = registryShortcuts.flatMap(addCtrlVariant)

  // Add additional shortcuts (alternative keys, etc.)
  const additional = getAdditionalShortcuts()

  return [...withCtrlVariants, ...additional]
}

/**
 * All shortcuts combined
 */
export const allShortcuts: KeyboardShortcut[] = buildAllShortcuts()

/**
 * Register all IGS keyboard shortcuts with the global registry
 * Call this function once during app initialization
 */
export function registerAllShortcuts(): void {
  try {
    registry.registerMany(allShortcuts)
    console.log(`Registered ${allShortcuts.length} keyboard shortcuts`)
  } catch (error) {
    console.error('Failed to register shortcuts:', error)
    throw error
  }
}

/**
 * Unregister all IGS keyboard shortcuts
 * Useful for cleanup or hot module replacement
 */
export function unregisterAllShortcuts(): void {
  allShortcuts.forEach((shortcut) => {
    registry.unregister(shortcut.id)
  })
  console.log(`Unregistered ${allShortcuts.length} keyboard shortcuts`)
}
