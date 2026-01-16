/**
 * Centralized file type configuration for IGS
 *
 * Single source of truth for supported file types, their display info,
 * and derived values like accept strings for file inputs.
 */

export interface FileTypeInfo {
  label: string
  icon: string
  color: string
}

const FILE_TYPES: Record<string, FileTypeInfo> = {
  csv: { label: 'CSV Data', icon: '📊', color: 'badge-info' },
  gpx: { label: 'GPS Track', icon: '📍', color: 'badge-info' },
  kml: { label: 'GPS Track', icon: '📍', color: 'badge-info' },
  png: { label: 'Floor Plan', icon: '🗺️', color: 'badge-success' },
  jpg: { label: 'Floor Plan', icon: '🗺️', color: 'badge-success' },
  jpeg: { label: 'Floor Plan', icon: '🗺️', color: 'badge-success' },
  mp4: { label: 'Video', icon: '🎬', color: 'badge-warning' },
}

/** All supported file extensions */
export const SUPPORTED_EXTENSIONS = Object.keys(FILE_TYPES)

/** Accept string for file inputs (e.g., ".csv,.gpx,.kml,.png,.jpg,.jpeg,.mp4") */
export const ACCEPT_STRING = SUPPORTED_EXTENSIONS.map((ext) => `.${ext}`).join(',')

/** Get file type info for an extension, or undefined if not supported */
export function getFileTypeInfo(ext: string): FileTypeInfo | undefined {
  return FILE_TYPES[ext.toLowerCase()]
}

/** Get file extension from filename */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}
