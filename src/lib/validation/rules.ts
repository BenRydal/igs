/**
 * Validation rules and constants for CSV data
 *
 * NOTE: All headers must be lowercase as input data tables are converted to
 * lowercase when loaded using PapaParse transformHeaders method
 */

import type { RowValidator } from './types'

/**
 * Required headers for movement data files
 * Each column must be type number
 */
export const MOVEMENT_HEADERS = ['time', 'x', 'y'] as const

/**
 * Required headers for conversation data files
 * time: number, speaker: string, talk: string|number|boolean
 */
export const CONVERSATION_HEADERS = ['time', 'speaker', 'talk'] as const

/**
 * Required headers for single code data files
 * Each column must be type number
 */
export const SINGLE_CODE_HEADERS = ['start', 'end'] as const

/**
 * Required headers for multi-code data files
 * code: string, start: number, end: number
 */
export const MULTI_CODE_HEADERS = ['code', 'start', 'end'] as const

/**
 * Error codes for validation errors
 */
export const ERROR_CODES = {
  NO_DATA: 'NO_DATA',
  MISSING_HEADERS: 'MISSING_HEADERS',
  NO_VALID_ROWS: 'NO_VALID_ROWS',
  INVALID_TYPE: 'INVALID_TYPE',
  PARSE_ERROR: 'PARSE_ERROR',
  EMPTY_REQUIRED_FIELD: 'EMPTY_REQUIRED_FIELD',
} as const

/**
 * Warning codes for validation warnings
 */
export const WARNING_CODES = {
  SKIPPED_INVALID_ROWS: 'SKIPPED_INVALID_ROWS',
  PARSE_WARNINGS: 'PARSE_WARNINGS',
  TRUNCATED_FILE: 'TRUNCATED_FILE',
} as const

/**
 * Check if a value is a string, number, or boolean
 */
const isStringNumberOrBoolean = (value: unknown): boolean => {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}

/**
 * Validate a movement data row
 * All three columns (time, x, y) must be numbers
 */
export const validateMovementRow: RowValidator = (row: Record<string, unknown>): boolean => {
  return (
    typeof row[MOVEMENT_HEADERS[0]] === 'number' &&
    typeof row[MOVEMENT_HEADERS[1]] === 'number' &&
    typeof row[MOVEMENT_HEADERS[2]] === 'number'
  )
}

/**
 * Validate a conversation data row
 * time: number, speaker: string, talk: string|number|boolean
 * NOTE: For talk turns/3rd column, allow boolean, number or string values.
 * These are cast as Strings later in program
 */
export const validateConversationRow: RowValidator = (row: Record<string, unknown>): boolean => {
  return (
    typeof row[CONVERSATION_HEADERS[0]] === 'number' &&
    typeof row[CONVERSATION_HEADERS[1]] === 'string' &&
    isStringNumberOrBoolean(row[CONVERSATION_HEADERS[2]])
  )
}

/**
 * Validate a single code data row
 * Both columns (start, end) must be numbers
 */
export const validateSingleCodeRow: RowValidator = (row: Record<string, unknown>): boolean => {
  return (
    typeof row[SINGLE_CODE_HEADERS[0]] === 'number' &&
    typeof row[SINGLE_CODE_HEADERS[1]] === 'number'
  )
}

/**
 * Validate a multi-code data row
 * code: string, start: number, end: number
 */
export const validateMultiCodeRow: RowValidator = (row: Record<string, unknown>): boolean => {
  return (
    typeof row[MULTI_CODE_HEADERS[0]] === 'string' &&
    typeof row[MULTI_CODE_HEADERS[1]] === 'number' &&
    typeof row[MULTI_CODE_HEADERS[2]] === 'number'
  )
}

/**
 * Check if all required headers are present in the field names
 */
export const includesAllHeaders = (
  fieldNames: string[] | undefined,
  requiredHeaders: readonly string[]
): boolean => {
  if (!fieldNames) return false

  for (const header of requiredHeaders) {
    if (!fieldNames.includes(header)) {
      return false
    }
  }

  return true
}

/**
 * Get missing headers from a list of field names
 */
export const getMissingHeaders = (
  fieldNames: string[] | undefined,
  requiredHeaders: readonly string[]
): string[] => {
  if (!fieldNames) return [...requiredHeaders]

  return requiredHeaders.filter((header) => !fieldNames.includes(header))
}

/**
 * Get type name for error messages
 */
export const getExpectedType = (header: string, fileType: string): string => {
  switch (fileType) {
    case 'movement':
      return 'number'
    case 'conversation':
      if (header === 'time') return 'number'
      if (header === 'speaker') return 'string'
      if (header === 'talk') return 'string, number, or boolean'
      return 'unknown'
    case 'singleCode':
      return 'number'
    case 'multiCode':
      if (header === 'code') return 'string'
      return 'number'
    default:
      return 'unknown'
  }
}

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
 * Validation limits for data values
 */
export const VALIDATION_LIMITS = {
  MAX_STRING_LENGTH: 1000,
  MAX_SPEAKER_LENGTH: 100,
  MAX_CODE_LENGTH: 50,
  MIN_COORDINATE: -10000,
  MAX_COORDINATE: 10000,
  MIN_TIME: 0,
  MAX_TIME: 86400, // 24 hours
} as const

/**
 * Dangerous CSV formula characters that could indicate CSV injection
 */
export const DANGEROUS_CSV_STARTS = ['=', '+', '-', '@', '\t', '\r'] as const

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Check if a string starts with dangerous CSV formula characters
 */
export function isCSVInjection(value: string): boolean {
  return DANGEROUS_CSV_STARTS.some((char) => value.startsWith(char))
}

/**
 * Check if a string length is within the allowed limit
 */
export function isValidStringLength(value: string, maxLength: number): boolean {
  return value.length <= maxLength
}

/**
 * Check if a coordinate value is within valid bounds
 */
export function isValidCoordinate(value: number): boolean {
  return (
    Number.isFinite(value) &&
    value >= VALIDATION_LIMITS.MIN_COORDINATE &&
    value <= VALIDATION_LIMITS.MAX_COORDINATE
  )
}

/**
 * Check if a time value is within valid bounds
 */
export function isValidTime(value: number): boolean {
  return (
    Number.isFinite(value) &&
    value >= VALIDATION_LIMITS.MIN_TIME &&
    value <= VALIDATION_LIMITS.MAX_TIME
  )
}
