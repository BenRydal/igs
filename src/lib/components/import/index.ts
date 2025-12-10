/**
 * Data Import Components
 *
 * A modal dialog for guided data import into IGS.
 * Supports movement, conversation, floorplan, video, and code data.
 *
 * @example
 * ```typescript
 * import { DataImporter } from '$lib/components/import';
 * import { openModal } from '$stores/modalStore';
 *
 * // Open the import dialog
 * openModal('fileImport');
 * ```
 *
 * @example
 * ```svelte
 * <script>
 *   import { DataImporter } from '$lib/components/import';
 *
 *   let isImportOpen = $state(false);
 *
 *   function handleImport(state) {
 *     console.log('Importing:', state);
 *   }
 * </script>
 *
 * <DataImporter
 *   isOpen={isImportOpen}
 *   onClose={() => isImportOpen = false}
 *   onImport={handleImport}
 * />
 * ```
 */

// Export main importer component
export { default as DataImporter } from './DataImporter.svelte'

// Export types
export type {
  DataType,
  ImportFile,
  ImportFileStatus,
  ImportState,
  ImportStep,
  ImportStepId,
} from './types'

export { IMPORT_STEPS, DEFAULT_IMPORT_STATE, SKIP_FORMAT_GUIDE_KEY } from './types'
