import type { KeyboardShortcut, ShortcutCategory } from './types'

/**
 * Global keyboard shortcut registry
 */
class ShortcutRegistry {
  private shortcuts: Map<string, KeyboardShortcut> = new Map()

  /**
   * Register a new keyboard shortcut
   * @param shortcut The shortcut configuration to register
   * @throws Error if shortcut with same ID already exists
   */
  register(shortcut: KeyboardShortcut): void {
    if (this.shortcuts.has(shortcut.id)) {
      throw new Error(`Shortcut with id "${shortcut.id}" is already registered`)
    }

    // Check for conflicts
    const conflicts = this.getConflicts(shortcut)
    if (conflicts.length > 0) {
      console.warn(
        `Shortcut "${shortcut.id}" conflicts with existing shortcuts: ${conflicts.map((s) => s.id).join(', ')}`,
        '\nExisting:',
        conflicts,
        '\nNew:',
        shortcut
      )
    }

    this.shortcuts.set(shortcut.id, {
      ...shortcut,
      enabled: shortcut.enabled !== false, // Default to true
    })
  }

  /**
   * Register multiple shortcuts at once
   * @param shortcuts Array of shortcut configurations
   */
  registerMany(shortcuts: KeyboardShortcut[]): void {
    shortcuts.forEach((shortcut) => this.register(shortcut))
  }

  /**
   * Get all registered shortcuts
   * @returns Array of all shortcuts
   */
  getAll(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values())
  }

  /**
   * Get all shortcuts grouped by category
   * @returns Array of category objects with their shortcuts
   */
  getCategories(): ShortcutCategory[] {
    const categories: Record<string, ShortcutCategory> = {
      playback: { id: 'playback', label: 'Playback', shortcuts: [] },
      view: { id: 'view', label: 'View', shortcuts: [] },
      selection: { id: 'selection', label: 'Selection', shortcuts: [] },
      navigation: { id: 'navigation', label: 'Navigation', shortcuts: [] },
      data: { id: 'data', label: 'Data', shortcuts: [] },
      modal: { id: 'modal', label: 'Modal', shortcuts: [] },
    }

    this.shortcuts.forEach((shortcut) => {
      if (categories[shortcut.category]) {
        categories[shortcut.category].shortcuts.push(shortcut)
      }
    })

    return Object.values(categories).filter((cat) => cat.shortcuts.length > 0)
  }

  /**
   * Find shortcuts that have the same key combination
   * @param shortcut The shortcut to check for conflicts
   * @returns Array of conflicting shortcuts
   */
  getConflicts(shortcut: KeyboardShortcut): KeyboardShortcut[] {
    const conflicts: KeyboardShortcut[] = []

    this.shortcuts.forEach((existing) => {
      if (existing.id === shortcut.id) return

      if (this.isSameKeyCombination(existing, shortcut)) {
        conflicts.push(existing)
      }
    })

    return conflicts
  }

  /**
   * Check if two shortcuts have the same key combination
   * @param a First shortcut
   * @param b Second shortcut
   * @returns true if key combinations match
   */
  private isSameKeyCombination(a: KeyboardShortcut, b: KeyboardShortcut): boolean {
    if (a.key !== b.key) return false

    const aModifiers = a.modifiers || {}
    const bModifiers = b.modifiers || {}

    return (
      !!aModifiers.ctrl === !!bModifiers.ctrl &&
      !!aModifiers.alt === !!bModifiers.alt &&
      !!aModifiers.shift === !!bModifiers.shift &&
      !!aModifiers.meta === !!bModifiers.meta
    )
  }
}

/**
 * Singleton instance of the shortcut registry
 */
export const registry = new ShortcutRegistry()
