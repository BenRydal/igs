/**
 * Timeline Store
 *
 * Svelte store for managing timeline state with zoom and pan.
 */

import { writable, derived } from 'svelte/store'
import type { TimelineState } from './types'
import { clamp, mapRange } from './utils'

/** Initial empty state */
const initialState: TimelineState = {
  // Time bounds
  dataStart: 0,
  dataEnd: 0,

  // View window (controls playback bounds)
  viewStart: 0,
  viewEnd: 0,

  // Playhead
  currentTime: 0,

  // Pixel bounds
  leftX: 0,
  rightX: 0,
}

function createTimelineStore() {
  const { subscribe, update } = writable<TimelineState>(initialState)

  /**
   * Synchronous mirror of the store's value.
   *
   * The coordinate-conversion methods below are called once per data point, per
   * view, per frame by the draw layer, and `get({ subscribe })` both allocates a
   * store-shaped object literal and runs a full subscribe/notify/unsubscribe
   * cycle on every call — three times over for pixelToViewPixel and overAxis. A
   * writable notifies its subscribers synchronously on set/update, so this
   * mirror is always exactly as current as a `get()` would be.
   */
  let current: TimelineState = initialState
  subscribe((s) => {
    current = s
  })

  // Configuration

  return {
    subscribe,

    /**
     * Initialize timeline with data range
     */
    initialize(endTime: number, startTime: number = 0) {
      update((s) => ({
        ...s,
        dataStart: startTime,
        dataEnd: endTime,
        viewStart: startTime,
        viewEnd: endTime,
        currentTime: startTime,
      }))
    },

    // ==================== Playhead ====================

    /**
     * Set current playhead time
     */
    setCurrentTime(time: number) {
      update((s) => ({
        ...s,
        currentTime: clamp(time, s.dataStart, s.dataEnd),
      }))
    },

    // ==================== View (Zoom/Pan) ====================

    /**
     * Set view window directly
     */
    setView(start: number, end: number) {
      update((s) => ({
        ...s,
        viewStart: clamp(start, s.dataStart, s.dataEnd),
        viewEnd: clamp(end, s.dataStart, s.dataEnd),
      }))
    },

    // ==================== UI State ====================

    // ==================== Pixel Bounds ====================

    /**
     * Update pixel positions (called when timeline canvas resizes)
     */
    updateXPositions(leftX: number, rightX: number) {
      update((s) => ({ ...s, leftX, rightX }))
    },

    // ==================== Coordinate Conversion ====================

    /**
     * Convert pixel position to time (full data range)
     */
    pixelToTime(pixel: number): number {
      const s = current
      return mapRange(pixel, s.leftX, s.rightX, s.dataStart, s.dataEnd)
    },

    /**
     * Convert time to pixel position (full data range)
     */
    timeToPixel(time: number): number {
      const s = current
      return mapRange(time, s.dataStart, s.dataEnd, s.leftX, s.rightX)
    },

    /**
     * Get view start pixel position
     */
    getViewStartPixel(): number {
      const s = current
      return mapRange(s.viewStart, s.dataStart, s.dataEnd, s.leftX, s.rightX)
    },

    /**
     * Get view end pixel position
     */
    getViewEndPixel(): number {
      const s = current
      return mapRange(s.viewEnd, s.dataStart, s.dataEnd, s.leftX, s.rightX)
    },

    /**
     * Convert timeline pixel to view-space pixel
     */
    pixelToViewPixel(pixel: number): number {
      const s = current
      const viewStartPx = this.getViewStartPixel()
      const viewEndPx = this.getViewEndPixel()
      return mapRange(pixel, s.leftX, s.rightX, viewStartPx, viewEndPx)
    },

    /**
     * Convert view-space pixel to timeline pixel
     */
    viewPixelToPixel(pixel: number): number {
      const s = current
      const viewStartPx = this.getViewStartPixel()
      const viewEndPx = this.getViewEndPixel()
      return mapRange(pixel, viewStartPx, viewEndPx, s.leftX, s.rightX)
    },

    /**
     * Check if pixel value is within view range
     */
    overAxis(pixel: number): boolean {
      const viewStartPx = this.getViewStartPixel()
      const viewEndPx = this.getViewEndPixel()
      return pixel >= viewStartPx && pixel <= viewEndPx
    },

    // ==================== Helpers ====================

    /**
     * Get current state snapshot
     */
    getState(): TimelineState {
      return current
    },
  }
}

// Export singleton store
export const timelineV2Store = createTimelineStore()

// ==================== Derived Stores ====================

/** Current view duration */
const viewDuration = derived(timelineV2Store, ($t) => $t.viewEnd - $t.viewStart)

/** Total data duration */
const dataDuration = derived(timelineV2Store, ($t) => $t.dataEnd - $t.dataStart)

/** Current zoom level (1 = no zoom, >1 = zoomed in) */
export const zoomLevel = derived([dataDuration, viewDuration], ([$data, $view]) =>
  $view > 0 ? $data / $view : 1
)

/** Whether timeline is zoomed */
export const isZoomed = derived(zoomLevel, ($z) => $z > 1.01)
