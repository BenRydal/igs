/**
 * GPS data validation module
 * Detects and filters GPS data quality issues like spikes, time gaps, etc.
 */

import type { NormalizedGPSPoint, GPSValidationResult } from './gps-types'
import { calculateSpeed } from './gps-utils'

const MAX_SPEED_KMH = 150 // Points exceeding this are considered spikes
const LARGE_GAP_SECONDS = 300 // 5 minutes

/**
 * Validate GPS data and return filtered results with warnings
 */
export function validateGPSData(points: NormalizedGPSPoint[]): GPSValidationResult {
  if (points.length === 0) {
    return { filteredData: [], warnings: [] }
  }

  const warnings: string[] = []

  // Sort by time, warn if out of order
  const outOfOrderCount = countOutOfOrder(points)
  const sorted = [...points].sort((a, b) => a.time - b.time)
  if (outOfOrderCount > 0) {
    warnings.push(
      `${outOfOrderCount} timestamp${outOfOrderCount > 1 ? 's were' : ' was'} out of order and ${outOfOrderCount > 1 ? 'have' : 'has'} been sorted`
    )
  }

  // Check for duplicate timestamps with different locations
  const duplicateCount = countDuplicates(sorted)
  if (duplicateCount > 0) {
    warnings.push(
      `${duplicateCount} duplicate timestamp${duplicateCount > 1 ? 's' : ''} found with different locations`
    )
  }

  // Filter spikes (points with impossible speeds)
  const filtered = filterSpikes(sorted, MAX_SPEED_KMH)
  const spikeCount = sorted.length - filtered.length
  if (spikeCount > 0) {
    warnings.push(
      `Filtered ${spikeCount} GPS point${spikeCount > 1 ? 's' : ''} with impossible speeds (likely GPS errors)`
    )
  }

  // Warn about large time gaps
  const maxGapMinutes = findMaxGap(filtered, LARGE_GAP_SECONDS)
  if (maxGapMinutes > 0) {
    warnings.push(`Large time gap detected (${maxGapMinutes} min) - data may be incomplete`)
  }

  return { filteredData: filtered, warnings }
}

function countOutOfOrder(points: NormalizedGPSPoint[]): number {
  let count = 0
  for (let i = 1; i < points.length; i++) {
    if (points[i].time < points[i - 1].time) count++
  }
  return count
}

function countDuplicates(points: NormalizedGPSPoint[]): number {
  const seen = new Map<number, NormalizedGPSPoint>()
  let count = 0
  for (const point of points) {
    const existing = seen.get(point.time)
    if (existing && (existing.lat !== point.lat || existing.lng !== point.lng)) {
      count++
    } else {
      seen.set(point.time, point)
    }
  }
  return count
}

function filterSpikes(points: NormalizedGPSPoint[], maxSpeedKmh: number): NormalizedGPSPoint[] {
  if (points.length < 2) return points

  const result: NormalizedGPSPoint[] = [points[0]] // First point is always valid

  for (let i = 1; i < points.length; i++) {
    const lastValid = result[result.length - 1]
    const speed = calculateSpeed(lastValid, points[i])
    if (speed === null || speed <= maxSpeedKmh) {
      result.push(points[i])
    }
  }

  return result
}

function findMaxGap(points: NormalizedGPSPoint[], thresholdSeconds: number): number {
  let maxGap = 0
  for (let i = 1; i < points.length; i++) {
    const gap = points[i].time - points[i - 1].time
    if (gap > thresholdSeconds && gap > maxGap) {
      maxGap = gap
    }
  }
  return maxGap > 0 ? Math.round(maxGap / 60) : 0
}
