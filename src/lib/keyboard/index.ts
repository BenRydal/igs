/**
 * Keyboard shortcut registry and handler
 *
 * This module provides a global keyboard shortcut system for the IGS application.
 *
 * @example
 * ```typescript
 * import { registry, attachKeyboardHandler } from '#lib/keyboard/index.ts';
 *
 * // Register a shortcut
 * registry.register({
 *   id: 'play-pause',
 *   shortcut: { key: ' ' },
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
export { attachKeyboardHandler } from './handler'
export type { ShortcutCategory } from './registry'
export { registerAllShortcuts } from './shortcuts'
