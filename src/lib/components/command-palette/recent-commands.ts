/**
 * Recent command tracking using localStorage
 */

const STORAGE_KEY = 'igs-recent-commands'
const MAX_RECENT = 5

/**
 * Recent command entry with usage metadata
 */
export interface RecentCommandEntry {
  /**
   * Command ID
   */
  id: string

  /**
   * Timestamp of last use (ISO string)
   */
  lastUsed: string

  /**
   * Total number of times this command has been used
   */
  useCount: number
}

/**
 * Get all recent commands from localStorage
 *
 * @returns Array of recent command entries, sorted by lastUsed (newest first)
 */
export function getRecentCommands(): RecentCommandEntry[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const entries: RecentCommandEntry[] = JSON.parse(stored)

    // Sort by lastUsed descending (most recent first)
    entries.sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())

    return entries.slice(0, MAX_RECENT)
  } catch (error) {
    console.error('Failed to load recent commands:', error)
    return []
  }
}

/**
 * Add a command to the recent commands list
 *
 * If the command already exists, updates its lastUsed timestamp and increments useCount.
 * Maintains a maximum of MAX_RECENT entries.
 *
 * @param commandId - The command ID to add
 */
export function addRecentCommand(commandId: string): void {
  if (typeof window === 'undefined') return

  try {
    const recent = getRecentCommands()
    const now = new Date().toISOString()

    // Find existing entry
    const existingIndex = recent.findIndex((entry) => entry.id === commandId)

    if (existingIndex !== -1) {
      // Update existing entry
      const existing = recent[existingIndex]
      recent[existingIndex] = {
        id: commandId,
        lastUsed: now,
        useCount: existing.useCount + 1,
      }
    } else {
      // Add new entry
      recent.unshift({
        id: commandId,
        lastUsed: now,
        useCount: 1,
      })
    }

    // Keep only MAX_RECENT entries
    const trimmed = recent.slice(0, MAX_RECENT)

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch (error) {
    console.error('Failed to save recent command:', error)
  }
}

/**
 * Clear all recent commands
 */
export function clearRecentCommands(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear recent commands:', error)
  }
}
