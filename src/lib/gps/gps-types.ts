/**
 * GPS bounding box calculated from data
 */
export interface GPSBounds {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

/**
 * Mapbox static map style options
 */
export type MapboxStyle =
  | 'streets-v12'
  | 'outdoors-v12'
  | 'satellite-v9'
  | 'light-v11'
  | 'dark-v11'

/**
 * GPS state for the store
 */
export interface GPSState {
  isGPSMode: boolean
  bounds: GPSBounds | null
  mapStyle: MapboxStyle
  isLoading: boolean
}

/**
 * Map style display configuration
 */
export interface MapStyleOption {
  value: MapboxStyle
  label: string
}

export const MAP_STYLES: MapStyleOption[] = [
  { value: 'streets-v12', label: 'Streets' },
  { value: 'outdoors-v12', label: 'Outdoors' },
  { value: 'satellite-v9', label: 'Satellite' },
  { value: 'light-v11', label: 'Light' },
  { value: 'dark-v11', label: 'Dark' },
]

/**
 * Normalized GPS point with consistent field names
 */
export interface NormalizedGPSPoint {
  time: number
  lat: number
  lng: number
}

/**
 * Result of GPS data validation
 */
export interface GPSValidationResult {
  filteredData: NormalizedGPSPoint[]
  warnings: string[]
}
