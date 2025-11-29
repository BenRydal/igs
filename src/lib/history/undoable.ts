import { historyStore } from '../../stores/historyStore'

/**
 * Generic undoable action wrapper
 * Use this when you need to create a custom undoable action
 */
export function undoable(
  actionType: string,
  actionLabel: string,
  execute: () => void,
  undo: () => void,
  redo?: () => void
): void {
  execute()

  historyStore.push({
    actionType,
    actionLabel,
    undo,
    redo: redo || execute,
  })
}

/**
 * Get undo/redo capabilities
 */
export { historyStore }
