/**
 * CSV validation functions for different data file types
 */

import type {
  DataFileType,
  PapaParseResults,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  DataStats,
  RowValidationResult,
  RowValidator,
} from './types'
import {
  MOVEMENT_HEADERS,
  CONVERSATION_HEADERS,
  SINGLE_CODE_HEADERS,
  MULTI_CODE_HEADERS,
  ERROR_CODES,
  WARNING_CODES,
  VALIDATION_LIMITS,
  validateMovementRow,
  validateConversationRow,
  validateSingleCodeRow,
  validateMultiCodeRow,
  includesAllHeaders,
  getMissingHeaders,
  getExpectedType,
  isCSVInjection,
  isValidStringLength,
  isValidCoordinate,
  isValidTime,
} from './rules'

/**
 * Core validation function for PapaParse results
 */
const validatePapaParseResults = (
  results: PapaParseResults,
  fileType: DataFileType,
  requiredHeaders: readonly string[],
  rowValidator: RowValidator
): ValidationResult => {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // Check for data
  if (!results.data || results.data.length === 0) {
    errors.push({
      code: ERROR_CODES.NO_DATA,
      message: 'No data found in file. The file appears to be empty.',
    })

    return {
      isValid: false,
      fileType,
      errors,
      warnings,
      stats: {
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        columns: results.meta.fields || [],
      },
      previewRows: [],
    }
  }

  // Check for required headers
  const hasAllHeaders = includesAllHeaders(results.meta.fields, requiredHeaders)
  if (!hasAllHeaders) {
    const missingHeaders = getMissingHeaders(results.meta.fields, requiredHeaders)
    errors.push({
      code: ERROR_CODES.MISSING_HEADERS,
      message: `Missing required columns: ${missingHeaders.join(', ')}. Found columns: ${results.meta.fields?.join(', ') || 'none'}.`,
    })

    return {
      isValid: false,
      fileType,
      errors,
      warnings,
      stats: {
        totalRows: results.data.length,
        validRows: 0,
        invalidRows: results.data.length,
        columns: results.meta.fields || [],
      },
      previewRows: results.data.slice(0, 10),
    }
  }

  // Add PapaParse errors to our errors list
  if (results.errors && results.errors.length > 0) {
    results.errors.forEach((error) => {
      errors.push({
        code: ERROR_CODES.PARSE_ERROR,
        message: `Parse error: ${error.message}`,
        row: error.row,
      })
    })
  }

  // Add truncation warning
  if (results.meta.truncated) {
    warnings.push({
      code: WARNING_CODES.TRUNCATED_FILE,
      message: 'File was truncated during parsing. Some data may be missing.',
    })
  }

  // Validate rows and collect detailed errors
  let validRows = 0
  let invalidRows = 0
  const rowErrors: Array<{ row: number; errors: ValidationError[] }> = []

  results.data.forEach((row, index) => {
    const rowNum = index + 1 // 1-indexed for user-friendly messages
    const rowValidation = validateRowDetailed(row, requiredHeaders, rowValidator, fileType)

    if (rowValidation.isValid) {
      validRows++
    } else {
      invalidRows++
      rowErrors.push({ row: rowNum, errors: rowValidation.errors })
    }
  })

  // Check if at least one row is valid
  if (validRows === 0) {
    errors.push({
      code: ERROR_CODES.NO_VALID_ROWS,
      message: `No valid rows found. All ${results.data.length} rows failed validation.`,
    })

    // Add first few row errors as examples
    const exampleErrors = rowErrors.slice(0, 3)
    exampleErrors.forEach(({ row, errors: rowErrs }) => {
      rowErrs.forEach((err) => {
        errors.push({
          ...err,
          row,
          message: `Row ${row}: ${err.message}`,
        })
      })
    })

    if (rowErrors.length > 3) {
      errors.push({
        code: ERROR_CODES.NO_VALID_ROWS,
        message: `...and ${rowErrors.length - 3} more rows with errors.`,
      })
    }

    return {
      isValid: false,
      fileType,
      errors,
      warnings,
      stats: {
        totalRows: results.data.length,
        validRows: 0,
        invalidRows: results.data.length,
        columns: results.meta.fields || [],
      },
      previewRows: results.data.slice(0, 10),
    }
  }

  // Add warning about skipped rows if any
  if (invalidRows > 0) {
    warnings.push({
      code: WARNING_CODES.SKIPPED_INVALID_ROWS,
      message: `${invalidRows} of ${results.data.length} rows will be skipped due to validation errors.`,
    })

    // Add details about first few invalid rows
    const exampleErrors = rowErrors.slice(0, 3)
    exampleErrors.forEach(({ row, errors: rowErrs }) => {
      rowErrs.forEach((err) => {
        warnings.push({
          ...err,
          row,
          message: `Row ${row}: ${err.message}`,
        })
      })
    })
  }

  return {
    isValid: true,
    fileType,
    errors,
    warnings,
    stats: {
      totalRows: results.data.length,
      validRows,
      invalidRows,
      columns: results.meta.fields || [],
    },
    previewRows: results.data.slice(0, 10),
  }
}

