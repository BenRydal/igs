/**
 * Command definition for the command palette
 */
export interface Command {
  /**
   * Unique identifier for the command
   */
  id: string

  /**
   * Display label for the command
   */
  label: string

  /**
   * Optional description shown below the label
   */
  description?: string

  /**
   * Keywords for fuzzy search matching
   * e.g., ['trail', 'path', 'line'] for movement toggle
   */
  keywords?: string[]

  /**
   * Optional icon (can be emoji or icon class)
   */
  icon?: string

  /**
   * Category for grouping commands
   */
  category: 'filter' | 'selection' | 'view' | 'clear' | 'examples' | 'playback' | 'settings'

  /**
   * Optional keyboard shortcut display (e.g., "Space", "Cmd+K")
   */
  shortcut?: string

  /**
   * Action to execute when command is selected
   */
  action: () => void

  /**
   * Optional function to check if command is currently active/enabled
   * Used to show active state indicators
   */
  isActive?: () => boolean
}

/**
 * Grouped commands by category
 */
export interface CommandGroup {
  /**
   * Unique identifier for the group
   */
  id: string

  /**
   * Display label for the group
   */
  label: string

  /**
   * Commands in this group
   */
  commands: Command[]
}

/**
 * Fuzzy search match result
 */
export interface FuzzyMatch {
  /**
   * Match score (higher is better)
   */
  score: number

  /**
   * Indices of matched characters in the target string
   */
  indices: number[]
}

/**
 * Command search result with score
 */
export interface CommandSearchResult {
  command: Command
  match: FuzzyMatch
}

/**
 * Highlight segment for safe text rendering
 */
export interface HighlightSegment {
  /**
   * Text content of this segment
   */
  text: string

  /**
   * Whether this segment should be highlighted
   */
  highlighted: boolean
}
