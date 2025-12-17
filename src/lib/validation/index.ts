/**
 * CSV Validation Module
 *
 * Provides file size validation utilities for uploaded files.
 *
 * @example
 * ```typescript
 * import { formatFileSize, getFileSizeLimit } from '$lib/validation';
 *
 * const limit = getFileSizeLimit('data.csv');
 * console.log(`Max size: ${formatFileSize(limit)}`);
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

// Export file size utilities
export {
  FILE_SIZE_LIMITS,
  formatFileSize,
  getFileSizeLimit,
} from './rules'
