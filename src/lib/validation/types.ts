/**
 * Validation types for CSV data import
 */

/**
 * Supported data file types
 */
export type DataFileType = 'movement' | 'conversation' | 'singleCode' | 'multiCode' | 'unknown'

/**
 * Result of CSV data validation
 */
export interface ValidationResult {
  /** Whether the data passed all validation checks */
  isValid: boolean
  /** The detected or validated file type */
  fileType: DataFileType
  /** Critical errors that prevent data from being used */
  errors: ValidationError[]
  /** Non-critical issues that should be surfaced to users */
  warnings: ValidationWarning[]
  /** Statistics about the validated data */
  stats?: DataStats
  /** Preview of first rows for display (max 10 rows) */
  previewRows?: Record<string, unknown>[]
}

/**
 * Validation error with context
 */
export interface ValidationError {
  /** Error code for programmatic handling */
  code: string
  /** Human-readable error message */
  message: string
  /** Row number where error occurred (if applicable) */
  row?: number
  /** Column name where error occurred (if applicable) */
  column?: string
}

/**
 * Validation warning with context
 */
export interface ValidationWarning {
  /** Warning code for programmatic handling */
  code: string
  /** Human-readable warning message */
  message: string
  /** Row number where warning occurred (if applicable) */
  row?: number
  /** Column name where warning occurred (if applicable) */
  column?: string
}

/**
 * Statistics about validated data
 */
export interface DataStats {
  /** Total number of rows in the dataset */
  totalRows: number
  /** Number of rows that passed validation */
  validRows: number
  /** Number of rows that failed validation */
  invalidRows: number
  /** Column names found in the data */
  columns: string[]
}

/**
 * PapaParse results structure
 * Note: All headers are transformed to lowercase by PapaParse transformHeaders method
 */
export interface PapaParseResults {
  /** Parsed data rows as objects */
  data: Record<string, unknown>[]
  /** Metadata about the parsing operation */
  meta: {
    /** Column names (lowercase) */
    fields?: string[]
    /** Detected delimiter character */
    delimiter?: string
    /** Detected line break character */
    linebreak?: string
    /** Whether parsing was aborted */
    aborted?: boolean
    /** Whether file was truncated */
    truncated?: boolean
  }
  /** Parse errors from PapaParse */
  errors: Array<{
    /** Error type */
    type: string
    /** Error code */
    code: string
    /** Error message */
    message: string
    /** Row number where error occurred */
    row?: number
  }>
}

/**
 * Row validation function signature
 */
export type RowValidator = (row: Record<string, unknown>) => boolean

/**
 * Detailed row validation result
 */
export interface RowValidationResult {
  /** Whether the row is valid */
  isValid: boolean
  /** Errors found in this row */
  errors: ValidationError[]
}
