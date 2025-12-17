import type { Command, FuzzyMatch, CommandSearchResult, HighlightSegment } from './types'

/**
 * Perform fuzzy matching on a target string
 *
 * Scoring system:
 * - Start of string match: +15 points
 * - Start of word match: +10 points
 * - Consecutive character matches: +5 bonus per consecutive
 * - Case matches: +1 point
 *
 * @param query - Search query string
 * @param target - Target string to match against
 * @returns FuzzyMatch result or null if no match
 */
export function fuzzyMatch(query: string, target: string): FuzzyMatch | null {
  if (!query || !target) return null

  const queryLower = query.toLowerCase()
  const targetLower = target.toLowerCase()

  let score = 0
  let queryIndex = 0
  const indices: number[] = []
  let consecutiveMatches = 0
  let lastMatchIndex = -2

  for (let i = 0; i < targetLower.length && queryIndex < queryLower.length; i++) {
    if (targetLower[i] === queryLower[queryIndex]) {
      // Character match found
      indices.push(i)

      // Base score
      score += 1

      // Bonus for start of string
      if (i === 0) {
        score += 15
      }

      // Bonus for start of word (after space or special char)
      if (i > 0 && /[\s\-_.]/.test(targetLower[i - 1])) {
        score += 10
      }

      // Bonus for consecutive matches
      if (i === lastMatchIndex + 1) {
        consecutiveMatches++
        score += 5 * consecutiveMatches
      } else {
        consecutiveMatches = 0
      }

      // Bonus for exact case match
      if (target[i] === query[queryIndex]) {
        score += 1
      }

      lastMatchIndex = i
      queryIndex++
    }
  }

  // All query characters must match
  if (queryIndex !== queryLower.length) {
    return null
  }

  // Penalty for longer targets (prefer shorter matches)
  score -= target.length * 0.1

  return { score, indices }
}

/**
 * Search commands with fuzzy matching
 *
 * Searches command label, description, keywords, and category
 *
 * @param query - Search query string
 * @param commands - Array of commands to search
 * @returns Sorted array of command search results (highest score first)
 */
export function searchCommands(query: string, commands: Command[]): CommandSearchResult[] {
  if (!query.trim()) {
    return []
  }

  const results: CommandSearchResult[] = []

  for (const command of commands) {
    // Try matching against label (highest priority)
    let bestMatch = fuzzyMatch(query, command.label)

    // Try matching against description
    if (command.description) {
      const descMatch = fuzzyMatch(query, command.description)
      if (descMatch && (!bestMatch || descMatch.score > bestMatch.score)) {
        bestMatch = descMatch
      }
    }

    // Try matching against keywords
    if (command.keywords) {
      for (const keyword of command.keywords) {
        const keywordMatch = fuzzyMatch(query, keyword)
        if (keywordMatch && (!bestMatch || keywordMatch.score > bestMatch.score)) {
          bestMatch = keywordMatch
        }
      }
    }

    // Try matching against category
    const categoryMatch = fuzzyMatch(query, command.category)
    if (categoryMatch && (!bestMatch || categoryMatch.score > bestMatch.score * 0.5)) {
      bestMatch = categoryMatch
    }

    if (bestMatch) {
      results.push({
        command,
        match: bestMatch,
      })
    }
  }

  // Sort by score (descending)
  results.sort((a, b) => b.match.score - a.match.score)

  return results
}

/**
 * Get highlight segments for matched characters in a string
 *
 * @param text - Original text
 * @param indices - Array of character indices to highlight
 * @returns Array of highlight segments for safe rendering
 */
export function getHighlightSegments(text: string, indices: number[]): HighlightSegment[] {
  if (!indices || indices.length === 0) {
    return [{ text, highlighted: false }]
  }

  const segments: HighlightSegment[] = []
  const indicesSet = new Set(indices)
  let currentSegment: HighlightSegment | null = null

  for (let i = 0; i < text.length; i++) {
    const isHighlighted = indicesSet.has(i)

    // Start a new segment if highlighted state changes
    if (!currentSegment || currentSegment.highlighted !== isHighlighted) {
      if (currentSegment) {
        segments.push(currentSegment)
      }
      currentSegment = {
        text: text[i],
        highlighted: isHighlighted,
      }
    } else {
      // Continue current segment
      currentSegment.text += text[i]
    }
  }

  // Add the last segment
  if (currentSegment) {
    segments.push(currentSegment)
  }

  return segments
}
