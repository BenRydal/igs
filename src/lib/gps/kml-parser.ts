/**
 * KML file parser for IGS
 *
 * Parses KML (Keyhole Markup Language) files using browser's native DOMParser.
 * Supports both LineString (no timestamps) and gx:Track (with timestamps) formats.
 * Converts KML tracks to GPSMovementRow[] for the existing GPS processing pipeline.
 */

import type { GPSMovementRow } from '../core/types'
import { TimeUtils } from '../core/time-utils'

const GX_NAMESPACE = 'http://www.google.com/kml/ext/2.2'

interface KMLTrackPoint {
  lat: number
  lon: number
  time: string | null
}

export interface KMLTrack {
  name: string
  points: KMLTrackPoint[]
}

export interface KMLParseResult {
  success: boolean
  tracks: KMLTrack[]
  warnings: string[]
  error?: string
}

const errorResult = (error: string, warnings: string[] = []): KMLParseResult => ({
  success: false,
  tracks: [],
  warnings,
  error,
})

/**
 * Parse LineString coordinates: "lon,lat,alt lon,lat,alt ..."
 * Note: KML uses longitude,latitude order (opposite of GPX)
 */
function parseLineStringCoords(coordStr: string): KMLTrackPoint[] {
  const points: KMLTrackPoint[] = []
  const coordPairs = coordStr.trim().split(/\s+/)

  for (const pair of coordPairs) {
    if (!pair) continue
    const parts = pair.split(',')
    if (parts.length < 2) continue

    const lon = parseFloat(parts[0])
    const lat = parseFloat(parts[1])
    if (isNaN(lon) || isNaN(lat)) continue

    points.push({ lat, lon, time: null })
  }

  return points
}

/**
 * Parse gx:coord value: "lon lat alt" (space-separated)
 */
function parseGxCoord(coordStr: string): { lat: number; lon: number } | null {
  const parts = coordStr.trim().split(/\s+/)
  if (parts.length < 2) return null

  const lon = parseFloat(parts[0])
  const lat = parseFloat(parts[1])
  if (isNaN(lon) || isNaN(lat)) return null

  return { lat, lon }
}

/**
 * Extract gx:Track from a placemark (timestamped track format)
 */
function extractGxTrack(placemark: Element): KMLTrackPoint[] {
  const gxTrack = placemark.getElementsByTagNameNS(GX_NAMESPACE, 'Track')[0]
  if (!gxTrack) return []

  const whenElements = gxTrack.getElementsByTagName('when')
  const coordElements = gxTrack.getElementsByTagNameNS(GX_NAMESPACE, 'coord')

  const points: KMLTrackPoint[] = []
  const count = Math.min(whenElements.length, coordElements.length)

  for (let i = 0; i < count; i++) {
    const coord = parseGxCoord(coordElements[i]?.textContent || '')
    if (!coord) continue

    points.push({
      lat: coord.lat,
      lon: coord.lon,
      time: whenElements[i]?.textContent?.trim() || null,
    })
  }

  return points
}

/**
 * Extract all LineString coordinates from a placemark (handles both direct and MultiGeometry)
 */
function extractLineStrings(placemark: Element): KMLTrackPoint[] {
  const points: KMLTrackPoint[] = []

  for (const lineString of placemark.querySelectorAll('LineString')) {
    const coords = lineString.querySelector('coordinates')?.textContent
    if (coords) points.push(...parseLineStringCoords(coords))
  }

  return points
}

export class KMLParser {
  /**
   * Parse KML file content and extract tracks
   */
  static parse(kmlContent: string, fileName: string): KMLParseResult {
    const warnings: string[] = []

    const doc = new DOMParser().parseFromString(kmlContent, 'application/xml')

    if (doc.querySelector('parsererror')) {
      return errorResult('Invalid KML file: XML parsing failed. Please check the file format.')
    }

    const kmlElement = doc.querySelector('kml')
    if (!kmlElement) {
      return errorResult('Invalid KML file: Missing <kml> root element.')
    }

    const placemarks = kmlElement.querySelectorAll('Placemark')
    if (placemarks.length === 0) {
      return errorResult('No placemarks found in KML file.')
    }

    const tracks: KMLTrack[] = []
    let trackIndex = 0

    for (const placemark of placemarks) {
      // Try to get name
      const nameEl = placemark.querySelector('name')
      let trackName = nameEl?.textContent?.trim() || ''

      // Try gx:Track first (has timestamps), then LineString
      let points = extractGxTrack(placemark)
      if (points.length === 0) {
        points = extractLineStrings(placemark)
      }

      // Skip placemarks without track data (might be markers, polygons, etc.)
      if (points.length === 0) continue

      // Generate name if not provided
      if (!trackName) {
        trackIndex++
        trackName = placemarks.length === 1 ? fileName : `${fileName}-track${trackIndex}`
      }

      // Check for timestamp coverage
      const pointsWithTime = points.filter((p) => p.time !== null).length
      if (pointsWithTime === 0) {
        warnings.push(`Track "${trackName}" has no timestamps - points will be evenly spaced`)
      } else if (pointsWithTime < points.length) {
        warnings.push(
          `Track "${trackName}": ${points.length - pointsWithTime} of ${points.length} points missing timestamps`
        )
      }

      tracks.push({ name: trackName, points })
    }

    if (tracks.length === 0) {
      return errorResult('No tracks (LineString or gx:Track) found in KML file.', warnings)
    }

    return { success: true, tracks, warnings }
  }

  /**
   * Convert KML track to GPSMovementRow[] format
   */
  static toGPSMovementRows(track: KMLTrack): GPSMovementRow[] {
    // Parse all timestamps once and find the minimum
    const parsedTimes = track.points.map((p) => (p.time ? TimeUtils.parseISO8601(p.time) : null))
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
