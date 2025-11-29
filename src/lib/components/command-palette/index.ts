/**
 * Command Palette
 *
 * A comprehensive command palette system for IGS with:
 * - Fuzzy search across 50+ commands
 * - Keyboard navigation (Cmd+K to open, Arrow keys, Enter)
 * - Recent commands tracking
 * - Grouped results by category
 * - Active state indicators
 *
 * @module command-palette
 */

export { default as CommandPalette } from './CommandPalette.svelte'

export type {
  Command,
  CommandGroup,
  FuzzyMatch,
  CommandSearchResult,
  HighlightSegment,
} from './types'

export { fuzzyMatch, searchCommands, getHighlightSegments } from './fuzzy-search'

export {
  getRecentCommands,
  addRecentCommand,
  clearRecentCommands,
  type RecentCommandEntry,
} from './recent-commands'

export {
  getAllCommands,
  getCommandsByCategory,
  findCommandById,
  getCategoryLabel,
} from './commands'
