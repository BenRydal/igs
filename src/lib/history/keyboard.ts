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
const SHORTCUT_IDS = ['undo', 'redo', 'redo-y'] as const

/**
 * Check if the current platform is Mac
 */
function isMac(): boolean {
  if (typeof navigator === 'undefined') return false
  return navigator.platform.includes('Mac') || navigator.userAgent.includes('Mac')
}

/**
 * Register undo/redo keyboard shortcuts using the global keyboard registry
 * Registers platform-appropriate shortcuts (Cmd for Mac, Ctrl for Windows/Linux)
 */
export function registerUndoRedoShortcuts(): void {
  const useMeta = isMac()

  const shortcuts: KeyboardShortcut[] = [
    // Undo: Cmd+Z (Mac) or Ctrl+Z (Windows/Linux)
    {
      id: 'undo',
      key: 'z',
      modifiers: useMeta ? { meta: true } : { ctrl: true },
      label: 'Undo',
      description: 'Undo last action',
      category: 'navigation',
      action: undoAction,
    },
    // Redo: Cmd+Shift+Z (Mac) or Ctrl+Shift+Z (Windows/Linux)
    {
      id: 'redo',
      key: 'z',
      modifiers: useMeta ? { meta: true, shift: true } : { ctrl: true, shift: true },
      label: 'Redo',
      description: 'Redo last undone action',
      category: 'navigation',
      action: redoAction,
    },
    // Alternative redo: Cmd+Y (Mac) or Ctrl+Y (Windows/Linux)
    {
      id: 'redo-y',
      key: 'y',
      modifiers: useMeta ? { meta: true } : { ctrl: true },
      label: 'Redo (Alt)',
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
