/**
 * Import types for guided data import
 */

import type { ValidationResult } from '$lib/validation'

/**
 * Supported data types for import
 */
export type DataType = 'movement' | 'conversation' | 'floorplan' | 'video' | 'codes'

/**
 * File upload and validation status
 */
export type ImportFileStatus = 'pending' | 'validating' | 'valid' | 'error'

/**
 * File with validation state and preview data
 */
export interface ImportFile {
  /** The actual File object */
  file: File
  /** Unique identifier for this file */
  id: string
  /** Current validation status of the file */
  status: ImportFileStatus
  /** Selected data type for this file */
  dataType?: DataType
  /** Validation result after checking the file */
  validationResult?: ValidationResult
  /** Preview data (first 10 rows for CSV files) */
  preview?: any[]
  /** Error message if validation failed */
  errorMessage?: string
}

/**
 * Current state of the importer
 */
export interface ImportState {
  /** Current step index (0-4) */
  currentStep: number
  /** Selected data type (null if not yet selected) */
  selectedDataType: DataType | null
  /** Files uploaded for import */
  files: ImportFile[]
  /** User preference to skip format guide step */
  skipFormatGuide: boolean
  /** Whether to clear existing data before import */
  clearExistingData: boolean
}

/**
 * Import step configuration
 */
export interface ImportStep {
  /** Step identifier */
  id: string
  /** Display label for the step */
  label: string
  /** Icon/emoji for the step */
  icon: string
}

/**
 * Import step definitions
 */
export const IMPORT_STEPS: readonly ImportStep[] = [
  { id: 'type', label: 'Data Type', icon: '📊' },
  { id: 'format', label: 'Format Guide', icon: '📋' },
  { id: 'upload', label: 'Upload', icon: '📁' },
  { id: 'validate', label: 'Validate', icon: '✓' },
  { id: 'preview', label: 'Import', icon: '🚀' },
] as const

/**
 * Type for import step IDs
 */
export type ImportStepId = (typeof IMPORT_STEPS)[number]['id']

/**
 * Local storage key for skip format guide preference
 */
export const SKIP_FORMAT_GUIDE_KEY = 'igs:import:skipFormatGuide'

/**
 * Default import state
 */
export const DEFAULT_IMPORT_STATE: ImportState = {
  currentStep: 0,
  selectedDataType: null,
  files: [],
  skipFormatGuide: false,
  clearExistingData: false,
}
