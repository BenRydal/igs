/// <reference types="vite/client" />
import type { GPSBounds, MapboxStyle } from './gps-types'
import { setLoading } from '../../stores/gpsStore'
import { toastStore } from '../../stores/toastStore'
import { GPSTransformer } from './gps-transformer'

const MAPBOX_API_URL = 'https://api.mapbox.com/styles/v1/mapbox'

/**
 * Get the Mapbox access token from environment
 */
function getMapboxToken(): string | null {
  return import.meta.env.VITE_MAPBOX_TOKEN || null
}

/**
 * Build the Mapbox Static API URL using bounding box
 * Mapbox automatically calculates the right zoom level for the bounds
 *
 * @param bounds - GPS bounding box from data
 * @param style - Mapbox style (streets, satellite, etc.)
 * @param width - Image width in pixels (max 1280)
 * @param height - Image height in pixels (max 1280)
 * @returns URL string for the static map image
 */
export function buildStaticMapUrl(
  bounds: GPSBounds,
  style: MapboxStyle,
  width: number,
  height: number
): string {
  const token = getMapboxToken()

  if (!token) {
    throw new Error(
      'Mapbox API token not configured. Set VITE_MAPBOX_TOKEN in your .env file.\n' +
        'Get a free token at: https://account.mapbox.com/access-tokens/'
    )
  }

  // Clamp dimensions to Mapbox limits
  const clampedWidth = Math.min(1280, Math.max(1, width))
  const clampedHeight = Math.min(1280, Math.max(1, height))

  // Mapbox Static API URL format with bounding box:
  // /styles/v1/{username}/{style_id}/static/[minLon,minLat,maxLon,maxLat]/{width}x{height}@2x
  // Using bounding box lets Mapbox calculate the optimal zoom automatically
  // Using @2x for higher resolution on retina displays
  const bbox = `[${bounds.minLng.toFixed(6)},${bounds.minLat.toFixed(6)},${bounds.maxLng.toFixed(6)},${bounds.maxLat.toFixed(6)}]`

  const url =
    `${MAPBOX_API_URL}/${style}/static/` +
    `${bbox}/` +
    `${clampedWidth}x${clampedHeight}@2x` +
    `?access_token=${token}`

  return url
}

/**
 * Load map image into p5 FloorPlan
 *
 * @param sketch - p5.js sketch instance
 * @param bounds - GPS bounding box
 * @param style - Mapbox map style
 */
export async function loadMapAsFloorPlan(
  sketch: any,
  bounds: GPSBounds,
  style: MapboxStyle
): Promise<void> {
  setLoading(true)

  try {
    // Calculate dimensions that match the Mercator aspect ratio of the bounds
    // This ensures the map bounds exactly fill the image with no padding/centering
    const aspectRatio = GPSTransformer.getMercatorAspectRatio(bounds)
    const maxDim = 1280 // Mapbox limit
    const minDim = 400

    let width: number
    let height: number

    if (aspectRatio >= 1) {
      // Wider than tall - constrain by width
      width = Math.min(maxDim, Math.max(minDim, sketch.width))
      height = Math.round(width / aspectRatio)
      // Ensure height is within limits
      if (height > maxDim) {
        height = maxDim
        width = Math.round(height * aspectRatio)
      }
    } else {
      // Taller than wide - constrain by height
      height = Math.min(maxDim, Math.max(minDim, sketch.height))
      width = Math.round(height * aspectRatio)
      // Ensure width is within limits
      if (width > maxDim) {
        width = maxDim
        height = Math.round(width / aspectRatio)
      }
    }

    // Ensure minimum dimensions
    width = Math.max(minDim, width)
    height = Math.max(minDim, height)

    const mapUrl = buildStaticMapUrl(bounds, style, width, height)

    // Load image using p5's loadImage
    return new Promise((resolve, reject) => {
      sketch.loadImage(
        mapUrl,
        (img: any) => {
          sketch.floorPlan.img = img
          sketch.floorPlan.width = img.width
          sketch.floorPlan.height = img.height
          setLoading(false)
          sketch.loop()
          resolve()
        },
        (err: any) => {
          setLoading(false)
          toastStore.error('Failed to load map image from Mapbox')
          console.error('Mapbox image load error:', err)
          reject(new Error('Failed to load map image from Mapbox'))
        }
      )
    })
  } catch (error) {
    setLoading(false)
    const errorMsg = error instanceof Error ? error.message : 'Unknown error loading map'
    toastStore.error(errorMsg)
    console.error('Mapbox service error:', error)
    throw error
  }
}

/**
 * Check if Mapbox token is configured
 */
export function isMapboxConfigured(): boolean {
  return !!getMapboxToken()
}
