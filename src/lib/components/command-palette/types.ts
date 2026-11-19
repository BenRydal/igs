import type { AppAction } from '#lib/app-actions/types.ts'

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
  command: AppAction
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
