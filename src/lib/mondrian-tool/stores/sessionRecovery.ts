import { get } from 'svelte/store'
import { drawingState, type PathData } from './drawingState'
import { drawingConfig, type RotationAngle } from './drawingConfig'

const STORAGE_KEY = 'mondrian-session'
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Check if paths contain any recorded data
 */
export function hasRecordedData(paths: PathData[]): boolean {
  return paths.some((p) => p.points.length > 0)
}

export interface SavedSession {
  paths: PathData[]
  videoTime: number
  config: {
    isTranscriptionMode: boolean
    pollingRate: number
    heartbeatInterval?: number // optional for backwards compatibility
    useAdaptiveSampling?: boolean // optional for backwards compatibility
    strokeWeight: number
    speculateScale: number
    isContinuousMode: boolean
    floorPlanRotation?: RotationAngle // optional for backwards compatibility
  }
  floorPlanDataUrl: string | null
  imageWidth: number
  imageHeight: number
  timestamp: number
}

/**
 * Save current session to localStorage
 * Called automatically when paths change (debounced)
 * If floor plan is too large, saves paths without it
 */
export function saveSession(floorPlanDataUrl: string | null = null): boolean {
  const state = get(drawingState)
  const config = get(drawingConfig)

  // Only save if there's actual data
  if (!hasRecordedData(state.paths)) {
    return false
  }

  const baseSession = {
    paths: state.paths,
    videoTime: state.videoTime,
    config: {
      isTranscriptionMode: config.isTranscriptionMode,
      pollingRate: config.pollingRate,
      heartbeatInterval: config.heartbeatInterval,
      useAdaptiveSampling: config.useAdaptiveSampling,
      strokeWeight: config.strokeWeight,
      speculateScale: config.speculateScale,
      isContinuousMode: config.isContinuousMode,
      floorPlanRotation: config.floorPlanRotation,
    },
    imageWidth: state.imageWidth,
    imageHeight: state.imageHeight,
    timestamp: Date.now(),
  }

  // Try to save with floor plan first
  if (floorPlanDataUrl) {
    try {
      const sessionWithImage: SavedSession = { ...baseSession, floorPlanDataUrl }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionWithImage))
      return true
    } catch (e) {
      // Floor plan too large - fall through to save without it
      console.warn('Floor plan too large for localStorage, saving paths only')
    }
  }

  // Save without floor plan (either not provided or too large)
  try {
    const sessionWithoutImage: SavedSession = { ...baseSession, floorPlanDataUrl: null }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionWithoutImage))
    return true
  } catch (e) {
    // Storage full or disabled - fail silently
    console.warn('Failed to save session:', e)
    return false
  }
}

/**
 * Check if a recoverable session exists
 */
export function getRecoverableSession(): SavedSession | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return null

    const session: SavedSession = JSON.parse(saved)

    // Check if session is too old
    const age = Date.now() - session.timestamp
    if (age > SESSION_MAX_AGE) {
      clearSavedSession()
      return null
    }

    // Check if there's actual data worth recovering
    if (!hasRecordedData(session.paths)) {
      clearSavedSession()
      return null
    }

    return session
  } catch (e) {
    console.warn('Failed to read saved session:', e)
    return null
  }
}

/**
 * Clear saved session (after export or user dismisses recovery)
 */
export function clearSavedSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) {
    console.warn('Failed to clear session:', e)
  }
}

/**
 * Get human-readable time since session was saved
 */
export function getSessionAge(timestamp: number): string {
  const minutes = Math.floor((Date.now() - timestamp) / 60000)

  if (minutes < 1) return 'just now'
  if (minutes === 1) return '1 minute ago'
  if (minutes < 60) return `${minutes} minutes ago`

  const hours = Math.floor(minutes / 60)
  if (hours === 1) return '1 hour ago'
  if (hours < 24) return `${hours} hours ago`

  return 'over a day ago'
}

/**
 * Get total point count across all paths
 */
export function getTotalPointCount(paths: PathData[]): number {
  return paths.reduce((sum, path) => sum + path.points.length, 0)
}

/**
 * Simple debounce utility for auto-save
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }
}
