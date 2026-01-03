/**
 * GPS utility functions for distance and speed calculations
 */

const EARTH_RADIUS_KM = 6371

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Calculate the Haversine distance between two GPS points in kilometers
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return EARTH_RADIUS_KM * c
}

/**
 * Calculate speed between two GPS points in km/h
 * Returns null if time difference is zero
 */
export function calculateSpeed(
  point1: { lat: number; lng: number; time: number },
  point2: { lat: number; lng: number; time: number }
): number | null {
  const timeDiffSeconds = Math.abs(point2.time - point1.time)

  if (timeDiffSeconds === 0) {
    return null
  }

  const distanceKm = haversineDistance(point1.lat, point1.lng, point2.lat, point2.lng)
  const timeDiffHours = timeDiffSeconds / 3600

  return distanceKm / timeDiffHours
}
