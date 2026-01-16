/**
 * GPX file parser for IGS
 *
 * Parses GPX (GPS Exchange Format) files using browser's native DOMParser.
 * Converts GPX tracks to GPSMovementRow[] for the existing GPS processing pipeline.
 */

import type { GPSMovementRow } from '../core/types'
import { TimeUtils } from '../core/time-utils'

interface GPXTrackPoint {
  lat: number
  lon: number
  time: string | null
}

export interface GPXTrack {
  name: string
  points: GPXTrackPoint[]
}

export interface GPXParseResult {
  success: boolean
  tracks: GPXTrack[]
  warnings: string[]
  error?: string
}

const errorResult = (error: string, warnings: string[] = []): GPXParseResult => ({
  success: false,
  tracks: [],
  warnings,
  error,
})

export class GPXParser {
  /**
   * Parse GPX file content and extract tracks
   */
  static parse(gpxContent: string, fileName: string): GPXParseResult {
    const warnings: string[] = []

    const doc = new DOMParser().parseFromString(gpxContent, 'application/xml')

    if (doc.querySelector('parsererror')) {
      return errorResult('Invalid GPX file: XML parsing failed. Please check the file format.')
    }

    const gpxElement = doc.querySelector('gpx')
    if (!gpxElement) {
      return errorResult('Invalid GPX file: Missing <gpx> root element.')
    }

    const trkElements = gpxElement.querySelectorAll('trk')
    if (trkElements.length === 0) {
      return errorResult('No tracks (<trk>) found in GPX file.')
    }

    const tracks: GPXTrack[] = []

    trkElements.forEach((trk, index) => {
      const nameEl = trk.querySelector('name')
      const trackName =
        nameEl?.textContent?.trim() ||
        (trkElements.length === 1 ? fileName : `${fileName}-track${index + 1}`)

      const points: GPXTrackPoint[] = []
      const allTrkpts = trk.querySelectorAll('trkseg trkpt')

      allTrkpts.forEach((trkpt) => {
        const latStr = trkpt.getAttribute('lat')
        const lonStr = trkpt.getAttribute('lon')
        if (!latStr || !lonStr) return

        const lat = parseFloat(latStr)
        const lon = parseFloat(lonStr)
        if (isNaN(lat) || isNaN(lon)) return

        const timeEl = trkpt.querySelector('time')
        points.push({
          lat,
          lon,
          time: timeEl?.textContent?.trim() || null,
        })
      })

      const skippedCount = allTrkpts.length - points.length
      if (skippedCount > 0) {
        warnings.push(
          `Track "${trackName}": ${skippedCount} point${skippedCount > 1 ? 's' : ''} skipped due to missing or invalid coordinates`
        )
      }

      if (points.length === 0) {
        warnings.push(`Track "${trackName}" has no valid trackpoints`)
        return
      }

      const pointsWithTime = points.filter((p) => p.time !== null).length
      if (pointsWithTime === 0) {
        // Skip tracks without timestamps - IGS requires time data for space-time visualization
        warnings.push(`Track "${trackName}" skipped - no timestamps found`)
        return
      } else if (pointsWithTime < points.length) {
        warnings.push(
          `Track "${trackName}": ${points.length - pointsWithTime} of ${points.length} points missing timestamps`
        )
      }

      tracks.push({ name: trackName, points })
    })

    if (tracks.length === 0) {
      return errorResult(
        'No tracks with timestamps found. IGS requires timestamped GPS data for space-time visualization.',
        warnings
      )
    }

    return { success: true, tracks, warnings }
  }

  /**
   * Convert GPX track to GPSMovementRow[] format
   */
  static toGPSMovementRows(track: GPXTrack): GPSMovementRow[] {
    // Parse all timestamps once and find the minimum
    const parsedTimes = track.points.map((p) =>
      p.time ? TimeUtils.parseISO8601(p.time) : null
    )
    const firstTimestamp = parsedTimes.reduce<number | null>(
      (min, t) => (t !== null && (min === null || t < min) ? t : min),
      null
    )

    let syntheticTime = 0

    return track.points.map((point, i) => {
      let time: number
      const parsedTime = parsedTimes[i]

      if (parsedTime !== null && firstTimestamp !== null) {
        time = parsedTime - firstTimestamp
      } else {
        time = syntheticTime++
      }

      return {
        time,
        lat: point.lat,
        lng: point.lon,
      }
    })
  }
}
