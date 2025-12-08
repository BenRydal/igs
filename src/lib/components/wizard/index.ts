/**
 * Data Import Wizard Components
 *
 * A multi-step modal wizard for guided data import into IGS.
 * Supports movement, conversation, floorplan, video, and code data.
 *
 * @example
 * ```typescript
 * import { DataImportWizard } from '$lib/components/wizard';
 * import { openModal } from '$stores/modalStore';
 *
 * // Open the wizard
 * openModal('importWizard');
 * ```
 *
 * @example
 * ```svelte
 * <script>
 *   import { DataImportWizard } from '$lib/components/wizard';
 *
 *   let isWizardOpen = $state(false);
 *
 *   function handleImport(state) {
 *     console.log('Importing:', state);
 *   }
 * </script>
 *
 * <DataImportWizard
 *   isOpen={isWizardOpen}
 *   onClose={() => isWizardOpen = false}
 *   onImport={handleImport}
 * />
 * ```
 */

// Export main wizard component
export { default as DataImportWizard } from './DataImportWizard.svelte'

// Export progress indicator component
export { default as WizardSteps } from './WizardSteps.svelte'

// Export types
export type {
  DataType,
  WizardFile,
  WizardFileStatus,
  WizardState,
  WizardStep,
  WizardStepId,
} from './types'

export { WIZARD_STEPS, DEFAULT_WIZARD_STATE, SKIP_FORMAT_GUIDE_KEY } from './types'
