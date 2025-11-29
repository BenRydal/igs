/**
 * Wizard types for guided data import
 */

import type { ValidationResult } from '$lib/validation'

/**
 * Supported data types for import
 */
export type DataType = 'movement' | 'conversation' | 'floorplan' | 'video' | 'codes'

/**
 * File with validation state and preview data
 */
export interface WizardFile {
  /** The actual File object */
  file: File
  /** Unique identifier for this file */
  id: string
  /** Selected data type for this file */
  dataType?: DataType
  /** Validation result after checking the file */
  validationResult?: ValidationResult
  /** Preview data (first 10 rows for CSV files) */
  preview?: any[]
  /** Whether this file passed validation */
  isValid: boolean
  /** Error message if validation failed */
  errorMessage?: string
}

/**
 * Current state of the wizard
 */
export interface WizardState {
  /** Current step index (0-4) */
  currentStep: number
  /** Selected data type (null if not yet selected) */
  selectedDataType: DataType | null
  /** Files uploaded for import */
  files: WizardFile[]
  /** User preference to skip format guide step */
  skipFormatGuide: boolean
  /** Whether to clear existing data before import */
  clearExistingData: boolean
}

/**
 * Wizard step configuration
 */
export interface WizardStep {
  /** Step identifier */
  id: string
  /** Display label for the step */
  label: string
  /** Icon/emoji for the step */
  icon: string
}

/**
 * Wizard step definitions
 */
export const WIZARD_STEPS: readonly WizardStep[] = [
  { id: 'type', label: 'Data Type', icon: '📊' },
  { id: 'format', label: 'Format Guide', icon: '📋' },
  { id: 'upload', label: 'Upload', icon: '📁' },
  { id: 'validate', label: 'Validate', icon: '✓' },
  { id: 'preview', label: 'Import', icon: '🚀' },
] as const

/**
 * Type for wizard step IDs
 */
export type WizardStepId = (typeof WIZARD_STEPS)[number]['id']

/**
 * Local storage key for skip format guide preference
 */
export const SKIP_FORMAT_GUIDE_KEY = 'igs:wizard:skipFormatGuide'

/**
 * Default wizard state
 */
export const DEFAULT_WIZARD_STATE: WizardState = {
  currentStep: 0,
  selectedDataType: null,
  files: [],
  skipFormatGuide: false,
  clearExistingData: false,
}
