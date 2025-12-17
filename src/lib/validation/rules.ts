/**
 * Validation rules and constants for CSV data
 */

/**
 * File size limits in bytes to prevent DoS attacks
 */
export const FILE_SIZE_LIMITS = {
  CSV: 10 * 1024 * 1024, // 10MB
  IMAGE: 5 * 1024 * 1024, // 5MB
  VIDEO: 1024 * 1024 * 1024, // 1GB
  DEFAULT: 50 * 1024 * 1024, // 50MB
} as const

/**
 * Get file size limit based on file extension
 */
export function getFileSizeLimit(filename: string): number {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  switch (ext) {
    case 'csv':
      return FILE_SIZE_LIMITS.CSV
    case 'png':
    case 'jpg':
    case 'jpeg':
      return FILE_SIZE_LIMITS.IMAGE
    case 'mp4':
      return FILE_SIZE_LIMITS.VIDEO
    default:
      return FILE_SIZE_LIMITS.DEFAULT
  }
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
