/**
 * CSV Validation Module
 *
 * Provides type-safe validation for CSV data files used in IGS.
 * Supports four file types: movement, conversation, single code, and multi-code.
 *
 * @example
 * ```typescript
 * import { validateCSV, validateMovementData } from '$lib/validation';
 * import type { ValidationResult } from '$lib/validation';
 *
 * // Auto-detect and validate
 * const result: ValidationResult = validateCSV(papaParseResults);
 * if (result.isValid) {
 *   console.log(`Valid ${result.fileType} file with ${result.stats?.validRows} rows`);
 * } else {
 *   console.error('Validation errors:', result.errors);
 * }
 *
 * // Or validate specific type
 * const movementResult = validateMovementData(papaParseResults);
 * ```
 */

// Export types
export type {
  DataFileType,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  DataStats,
  PapaParseResults,
  RowValidator,
  RowValidationResult,
} from './types'

// Export validation functions
export {
  validateMovementData,
  validateConversationData,
  validateSingleCodeData,
  validateMultiCodeData,
  detectFileType,
  validateCSV,
} from './validators'

// Export validation rules and constants
export {
  MOVEMENT_HEADERS,
  CONVERSATION_HEADERS,
  SINGLE_CODE_HEADERS,
  MULTI_CODE_HEADERS,
  ERROR_CODES,
  WARNING_CODES,
  FILE_SIZE_LIMITS,
  VALIDATION_LIMITS,
  DANGEROUS_CSV_STARTS,
  validateMovementRow,
  validateConversationRow,
  validateSingleCodeRow,
  validateMultiCodeRow,
  includesAllHeaders,
  getMissingHeaders,
  getExpectedType,
  formatFileSize,
  isCSVInjection,
  isValidStringLength,
  isValidCoordinate,
  isValidTime,
} from './rules'
