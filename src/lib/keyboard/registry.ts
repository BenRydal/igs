import type { ActionCategory, BoundAction } from '#lib/app-actions/types.ts'

export interface ShortcutCategory {
  id: string
  label: string
  shortcuts: BoundAction[]
}

const CHEATSHEET_GROUPS: { id: string; label: string; categories: ActionCategory[] }[] = [
  { id: 'playback', label: 'Playback', categories: ['playback'] },
  { id: 'view', label: 'View', categories: ['view'] },
  { id: 'selection', label: 'Selection', categories: ['selection'] },
  { id: 'navigation', label: 'Navigation', categories: ['history', 'examples'] },
  { id: 'data', label: 'Data', categories: ['filter', 'clear'] },
  { id: 'modal', label: 'Modal', categories: ['settings'] },
]

/**
 * Global keyboard shortcut registry
 */
class ShortcutRegistry {
  private shortcuts: Map<string, BoundAction> = new Map()

  /**
   * Register a new keyboard shortcut
   * @param shortcut The shortcut configuration to register
   * @throws Error if shortcut with same ID already exists
   */
  register(shortcut: BoundAction): void {
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

    this.shortcuts.set(shortcut.id, shortcut)
  }

  /**
   * Register multiple shortcuts at once
   * @param shortcuts Array of shortcut configurations
   */
  registerMany(shortcuts: BoundAction[]): void {
    shortcuts.forEach((shortcut) => this.register(shortcut))
  }

  /**
   * Get all registered shortcuts
   * @returns Array of all shortcuts
   */
  getAll(): BoundAction[] {
    return Array.from(this.shortcuts.values())
  }

  /**
   * Get all shortcuts grouped by category
   * @returns Array of category objects with their shortcuts
   */
  getCategories(): ShortcutCategory[] {
    const all = this.getAll()
    return CHEATSHEET_GROUPS.map(({ id, label, categories }) => ({
      id,
      label,
      shortcuts: all.filter((shortcut) => categories.includes(shortcut.category)),
    })).filter((cat) => cat.shortcuts.length > 0)
  }

  /**
   * Find shortcuts that have the same key combination
   * @param shortcut The shortcut to check for conflicts
   * @returns Array of conflicting shortcuts
   */
  getConflicts(shortcut: BoundAction): BoundAction[] {
    const conflicts: BoundAction[] = []

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
  private isSameKeyCombination(a: BoundAction, b: BoundAction): boolean {
    if (a.shortcut.key !== b.shortcut.key) return false

    const aModifiers = a.shortcut.modifiers || {}
    const bModifiers = b.shortcut.modifiers || {}

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
