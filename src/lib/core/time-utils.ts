import { Duration } from 'luxon'

export class TimeUtils {
  /**
   * Converts various time formats to seconds
   * Supported formats:
   * - HH:MM:SS
   * - MM:SS
   * - Seconds as number
   * - Seconds as string
   * If empty/null/undefined returns null to indicate fallback to word count
   */
  static toSeconds(time: string | number | null | undefined): number | null {
    // If time is null undefined or empty string return null
    if (time === null || time === undefined || time === '') {
      return null
    }

    // If time is already a number return it
    if (typeof time === 'number') {
      return time
    }

    // If time is a string that can be directly converted to a number
    if (!isNaN(Number(time))) {
      return Number(time)
    }

    // Try to parse as HH:MM:SS or MM:SS
    const parts = time.split(':').map(Number)

    try {
      if (parts.length === 3) {
        // HH:MM:SS format
        return parts[0] * 3600 + parts[1] * 60 + parts[2]
      } else if (parts.length === 2) {
        // MM:SS format
        return parts[0] * 60 + parts[1]
      }
    } catch (error) {
      console.error('Error parsing time:', error)
      return null
    }

    // Default to null if format is not recognized
    return null
  }

  /**
   * Formats seconds into HH:MM:SS
   */
  static formatTime(seconds: number): string {
    const duration = Duration.fromObject({ seconds: Math.round(seconds) })
    return duration.toFormat('hh:mm:ss')
  }

  /**
   * Formats seconds into MM:SS if under an hour otherwise HH:MM:SS
   */
  static formatTimeAuto(seconds: number): string {
    const duration = Duration.fromObject({ seconds: Math.round(seconds) })
    return seconds < 3600 ? duration.toFormat('mm:ss') : duration.toFormat('hh:mm:ss')
  }
}
