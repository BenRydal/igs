import type { TourState } from './types'

const STORAGE_KEY = 'igs-tour-state'
const TOUR_VERSION = '1.0'

/**
 * Get the current tour state from localStorage
 */
export function getTourState(): TourState | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    const state = JSON.parse(stored) as TourState
    return state
  } catch (error) {
    console.error('Failed to get tour state:', error)
    return null
  }
}

/**
 * Mark the tour as completed
 */
export function setTourCompleted(): void {
  if (typeof window === 'undefined') return

  try {
    const state: TourState = {
      hasCompleted: true,
      version: TOUR_VERSION,
      completedAt: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Failed to set tour completed:', error)
  }
}

/**
 * Reset the tour state (for restarting the tour)
 */
export function resetTourState(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to reset tour state:', error)
  }
}

/**
 * Check if the tour should be shown (first visit or version mismatch)
 */
export function shouldShowTour(): boolean {
  if (typeof window === 'undefined') return false

  const state = getTourState()

  // Show tour if no state exists (first visit)
  if (!state) return true

  // Show tour if version has changed
  if (state.version !== TOUR_VERSION) return true

  // Don't show if already completed with current version
  return !state.hasCompleted
}
