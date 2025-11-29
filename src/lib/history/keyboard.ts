import { registry } from '$lib/keyboard'
import type { KeyboardShortcut } from '$lib/keyboard'
import { historyStore } from '../../stores/historyStore'

/**
 * Show a notification when available
 */
function showNotification(message: string): void {
  if (import.meta.env?.DEV) {
    console.log(`[History] ${message}`)
  }
}

/** Undo action - shared between Meta and Ctrl variants */
const undoAction = () => {
  const label = historyStore.undo()
  if (label) showNotification(`Undid: ${label}`)
}

/** Redo action - shared between all redo variants */
const redoAction = () => {
  const label = historyStore.redo()
  if (label) showNotification(`Redid: ${label}`)
}

/** Shortcut IDs for cleanup */
const SHORTCUT_IDS = ['undo', 'undo-ctrl', 'redo', 'redo-ctrl', 'redo-y', 'redo-y-ctrl'] as const

/**
 * Register undo/redo keyboard shortcuts using the global keyboard registry
 * Supports both Mac (Cmd) and Windows/Linux (Ctrl) modifiers
 */
export function registerUndoRedoShortcuts(): void {
  const shortcuts: KeyboardShortcut[] = [
    // Undo: Cmd+Z (Mac) and Ctrl+Z (Windows/Linux)
    {
      id: 'undo',
      key: 'z',
      modifiers: { meta: true },
      label: 'Undo',
      description: 'Undo last action',
      category: 'navigation',
      action: undoAction,
    },
    {
      id: 'undo-ctrl',
      key: 'z',
      modifiers: { ctrl: true },
      label: 'Undo',
      description: 'Undo last action',
      category: 'navigation',
      action: undoAction,
    },
    // Redo: Cmd+Shift+Z (Mac) and Ctrl+Shift+Z (Windows/Linux)
    {
      id: 'redo',
      key: 'z',
      modifiers: { meta: true, shift: true },
      label: 'Redo',
      description: 'Redo last undone action',
      category: 'navigation',
      action: redoAction,
    },
    {
      id: 'redo-ctrl',
      key: 'z',
      modifiers: { ctrl: true, shift: true },
      label: 'Redo',
      description: 'Redo last undone action',
      category: 'navigation',
      action: redoAction,
    },
    // Alternative redo: Cmd+Y (Mac) and Ctrl+Y (Windows/Linux)
    {
      id: 'redo-y',
      key: 'y',
      modifiers: { meta: true },
      label: 'Redo',
      description: 'Redo last undone action',
      category: 'navigation',
      action: redoAction,
    },
    {
      id: 'redo-y-ctrl',
      key: 'y',
      modifiers: { ctrl: true },
      label: 'Redo',
      description: 'Redo last undone action',
      category: 'navigation',
      action: redoAction,
    },
  ]

  shortcuts.forEach((shortcut) => registry.register(shortcut))
}

/**
 * Unregister undo/redo keyboard shortcuts
 */
export function unregisterUndoRedoShortcuts(): void {
  SHORTCUT_IDS.forEach((id) => registry.unregister(id))
}
