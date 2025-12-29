/**
 * Type definitions for core data processing
 */

/**
 * Movement data CSV row structure
 * All headers are lowercase (transformed by PapaParse)
 */
export interface MovementRow {
  time: number
  x: number
  y: number
}

/**
 * GPS Movement data CSV row structure (lat/lng based)
 * Supports both 'lat/lng' and 'latitude/longitude' headers
 * All headers are lowercase (transformed by PapaParse)
 */
export interface GPSMovementRow {
  time: number
  lat?: number
  lng?: number
  latitude?: number
  longitude?: number
}

/**
 * Conversation data CSV row structure
 * All headers are lowercase (transformed by PapaParse)
 */
export interface ConversationRow {
  time: number
  speaker: string
  talk: string | number | boolean
}

/**
 * Single code CSV row structure (filename becomes code name)
 * All headers are lowercase (transformed by PapaParse)
 */
export interface SingleCodeRow {
  start: number
  end: number
}

/**
 * Multi-code CSV row structure (code name in column)
 * All headers are lowercase (transformed by PapaParse)
 */
export interface MultiCodeRow {
  code: string
  start: number
  end: number
}

/**
 * Generic CSV row type - used for unknown/untyped rows
 */
export type CsvRow = Record<string, unknown>

/**
 * PapaParse result structure for typed CSV data
 */
export interface PapaParseResult<T = CsvRow> {
  data: T[]
  errors: Array<{
    type: string
    code: string
    message: string
    row?: number
  }>
  meta: {
    delimiter: string
    linebreak: string
    aborted: boolean
    truncated: boolean
    cursor?: number
    fields?: string[]
  }
}

/**
 * Stored movement data with filename
 */
export interface MovementDataFile {
  fileName: string
  csvData: MovementRow[]
}

/**
 * Processed code entry (from single or multi-code files)
 */
export interface CodeEntry {
  code: string
  startTime: number
  endTime: number
}

/**
 * Example dropdown selection values
 */
export type ExampleId =
  | 'example-1'
  | 'example-2'
  | 'example-3'
  | 'example-4'
  | 'example-5'
  | 'example-6'
  | 'example-7'
  | 'example-8'
  | 'example-9'
  | 'example-10'
  | 'example-11'
  | 'example-12'

/**
 * Example data configuration
 */
export interface ExampleConfig {
  files: string[]
  videoId?: string
}

/**
 * Example dropdown event target
 */
export interface ExampleSelectEvent extends Event {
  target: HTMLSelectElement
}
