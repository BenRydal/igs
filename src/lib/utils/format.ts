/**
 * Format seconds as M:SS or MM:SS
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Parse M:SS or MM:SS format to seconds
 * Returns null if invalid
 */
export function parseTime(timeStr: string): number | null {
  const match = timeStr.match(/^(\d+):(\d{1,2})$/)
  if (!match) return null
  const mins = parseInt(match[1], 10)
  const secs = parseInt(match[2], 10)
  if (secs >= 60) return null
  return mins * 60 + secs
}