/**
 * Validate a single row and return detailed errors
 */
const validateRowDetailed = (
  row: Record<string, unknown>,
  requiredHeaders: readonly string[],
  rowValidator: RowValidator,
  fileType: DataFileType
): RowValidationResult => {
  const errors: ValidationError[] = []

  // Check each required field
  requiredHeaders.forEach((header) => {
    const value = row[header]
    const expectedType = getExpectedType(header, fileType)

    // Check if field exists
    if (value === null || value === undefined) {
      errors.push({
        code: ERROR_CODES.EMPTY_REQUIRED_FIELD,
        message: `Column '${header}' is empty or missing.`,
        column: header,
      })
      return
    }

    // Check type
    let isValidType = false

    if (fileType === 'movement' || fileType === 'singleCode') {
      isValidType = typeof value === 'number'
    } else if (fileType === 'conversation') {
      if (header === 'time') {
        isValidType = typeof value === 'number'
      } else if (header === 'speaker') {
        isValidType = typeof value === 'string'
      } else if (header === 'talk') {
        isValidType =
          typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
      }
    } else if (fileType === 'multiCode') {
      if (header === 'code') {
        isValidType = typeof value === 'string'
      } else {
        isValidType = typeof value === 'number'
      }
    }

    if (!isValidType) {
      errors.push({
        code: ERROR_CODES.INVALID_TYPE,
        message: `Column '${header}' has invalid type. Expected ${expectedType}, got ${typeof value}.`,
        column: header,
      })
      return
    }

    // Security validation for string fields
    if (typeof value === 'string') {
      // Check for CSV injection
      if (isCSVInjection(value)) {
        errors.push({
          code: ERROR_CODES.INVALID_TYPE,
          message: `Column '${header}' contains potentially dangerous formula character. Values cannot start with =, +, -, @, tab, or carriage return.`,
          column: header,
        })
        return
      }

      // Check string length limits based on field type
      let maxLength: number = VALIDATION_LIMITS.MAX_STRING_LENGTH
      if (header === 'speaker') {
        maxLength = VALIDATION_LIMITS.MAX_SPEAKER_LENGTH
      } else if (header === 'code') {
        maxLength = VALIDATION_LIMITS.MAX_CODE_LENGTH
      }

      if (!isValidStringLength(value, maxLength)) {
        errors.push({
          code: ERROR_CODES.INVALID_TYPE,
          message: `Column '${header}' exceeds maximum length of ${maxLength} characters.`,
          column: header,
        })
        return
      }
    }

    // Security validation for numeric fields
    if (typeof value === 'number') {
      // Validate coordinates
      if (header === 'x' || header === 'y') {
        if (!isValidCoordinate(value)) {
          errors.push({
            code: ERROR_CODES.INVALID_TYPE,
            message: `Column '${header}' value ${value} is out of valid range (${VALIDATION_LIMITS.MIN_COORDINATE} to ${VALIDATION_LIMITS.MAX_COORDINATE}).`,
            column: header,
          })
          return
        }
      }

      // Validate time values
      if (header === 'time' || header === 'start' || header === 'end') {
        if (!isValidTime(value)) {
          errors.push({
            code: ERROR_CODES.INVALID_TYPE,
            message: `Column '${header}' value ${value} is out of valid range (${VALIDATION_LIMITS.MIN_TIME} to ${VALIDATION_LIMITS.MAX_TIME} seconds).`,
            column: header,
          })
          return
        }
      }
    }
  })

  // Final check using the row validator
  const isValid = errors.length === 0 && rowValidator(row)

  return {
    isValid,
    errors,
  }
}

