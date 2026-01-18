/**
 * Command palette adapter
 *
 * Converts AppAction definitions to Command format
 * for use with the command palette.
 */

import type { Command } from '../components/command-palette/types'
import type { AppAction } from './types'
import { formatShortcutDisplay } from './types'
import { getAllActions } from './registry'

/**
 * Convert an AppAction to a Command
 */
function actionToCommand(action: AppAction): Command {
  return {
    id: action.id,
    label: action.label,
    description: action.description,
    keywords: action.keywords,
    icon: action.icon,
    category: action.category,
    shortcut: action.shortcut ? formatShortcutDisplay(action.shortcut) : undefined,
    action: action.action,
    isActive: action.isActive,
  }
}

/**
 * Get all commands derived from actions
 */
export function getCommands(): Command[] {
  return getAllActions().map(actionToCommand)
}
