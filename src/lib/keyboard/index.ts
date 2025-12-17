/**
 * Keyboard shortcut registry and handler
 *
 * This module provides a global keyboard shortcut system for the IGS application.
 *
 * @example
 * ```typescript
 * import { registry, attachKeyboardHandler } from '$lib/keyboard';
 *
 * // Register a shortcut
 * registry.register({
 *   id: 'play-pause',
 *   key: ' ',
 *   label: 'Play/Pause',
 *   description: 'Toggle animation playback',
 *   category: 'playback',
 *   action: () => togglePlayback()
 * });
 *
 * // Attach the global handler (do this once in your root component)
 * attachKeyboardHandler();
 * ```
 */

export { registry } from './registry'
export { attachKeyboardHandler, detachKeyboardHandler, isHandlerAttached } from './handler'
export type { KeyboardShortcut, ShortcutCategory, KeyboardEventMatch } from './types'
export {
  registerAllShortcuts,
  unregisterAllShortcuts,
  playbackShortcuts,
  viewShortcuts,
  selectionShortcuts,
  dataShortcuts,
  modalShortcuts,
  allShortcuts,
} from './shortcuts'
