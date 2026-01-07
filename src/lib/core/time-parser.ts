import { TimeUtils, type TimeFormat } from './time-utils'
import type { CsvRow, PapaParseResult } from './types'

/**
 * Configuration for time column preprocessing
 */
export interface TimeParseConfig {
  /** Column names containing time values (e.g., ['time'] or ['start', 'end']) */
  timeColumns: string[]
  /** Number of rows to sample for format detection (default: 5) */
  sampleSize?: number
  /** Maximum percentage of invalid rows allowed (default: 0.1 = 10%) */
  maxInvalidRatio?: number
}

/**
 * Result of time preprocessing
 */
export interface TimeParseOutput {
  /** Whether preprocessing succeeded */
  success: boolean
  /** Preprocessed data with time columns converted to relative seconds */
  data: CsvRow[]
  /** Detected time format (null if no time columns found) */
  format: TimeFormat | null
  /** First timestamp value (used for relative calculation) */
  firstTimestamp: number | null
  /** Warning messages (e.g., skipped rows) */
  warnings: string[]
  /** Error message if success is false */
  error?: string
}

const DEFAULT_SAMPLE_SIZE = 5
const DEFAULT_MAX_INVALID_RATIO = 0.1

/**
 * Preprocesses time columns in parsed CSV data
 * Detects format, converts to seconds, and calculates offset from first timestamp
 */
export class TimeParser {
  /**
   * Preprocesses time columns in parsed CSV data
   * Detects format from first few rows, then converts all times to relative seconds
   */
  static preprocess(results: PapaParseResult, config: TimeParseConfig): TimeParseOutput {
    const {
      timeColumns,
      sampleSize = DEFAULT_SAMPLE_SIZE,
      maxInvalidRatio = DEFAULT_MAX_INVALID_RATIO,
    } = config

    // If no data, return success with empty data
    if (results.data.length === 0) {
      return {
        success: true,
        data: [],
        format: null,
        firstTimestamp: null,
        warnings: [],
      }
    }

    // Filter to only columns that exist in the data
    const fields = results.meta.fields || []
    const existingColumns = timeColumns.filter((col) => fields.includes(col))

    // If no time columns found, return data as-is
    if (existingColumns.length === 0) {
      return {
        success: true,
        data: results.data,
        format: null,
        firstTimestamp: null,
        warnings: [],
      }
    }

    // Use the first time column for format detection (all should have same format)
    const primaryColumn = existingColumns[0]

    // Detect format from sample
    const format = this.detectFormatFromSample(results.data, primaryColumn, sampleSize)

    if (format === null) {
      return {
        success: false,
        data: results.data,
        format: null,
        firstTimestamp: null,
        warnings: [],
        error: `Could not detect time format in column '${primaryColumn}'. Supported formats: numeric seconds, Unix timestamp, ISO 8601 (e.g., 2024-03-15T14:30:00Z), HH:MM:SS`,
      }
    }

    // Find first timestamp across all time columns
    const firstTimestamp = this.findFirstTimestamp(results.data, existingColumns, format)

    if (firstTimestamp === null) {
      return {
        success: false,
        data: results.data,
        format,
        firstTimestamp: null,
        warnings: [],
        error: `No valid time values found in column '${primaryColumn}'.`,
      }
    }

    // Convert all time columns
    const { data, warnings, invalidCount } = this.convertTimeColumns(
      results.data,
      existingColumns,
      format,
      firstTimestamp
    )

    // Check if too many rows failed
    const invalidRatio = invalidCount / results.data.length
    if (invalidRatio > maxInvalidRatio) {
      return {
        success: false,
        data: results.data,
        format,
        firstTimestamp,
        warnings,
        error: `Too many invalid time values (${invalidCount} of ${results.data.length} rows, ${Math.round(invalidRatio * 100)}%). Please check your data format.`,
      }
    }

    return {
      success: true,
      data,
      format,
      firstTimestamp,
      warnings,
    }
  }

  /**
   * Detects time format by sampling first N valid rows
   * Returns null if no consistent format can be detected
   */
  static detectFormatFromSample(
    data: CsvRow[],
    column: string,
    sampleSize: number
  ): TimeFormat | null {
    const detectedFormats: TimeFormat[] = []

    for (const row of data) {
      if (detectedFormats.length >= sampleSize) break

      const value = row[column]
      if (value === null || value === undefined || value === '') continue

      const format = TimeUtils.detectFormat(value)
      if (format !== null) {
        detectedFormats.push(format)
      }
    }

    if (detectedFormats.length === 0) {
      return null
    }

    // Check if all detected formats are the same
    const firstFormat = detectedFormats[0]
    const allSame = detectedFormats.every((f) => f === firstFormat)

    if (!allSame) {
      // Log which formats were detected for debugging
      console.warn(`Inconsistent time formats detected in column '${column}':`, detectedFormats)
      return null
    }

    return firstFormat
  }

  /**
   * Finds the minimum (first) timestamp across all time columns
   */
  private static findFirstTimestamp(
    data: CsvRow[],
    columns: string[],
    format: TimeFormat
  ): number | null {
    let minTimestamp: number | null = null

    for (const row of data) {
      for (const column of columns) {
        const value = row[column]
        const seconds = TimeUtils.toSecondsWithFormat(value, format)

        if (seconds !== null) {
          if (minTimestamp === null || seconds < minTimestamp) {
            minTimestamp = seconds
          }
        }
      }
    }

    return minTimestamp
  }

  /**
   * Converts all time values in specified columns to relative seconds
   */
  private static convertTimeColumns(
    data: CsvRow[],
    columns: string[],
    format: TimeFormat,
    firstTimestamp: number
  ): { data: CsvRow[]; warnings: string[]; invalidCount: number } {
    const MAX_WARNINGS = 10
    const warnings: string[] = []
    let invalidCount = 0
    const convertedData: CsvRow[] = []

    for (let i = 0; i < data.length; i++) {
      const row = { ...data[i] } // Clone the row
      let rowHasValidTime = true

      for (const column of columns) {
        const value = row[column]

        // Skip empty values
        if (value === null || value === undefined || value === '') {
          continue
        }

        const seconds = TimeUtils.toSecondsWithFormat(value, format)

        if (seconds === null) {
          // Log warning for invalid value (cap at MAX_WARNINGS)
          if (warnings.length < MAX_WARNINGS) {
            warnings.push(
              `Row ${i + 1}: Could not parse time value '${value}' in column '${column}'`
            )
          }
          rowHasValidTime = false
        } else {
          // Convert to relative seconds
          row[column] = seconds - firstTimestamp
        }
      }

      if (!rowHasValidTime) {
        invalidCount++
      }

      convertedData.push(row)
    }

    // Add summary if warnings were capped
    if (invalidCount > MAX_WARNINGS) {
      warnings.push(`...and ${invalidCount - MAX_WARNINGS} more rows with invalid time values`)
    }

    return { data: convertedData, warnings, invalidCount }
  }
}
