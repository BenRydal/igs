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
 *
 * @example Transactions
 * ```typescript
 * import { historyStore } from '$lib/history';
 *
 * // Group multiple operations into one undo/redo action
 * historyStore.beginTransaction();
 * // ... perform multiple undoable operations ...
 * historyStore.commitTransaction('Reset all settings');
 * ```
 */

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