/**
 * Validate movement data file
 * Required columns: time (number), x (number), y (number)
 */
export const validateMovementData = (results: PapaParseResults): ValidationResult => {
  return validatePapaParseResults(results, 'movement', MOVEMENT_HEADERS, validateMovementRow)
}

/**
 * Validate conversation data file
 * Required columns: time (number), speaker (string), talk (string|number|boolean)
 */
export const validateConversationData = (results: PapaParseResults): ValidationResult => {
  return validatePapaParseResults(
    results,
    'conversation',
    CONVERSATION_HEADERS,
    validateConversationRow
  )
}

/**
 * Validate single code data file
 * Required columns: start (number), end (number)
 */
export const validateSingleCodeData = (results: PapaParseResults): ValidationResult => {
  return validatePapaParseResults(results, 'singleCode', SINGLE_CODE_HEADERS, validateSingleCodeRow)
}

/**
 * Validate multi-code data file
 * Required columns: code (string), start (number), end (number)
 */
export const validateMultiCodeData = (results: PapaParseResults): ValidationResult => {
  return validatePapaParseResults(results, 'multiCode', MULTI_CODE_HEADERS, validateMultiCodeRow)
}

/**
 * Detect file type based on headers
 * Returns the most specific type that matches, or 'unknown' if no match
 */
export const detectFileType = (results: PapaParseResults): DataFileType => {
  if (!results.meta.fields) {
    return 'unknown'
  }

  const fields = results.meta.fields

  // Check for multi-code (most specific, includes all single code headers + code)
  if (includesAllHeaders(fields, MULTI_CODE_HEADERS)) {
    // Verify at least one row matches multi-code pattern
    const hasValidRow = results.data.some((row) => validateMultiCodeRow(row))
    if (hasValidRow) return 'multiCode'
  }

  // Check for single code
  if (includesAllHeaders(fields, SINGLE_CODE_HEADERS)) {
    const hasValidRow = results.data.some((row) => validateSingleCodeRow(row))
    if (hasValidRow) return 'singleCode'
  }

  // Check for conversation
  if (includesAllHeaders(fields, CONVERSATION_HEADERS)) {
    const hasValidRow = results.data.some((row) => validateConversationRow(row))
    if (hasValidRow) return 'conversation'
  }

  // Check for movement
  if (includesAllHeaders(fields, MOVEMENT_HEADERS)) {
    const hasValidRow = results.data.some((row) => validateMovementRow(row))
    if (hasValidRow) return 'movement'
  }

  return 'unknown'
}

/**
 * Validate CSV data with automatic file type detection
 * This is the main entry point for validation
 */
export const validateCSV = (results: PapaParseResults): ValidationResult => {
  const fileType = detectFileType(results)

  if (fileType === 'unknown') {
    return {
      isValid: false,
      fileType: 'unknown',
      errors: [
        {
          code: ERROR_CODES.MISSING_HEADERS,
          message: `Could not detect file type. File must contain one of these column sets:
- Movement: ${MOVEMENT_HEADERS.join(', ')}
- Conversation: ${CONVERSATION_HEADERS.join(', ')}
- Single Code: ${SINGLE_CODE_HEADERS.join(', ')}
- Multi Code: ${MULTI_CODE_HEADERS.join(', ')}

Found columns: ${results.meta.fields?.join(', ') || 'none'}`,
        },
      ],
      warnings: [],
      stats: {
        totalRows: results.data?.length || 0,
        validRows: 0,
        invalidRows: results.data?.length || 0,
        columns: results.meta.fields || [],
      },
      previewRows: results.data?.slice(0, 10) || [],
    }
  }

  // Validate based on detected type
  switch (fileType) {
    case 'movement':
      return validateMovementData(results)
    case 'conversation':
      return validateConversationData(results)
    case 'singleCode':
      return validateSingleCodeData(results)
    case 'multiCode':
      return validateMultiCodeData(results)
    default:
      // This should never happen due to the check above, but TypeScript needs it
      return {
        isValid: false,
        fileType: 'unknown',
        errors: [
          { code: ERROR_CODES.NO_DATA, message: 'Unknown error occurred during validation.' },
        ],
        warnings: [],
        previewRows: [],
      }
  }
}
