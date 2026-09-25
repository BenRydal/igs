import type { KeyboardShortcut } from './types'
import { registry } from './registry'
import { redrawCanvas } from '../utils/p5'
import { get } from 'svelte/store'
import { activeTool } from '../mondrian-bridge/tool'

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

        // Trigger P5 redraw after shortcut execution to ensure UI updates immediately
        // This fixes the issue where keyboard shortcuts don't update the screen until mouse movement
        redrawCanvas()
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
  // Mondrian has its own shortcuts; IGS's stay out of the way while it is showing.
  if (get(activeTool) !== 'igs') return
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
