# Data Import Wizard Components

A 5-step wizard for importing data files into IGS. Built with Svelte 5 using `$state`, `$derived`, and `$effect` runes.

## Components

### 1. DataTypeSelector.svelte

Grid of data type selection cards.

**Props:**

- `selectedType?: DataFileType | null` (bindable) - Currently selected data type
- `onSelect: (type: DataFileType) => void` - Callback when type is selected

**Usage:**

```svelte
<script>
  import { DataTypeSelector } from '$lib/components/wizard'

  let selectedType = $state(null)

  function handleSelect(type) {
    selectedType = type
    // Move to next step
  }
</script>

<DataTypeSelector bind:selectedType onSelect={handleSelect} />
```

### 2. FormatGuide.svelte

Shows format requirements, example data, and template download.

**Props:**

- `selectedDataType: DataFileType` - The selected data type
- `onDontShowAgain?: (value: boolean) => void` - Callback for "don't show again" checkbox

**Usage:**

```svelte
<FormatGuide
  selectedDataType={selectedType}
  onDontShowAgain={(value) => {
    localStorage.setItem('hideFormatGuide', value)
  }}
/>
```

### 3. FileUploadZone.svelte

Drag-and-drop file upload area with file list.

**Props:**

- `files?: WizardFile[]` (bindable) - Array of uploaded files
- `selectedDataType: DataFileType | null` - Selected data type (determines accepted files)
- `onFilesAdded: (files: File[]) => void` - Callback when files are added
- `onFileRemoved: (fileId: string) => void` - Callback when file is removed

**Types:**

```typescript
interface WizardFile {
  file: File
  id: string
  status: 'pending' | 'validating' | 'valid' | 'error'
  validationResult?: ValidationResult
}
```

**Usage:**

```svelte
<script>
  import { FileUploadZone, type WizardFile } from '$lib/components/wizard'

  let files = $state<WizardFile[]>([])

  function handleFilesAdded(newFiles: File[]) {
    const wizardFiles = newFiles.map((file) => ({
      file,
      id: crypto.randomUUID(),
      status: 'pending',
    }))
    files = [...files, ...wizardFiles]
    // Trigger validation
  }

  function handleFileRemoved(fileId: string) {
    files = files.filter((f) => f.id !== fileId)
  }
</script>

<FileUploadZone
  bind:files
  selectedDataType={selectedType}
  onFilesAdded={handleFilesAdded}
  onFileRemoved={handleFileRemoved}
/>
```

### 4. ValidationFeedback.svelte

Displays validation results with errors and warnings.

**Props:**

- `files: WizardFile[]` - Files with validation results
- `onFileSkipped?: (fileId: string) => void` - Callback to skip a file
- `onFileReplaced?: (fileId: string) => void` - Callback to replace a file

**Usage:**

```svelte
<ValidationFeedback
  {files}
  onFileSkipped={(fileId) => {
    files = files.filter((f) => f.id !== fileId)
  }}
  onFileReplaced={(fileId) => {
    // Trigger file selection for replacement
  }}
/>
```

### 5. ImportPreview.svelte

Final preview with import summary and options.

**Props:**

- `files: WizardFile[]` - Valid files to import
- `clearExisting?: boolean` (bindable) - Whether to clear existing data
- `onImport: () => void` - Callback to execute import
- `onClearExistingChange?: (value: boolean) => void` - Callback when clear option changes

**Usage:**

```svelte
<script>
  let clearExisting = $state(false)

  function handleImport() {
    if (clearExisting) {
      // Clear existing data
    }
    // Import files
  }
</script>

<ImportPreview {files} bind:clearExisting onImport={handleImport} />
```

## Complete Wizard Example

```svelte
<script lang="ts">
  import {
    DataTypeSelector,
    FormatGuide,
    FileUploadZone,
    ValidationFeedback,
    ImportPreview,
    type WizardFile,
  } from '$lib/components/wizard'
  import type { DataFileType } from '$lib/validation/types'
  import { validateCSV } from '$lib/validation'

  let currentStep = $state(1)
  let selectedType = $state<DataFileType | null>(null)
  let files = $state<WizardFile[]>([])
  let clearExisting = $state(false)

  const canProgress = $derived.by(() => {
    switch (currentStep) {
      case 1:
        return selectedType !== null
      case 2:
        return true
      case 3:
        return files.length > 0
      case 4:
        return files.some((f) => f.status === 'valid')
      case 5:
        return true
      default:
        return false
    }
  })

  async function handleFilesAdded(newFiles: File[]) {
    const wizardFiles = newFiles.map((file) => ({
      file,
      id: crypto.randomUUID(),
      status: 'validating' as const,
    }))

    files = [...files, ...wizardFiles]

    // Validate each file
    for (const wf of wizardFiles) {
      const result = await validateCSV(wf.file)
      const fileIndex = files.findIndex((f) => f.id === wf.id)
      if (fileIndex !== -1) {
        files[fileIndex].status = result.isValid ? 'valid' : 'error'
        files[fileIndex].validationResult = result
      }
    }
  }

  function handleImport() {
    const validFiles = files.filter((f) => f.status === 'valid')
    // Import logic here
    console.log('Importing', validFiles.length, 'files')
  }
</script>

<div class="wizard">
  <!-- Progress Indicator -->
  <ul class="steps mb-6">
    <li class="step {currentStep >= 1 ? 'step-primary' : ''}">Select Type</li>
    <li class="step {currentStep >= 2 ? 'step-primary' : ''}">Format Guide</li>
    <li class="step {currentStep >= 3 ? 'step-primary' : ''}">Upload Files</li>
    <li class="step {currentStep >= 4 ? 'step-primary' : ''}">Validation</li>
    <li class="step {currentStep >= 5 ? 'step-primary' : ''}">Import</li>
  </ul>

  <!-- Step Content -->
  <div class="card bg-base-100 shadow-xl">
    {#if currentStep === 1}
      <DataTypeSelector bind:selectedType onSelect={() => (currentStep = 2)} />
    {:else if currentStep === 2}
      <FormatGuide selectedDataType={selectedType} />
    {:else if currentStep === 3}
      <FileUploadZone
        bind:files
        selectedDataType={selectedType}
        onFilesAdded={handleFilesAdded}
        onFileRemoved={(id) => (files = files.filter((f) => f.id !== id))}
      />
    {:else if currentStep === 4}
      <ValidationFeedback {files} />
    {:else if currentStep === 5}
      <ImportPreview {files} bind:clearExisting onImport={handleImport} />
    {/if}
  </div>

  <!-- Navigation -->
  <div class="flex justify-between mt-6">
    <button class="btn" disabled={currentStep === 1} onclick={() => currentStep--}> Back </button>

    {#if currentStep < 5}
      <button class="btn btn-primary" disabled={!canProgress} onclick={() => currentStep++}>
        Next
      </button>
    {/if}
  </div>
</div>
```

## Styling

All components use DaisyUI classes and are fully responsive:

- Mobile: Single column stack
- Desktop: Grid layouts where appropriate
- Accessible: Proper ARIA labels, keyboard navigation, focus states

## Validation Integration

The wizard expects validation results from `/src/lib/validation/`:

```typescript
import type { ValidationResult } from '$lib/validation/types'
```

Make sure to integrate with your existing validation module to populate `validationResult` on `WizardFile` objects.
