import { Duration, DateTime } from 'luxon'

/**
 * Supported time formats for CSV import
 */
export type TimeFormat =
  | 'numeric' // Already seconds (e.g., 123.5)
  | 'unix-seconds' // Unix timestamp in seconds (e.g., 1710513000)
  | 'unix-milliseconds' // Unix timestamp in milliseconds (e.g., 1710513000000)
  | 'iso8601' // ISO 8601 datetime (e.g., 2024-03-15T14:30:00Z)
  | 'datetime-string' // Date + time string (e.g., 2024-03-15 14:30:00)
  | 'time-colon' // HH:MM:SS or MM:SS (e.g., 14:30:00)

// Threshold for distinguishing Unix seconds from milliseconds
// 1e11 seconds = year 5138 (far future), 1e11 milliseconds = year 1973
const UNIX_MS_THRESHOLD = 1e11
// Minimum value that's likely a Unix timestamp (year 2001)
const UNIX_SECONDS_MIN = 1e9

export class TimeUtils {
  /**
   * Converts various time formats to seconds
   * Supported formats: HH:MM:SS, MM:SS, seconds as number or string
   * Returns null if value cannot be parsed
   */
  static toSeconds(time: string | number | null | undefined): number | null {
    if (time === null || time === undefined || time === '') {
      return null
    }

    if (typeof time === 'number') {
      return time
    }

    // Try numeric string first
    if (!isNaN(Number(time))) {
      return Number(time)
    }

    // Try HH:MM:SS or MM:SS format
    const parts = time.split(':').map(Number)
    if (parts.some(isNaN)) return null

    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1]
    }

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

  /**
   * Detects the time format from a sample value
   * Returns null if format cannot be determined
   */
  static detectFormat(value: unknown): TimeFormat | null {
    // Handle null/undefined/empty
    if (value === null || value === undefined || value === '') {
      return null
    }

    // Handle numbers
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) return null

      // Check for Unix milliseconds (> year 1973 in ms)
      if (value > UNIX_MS_THRESHOLD) return 'unix-milliseconds'

      // Check for Unix seconds (year 2001-5138 range)
      if (value >= UNIX_SECONDS_MIN) return 'unix-seconds'

      // Assume already in seconds (existing behavior)
      return 'numeric'
    }

    // Handle strings
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed === '') return null

      // ISO 8601 with T separator (e.g., 2024-03-15T14:30:00Z)
      if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
        return 'iso8601'
      }

      // Date + time with space separator (e.g., 2024-03-15 14:30:00)
      if (/^\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}/.test(trimmed)) {
        return 'datetime-string'
      }

      // US date format with space (e.g., 03/15/2024 14:30:00)
      if (/^\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}/.test(trimmed)) {
        return 'datetime-string'
      }

      // HH:MM:SS or MM:SS (existing colon format)
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmed)) {
        return 'time-colon'
      }

      // Numeric string - check if it parses as a number
      if (!isNaN(Number(trimmed))) {
        const num = Number(trimmed)
        if (num > UNIX_MS_THRESHOLD) return 'unix-milliseconds'
        if (num >= UNIX_SECONDS_MIN) return 'unix-seconds'
        return 'numeric'
      }
    }

    return null
  }

  /**
   * Converts a value to seconds using a specific format
   * Returns null if conversion fails
   */
  static toSecondsWithFormat(value: unknown, format: TimeFormat): number | null {
    if (value === null || value === undefined || value === '') {
      return null
    }

    switch (format) {
      case 'numeric':
      case 'unix-seconds': {
        const num = typeof value === 'number' ? value : Number(value)
        return Number.isFinite(num) ? num : null
      }

      case 'unix-milliseconds': {
        const num = typeof value === 'number' ? value : Number(value)
        return Number.isFinite(num) ? num / 1000 : null
      }

      case 'iso8601':
        return this.parseISO8601(String(value))

      case 'datetime-string':
        return this.parseDateTimeString(String(value))

      case 'time-colon':
        return this.toSeconds(value as string | number)

      default:
        return null
    }
  }

  /**
   * Parses ISO 8601 datetime string to Unix timestamp (seconds)
   * Examples: 2024-03-15T14:30:00Z, 2024-03-15T14:30:00-05:00
   */
  static parseISO8601(value: string): number | null {
    const dt = DateTime.fromISO(value.trim(), { zone: 'utc' })
    if (!dt.isValid) return null
    return dt.toSeconds()
  }

  /**
   * Parses date+time string to Unix timestamp (seconds)
   * Supports multiple common formats
   */
  static parseDateTimeString(value: string): number | null {
    const trimmed = value.trim()

    // Try common formats
    const formats = [
      'yyyy-MM-dd HH:mm:ss',
      'yyyy-MM-dd HH:mm',
      'yyyy/MM/dd HH:mm:ss',
      'yyyy/MM/dd HH:mm',
      'MM/dd/yyyy HH:mm:ss',
      'MM/dd/yyyy HH:mm',
      'dd/MM/yyyy HH:mm:ss',
      'dd/MM/yyyy HH:mm',
    ]

    for (const fmt of formats) {
      const dt = DateTime.fromFormat(trimmed, fmt, { zone: 'utc' })
      if (dt.isValid) return dt.toSeconds()
    }

    return null
  }
}
