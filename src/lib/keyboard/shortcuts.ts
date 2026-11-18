/**
 * Keyboard shortcuts
 *
 * This module registers keyboard shortcuts from the unified action registry.
 * Additional shortcuts (like alternative keys and cross-platform variants)
 * are added here.
 */

import type { BoundAction } from '#lib/app-actions/types.ts'
import { registry } from './registry'
import { appActions, findActionById } from '#lib/app-actions/index.ts'

/**
 * Create cross-platform shortcuts for both Ctrl and Meta modifiers
 * This creates both variants from a single action that uses meta
 */
function addCtrlVariant(bound: BoundAction): BoundAction[] {
  const { shortcut } = bound
  if (!shortcut.modifiers?.meta) {
    return [bound]
  }

  // Return both meta and ctrl variants
  return [
    bound,
    {
      ...bound,
      id: `${bound.id}-ctrl`,
      shortcut: { ...shortcut, modifiers: { ...shortcut.modifiers, meta: false, ctrl: true } },
    },
  ]
}

/**
 * Additional shortcuts that aren't in the registry
 * (alternative keys, platform variants, etc.)
 */
function getAdditionalShortcuts(): BoundAction[] {
  const additional: BoundAction[] = []

  // Add '+' as alternative key for speed up (in addition to '=')
  const speedUpAction = findActionById('playback-speed-up')
  if (speedUpAction) {
    additional.push({
      id: 'playback-speed-up-plus',
      shortcut: { key: '+' },
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
function buildAllShortcuts(): BoundAction[] {
  // Get shortcuts from action registry
  const registryShortcuts = appActions.filter(
    (action): action is BoundAction => action.shortcut !== undefined
  )

  // Add Ctrl variants for shortcuts that have Meta modifier
  const withCtrlVariants = registryShortcuts.flatMap(addCtrlVariant)

  // Add additional shortcuts (alternative keys, etc.)
  const additional = getAdditionalShortcuts()

  return [...withCtrlVariants, ...additional]
}

/**
 * All shortcuts combined
 */
const allShortcuts: BoundAction[] = buildAllShortcuts()

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
