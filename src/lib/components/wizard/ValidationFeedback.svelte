<script lang="ts">
  import type { WizardFile } from './FileUploadZone.svelte'
  import type { ValidationResult, ValidationError, ValidationWarning } from '$lib/validation/types'

  interface Props {
    files: WizardFile[]
    onFileSkipped?: (fileId: string) => void
    onFileReplaced?: (fileId: string) => void
  }

  let { files, onFileSkipped, onFileReplaced }: Props = $props()

  let expandedFileIds = $state<Set<string>>(new Set())

  const validFiles = $derived(files.filter((f) => f.status === 'valid'))
  const errorFiles = $derived(files.filter((f) => f.status === 'error'))
  const hasBlockingErrors = $derived(errorFiles.length > 0)

  function toggleExpand(fileId: string) {
    const newSet = new Set(expandedFileIds)
    if (newSet.has(fileId)) {
      newSet.delete(fileId)
    } else {
      newSet.add(fileId)
    }
    expandedFileIds = newSet
  }

  function getStatusIcon(status: WizardFile['status']) {
    switch (status) {
      case 'valid':
        return '✓'
      case 'error':
        return '✗'
      case 'validating':
        return '⏳'
      default:
        return '⚠'
    }
  }

  function getStatusClass(status: WizardFile['status']) {
    switch (status) {
      case 'valid':
        return 'text-success'
      case 'error':
        return 'text-error'
      case 'validating':
        return 'text-warning'
      default:
        return 'text-gray-500'
    }
  }
</script>

<div class="p-6">
  <h2 class="text-xl font-bold mb-2">Validation Results</h2>
  <p class="text-sm text-gray-600 mb-6">Review validation feedback for your uploaded files</p>

  <!-- Summary -->
  <div class="stats shadow mb-6 w-full">
    <div class="stat">
      <div class="stat-title">Total Files</div>
      <div class="stat-value text-2xl">{files.length}</div>
    </div>
    <div class="stat">
      <div class="stat-title">Valid</div>
      <div class="stat-value text-2xl text-success">{validFiles.length}</div>
    </div>
    <div class="stat">
      <div class="stat-title">Errors</div>
      <div class="stat-value text-2xl text-error">{errorFiles.length}</div>
    </div>
  </div>

  <!-- Blocking Errors Alert -->
  {#if hasBlockingErrors}
    <div class="alert alert-error mb-6">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="stroke-current shrink-0 h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>Some files have errors that must be fixed before importing.</span>
    </div>
  {/if}

  <!-- File Results -->
  <div class="space-y-4">
    {#each files as file (file.id)}
      {@const result = file.validationResult as ValidationResult | undefined}
      {@const isExpanded = expandedFileIds.has(file.id)}

      <div
        class="card bg-base-100 border-2 {file.status === 'error'
          ? 'border-error'
          : file.status === 'valid'
            ? 'border-success'
            : 'border-gray-200'}"
      >
        <div class="card-body p-4">
          <!-- File Header -->
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <div class="text-2xl {getStatusClass(file.status)}">
                {getStatusIcon(file.status)}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium truncate" title={file.file.name}>{file.file.name}</p>
                {#if result?.stats}
                  <p class="text-sm text-gray-500">
                    {result.stats.totalRows} rows
                    {#if result.stats.validRows !== result.stats.totalRows}
                      ({result.stats.validRows} valid, {result.stats.invalidRows} invalid)
                    {/if}
                  </p>
                {/if}
              </div>
            </div>

            <div class="flex gap-2">
              <!-- Status Badge -->
              <div
                class="badge {file.status === 'valid'
                  ? 'badge-success'
                  : file.status === 'error'
                    ? 'badge-error'
                    : 'badge-warning'}"
              >
                {file.status}
              </div>
            </div>
          </div>

          <!-- Errors and Warnings -->
          {#if result}
            {#if result.errors.length > 0}
              <div class="mt-3">
                <h4 class="font-semibold text-error mb-2">
                  Errors ({result.errors.length})
                </h4>
                <div class="space-y-1">
                  {#each result.errors.slice(0, isExpanded ? undefined : 3) as error}
                    <div class="alert alert-error py-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="stroke-current shrink-0 h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div class="text-sm">
                        {#if error.row}
                          <span class="font-medium">Row {error.row}:</span>
                        {/if}
                        {#if error.column}
                          <span class="font-medium">[{error.column}]</span>
                        {/if}
                        {error.message}
                      </div>
                    </div>
                  {/each}
                  {#if result.errors.length > 3 && !isExpanded}
                    <button class="btn btn-ghost btn-sm" onclick={() => toggleExpand(file.id)}>
                      Show {result.errors.length - 3} more errors
                    </button>
                  {/if}
                </div>
              </div>
            {/if}

            {#if result.warnings.length > 0}
              <div class="mt-3">
                <h4 class="font-semibold text-warning mb-2">
                  Warnings ({result.warnings.length})
                </h4>
                <div class="space-y-1">
                  {#each result.warnings.slice(0, isExpanded ? undefined : 2) as warning}
                    <div class="alert alert-warning py-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="stroke-current shrink-0 h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <div class="text-sm">
                        {#if warning.row}
                          <span class="font-medium">Row {warning.row}:</span>
                        {/if}
                        {#if warning.column}
                          <span class="font-medium">[{warning.column}]</span>
                        {/if}
                        {warning.message}
                      </div>
                    </div>
                  {/each}
                  {#if result.warnings.length > 2 && !isExpanded}
                    <button class="btn btn-ghost btn-sm" onclick={() => toggleExpand(file.id)}>
                      Show {result.warnings.length - 2} more warnings
                    </button>
                  {/if}
                </div>
              </div>
            {/if}
          {/if}

          <!-- Actions -->
          {#if file.status === 'error'}
            <div class="flex gap-2 mt-3">
              {#if onFileSkipped}
                <button class="btn btn-sm btn-ghost" onclick={() => onFileSkipped?.(file.id)}>
                  Skip This File
                </button>
              {/if}
              {#if onFileReplaced}
                <button class="btn btn-sm btn-primary" onclick={() => onFileReplaced?.(file.id)}>
                  Replace File
                </button>
              {/if}
              {#if result && (result.errors.length > 3 || result.warnings.length > 2)}
                <button class="btn btn-sm btn-ghost ml-auto" onclick={() => toggleExpand(file.id)}>
                  {isExpanded ? 'Show Less' : 'View Details'}
                </button>
              {/if}
            </div>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  <!-- Summary Footer -->
  <div class="mt-6">
    {#if validFiles.length === files.length}
      <div class="alert alert-success">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="stroke-current shrink-0 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>All files are valid and ready to import!</span>
      </div>
    {:else if validFiles.length > 0}
      <div class="alert alert-warning">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="stroke-current shrink-0 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span>{validFiles.length} of {files.length} files ready to import</span>
      </div>
    {/if}
  </div>
</div>
