/**
 * History and undo/redo system for IGS
 *
 * This module provides an event-sourcing based undo/redo system that works
 * with Svelte stores. Actions are recorded as closure-based functions rather
 * than state snapshots for memory efficiency.
 *
 * @example Basic usage
 * ```typescript
 * import { toggleMovement, setAnimationRate } from '$lib/history';
 *
 * // Make an undoable change
 * toggleMovement(); // Uses the config-actions helper
 * setAnimationRate(0.1); // Automatically debounced for sliders
 * ```
 *
 * @example Using keyboard shortcuts
 * ```typescript
 * import { registerUndoRedoShortcuts } from '$lib/history';
 *
 * // In your root component
 * onMount(() => {
 *   registerUndoRedoShortcuts();
 * });
 * ```
 */

/**
 * Deep clone utility for undo/redo state preservation
 * Uses structuredClone if available, otherwise JSON parse/stringify
 */
export function deepClone<T>(obj: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj)
  }
  return JSON.parse(JSON.stringify(obj)) as T
}

// Store and types
export { historyStore, canUndo, canRedo } from '../../stores/historyStore'
export type {
  UndoableAction,
  HistoryEntry,
  HistoryAction,
  HistoryState,
} from '../../stores/historyStore'

// Generic undoable action wrapper
export * from './undoable'

// Pre-built action helpers
export * from './config-actions'
export * from './user-actions'
export * from './data-actions'

// Keyboard shortcuts
export * from './keyboard'
