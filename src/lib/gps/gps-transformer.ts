import type { GPSBounds } from './gps-types'

/**
 * Normalized coordinate space size for GPS data.
 * GPS coordinates are transformed to this space, then FloorPlan.getScaledXYPos()
 * scales them to actual canvas dimensions.
 */
export const GPS_NORMALIZED_SIZE = 1000

/**
 * GPSTransformer handles conversion between lat/lng coordinates
 * and pixel positions on the static map image.
 *
 * Uses Mercator projection to match Mapbox's rendering.
 */
export class GPSTransformer {
  /**
   * Convert latitude to Mercator Y (0-1 range)
   * Mercator projection stretches areas near poles
   */
  static latToMercatorY(lat: number): number {
    const latRad = (lat * Math.PI) / 180
    const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2))
    return 0.5 - mercN / (2 * Math.PI)
  }

  /**
   * Convert longitude to X (0-1 range)
   * Simple linear mapping since longitude is uniform
   */
  static lngToX(lng: number): number {
    return (lng + 180) / 360
  }

  /**
   * Transform GPS coordinates to pixel positions
   * Returns [x, y] pixel coordinates relative to the normalized space
   */
  static toPixels(
    lat: number,
    lng: number,
    bounds: GPSBounds,
    width: number = GPS_NORMALIZED_SIZE,
    height: number = GPS_NORMALIZED_SIZE
  ): [number, number] {
    // Convert all coordinates to Mercator/normalized space
    const pointX = this.lngToX(lng)
    const pointY = this.latToMercatorY(lat)

    const minX = this.lngToX(bounds.minLng)
    const maxX = this.lngToX(bounds.maxLng)
    // Note: Y is inverted in Mercator - higher latitude = lower Y value
    const minY = this.latToMercatorY(bounds.maxLat)
    const maxY = this.latToMercatorY(bounds.minLat)

    // Calculate relative position within bounds (0-1)
    const relX = (pointX - minX) / (maxX - minX)
    const relY = (pointY - minY) / (maxY - minY)

    // Convert to pixel coordinates
    const pixelX = relX * width
    const pixelY = relY * height

    return [pixelX, pixelY]
  }

  /**
   * Calculate GPS bounds from an array of GPS points
   * Adds padding around the data extent
   */
  static calculateBounds(
    points: Array<{ lat: number; lng: number }>,
    paddingPercent: number = 0.1
  ): GPSBounds {
    if (points.length === 0) {
      // Default to world view if no points
      return { minLat: -85, maxLat: 85, minLng: -180, maxLng: 180 }
    }

    let minLat = Infinity
    let maxLat = -Infinity
    let minLng = Infinity
    let maxLng = -Infinity

    for (const point of points) {
      if (point.lat < minLat) minLat = point.lat
      if (point.lat > maxLat) maxLat = point.lat
      if (point.lng < minLng) minLng = point.lng
      if (point.lng > maxLng) maxLng = point.lng
    }

    // Handle single point case - create a small area around it
    if (minLat === maxLat && minLng === maxLng) {
      const defaultSpan = 0.01 // ~1km at equator
      minLat -= defaultSpan
      maxLat += defaultSpan
      minLng -= defaultSpan
      maxLng += defaultSpan
    }

    // Add padding
    const latSpan = maxLat - minLat
    const lngSpan = maxLng - minLng
    const latPadding = latSpan * paddingPercent
    const lngPadding = lngSpan * paddingPercent

    return {
      minLat: Math.max(-85, minLat - latPadding), // Mercator limit
      maxLat: Math.min(85, maxLat + latPadding), // Mercator limit
      minLng: Math.max(-180, minLng - lngPadding),
      maxLng: Math.min(180, maxLng + lngPadding),
    }
  }

  /**
   * Normalize GPS row data to consistent lat/lng field names
   */
  static normalizeGPSRow(row: {
    lat?: number
    lng?: number
    latitude?: number
    longitude?: number
    time: number
  }): { lat: number; lng: number; time: number } {
    return {
      time: row.time,
      lat: row.lat ?? row.latitude!,
      lng: row.lng ?? row.longitude!,
    }
  }

  /**
   * Calculate the aspect ratio (width/height) of bounds in Mercator projection
   * This is needed to request a Mapbox image with matching dimensions
   */
  static getMercatorAspectRatio(bounds: GPSBounds): number {
    const minX = this.lngToX(bounds.minLng)
    const maxX = this.lngToX(bounds.maxLng)
    const minY = this.latToMercatorY(bounds.maxLat) // higher lat = smaller Y
    const maxY = this.latToMercatorY(bounds.minLat)

    const xSpan = maxX - minX
    const ySpan = maxY - minY

    return xSpan / ySpan
  }

  /**
   * Validate that a GPS coordinate is a real number within valid ranges
   * Handles edge cases like empty strings, NaN, and out-of-range values
   */
  static isValidGPSPoint(point: { lat: number; lng: number }): boolean {
    const { lat, lng } = point

    // Check for valid numbers (not NaN, not empty string converted to 0 unless actually 0)
    if (typeof lat !== 'number' || typeof lng !== 'number') return false
    if (isNaN(lat) || isNaN(lng)) return false

    // Check valid GPS ranges
    if (lat < -90 || lat > 90) return false
    if (lng < -180 || lng > 180) return false

    // Reject (0, 0) as it's almost certainly bad data (null island)
    // Real data at exactly 0,0 is extremely rare
    if (lat === 0 && lng === 0) return false

    return true
  }
}
