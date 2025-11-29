import type { KeyboardShortcut, KeyboardEventMatch } from './types'
import { registry } from './registry'

/**
 * Elements that should ignore keyboard shortcuts when focused
 */
const IGNORED_ELEMENTS = ['INPUT', 'TEXTAREA', 'SELECT']

/**
 * Check if the current active element should ignore keyboard shortcuts
 * @returns true if shortcuts should be ignored
 */
function shouldIgnoreEvent(): boolean {
  const activeElement = document.activeElement
  if (!activeElement) return false

  // Ignore if focused on input elements
  if (IGNORED_ELEMENTS.includes(activeElement.tagName)) {
    return true
  }

  // Ignore if element is contenteditable
  if (activeElement.hasAttribute('contenteditable')) {
    return true
  }

  return false
}

/**
 * Convert a KeyboardEvent to a normalized event match object
 * @param event The keyboard event
 * @returns Normalized event match object
 */
function eventToMatch(event: KeyboardEvent): KeyboardEventMatch {
  return {
    key: event.key,
    ctrl: event.ctrlKey,
    alt: event.altKey,
    shift: event.shiftKey,
    meta: event.metaKey,
  }
}

/**
 * Check if a keyboard event matches a shortcut definition
 * @param event The keyboard event
 * @param shortcut The shortcut to match against
 * @returns true if the event matches the shortcut
 */
function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  // Check key match
  if (event.key !== shortcut.key) return false

  const modifiers = shortcut.modifiers || {}

  // Check all modifiers
  if (!!event.ctrlKey !== !!modifiers.ctrl) return false
  if (!!event.altKey !== !!modifiers.alt) return false
  if (!!event.shiftKey !== !!modifiers.shift) return false
  if (!!event.metaKey !== !!modifiers.meta) return false

  return true
}

/**
 * Find and execute a matching shortcut for a keyboard event
 * @param event The keyboard event
 * @returns true if a shortcut was executed, false otherwise
 */
function handleKeyboardEvent(event: KeyboardEvent): boolean {
  // Ignore if focused on input elements
  if (shouldIgnoreEvent()) {
    return false
  }

  // Find matching shortcuts
  const shortcuts = registry.getAll()

  for (const shortcut of shortcuts) {
    // Skip if shortcut is disabled
    if (shortcut.enabled === false) {
      continue
    }

    // Skip if "when" condition is not met
    if (shortcut.when && !shortcut.when()) {
      continue
    }

    // Check if event matches this shortcut
    if (matchesShortcut(event, shortcut)) {
      // Prevent default browser behavior unless explicitly disabled
      if (shortcut.preventDefault !== false) {
        event.preventDefault()
        event.stopPropagation()
      }

      try {
        shortcut.action()
      } catch (error) {
        console.error(`Error executing shortcut "${shortcut.id}":`, error)
      }

      return true
    }
  }

  return false
}

/**
 * Global keyboard event handler
 */
let isAttached = false
const keydownHandler = (event: KeyboardEvent) => {
  handleKeyboardEvent(event)
}

/**
 * Attach the global keyboard shortcut handler
 * Call this once when your app initializes
 */
export function attachKeyboardHandler(): void {
  if (isAttached) {
    console.warn('Keyboard handler is already attached')
    return
  }

  document.addEventListener('keydown', keydownHandler)
  isAttached = true
}

/**
 * Detach the global keyboard shortcut handler
 * Call this when cleaning up (e.g., component unmount)
 */
export function detachKeyboardHandler(): void {
  if (!isAttached) {
    console.warn('Keyboard handler is not attached')
    return
  }

  document.removeEventListener('keydown', keydownHandler)
  isAttached = false
}

/**
 * Check if the keyboard handler is currently attached
 * @returns true if handler is attached
 */
export function isHandlerAttached(): boolean {
  return isAttached
}
