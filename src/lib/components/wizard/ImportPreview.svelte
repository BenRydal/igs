<script lang="ts">
  import type { WizardFile } from './FileUploadZone.svelte'
  import type { ValidationResult } from '$lib/validation/types'

  interface Props {
    files: WizardFile[]
    clearExisting?: boolean
    onImport: () => void
    onClearExistingChange?: (value: boolean) => void
  }

  let { files, clearExisting = $bindable(false), onImport, onClearExistingChange }: Props = $props()

  const validFiles = $derived(files.filter((f) => f.status === 'valid'))
  const totalRows = $derived(
    validFiles.reduce((sum, f) => sum + (f.validationResult?.stats?.totalRows || 0), 0)
  )

  let selectedFileForPreview = $state<WizardFile | null>(null)

  // Set initial preview file when validFiles changes
  $effect(() => {
    if (validFiles.length > 0 && !selectedFileForPreview) {
      selectedFileForPreview = validFiles[0]
    }
  })

  let previewData = $derived.by(() => {
    if (!selectedFileForPreview?.validationResult) return null

    const result = selectedFileForPreview.validationResult as ValidationResult

    return {
      columns: result.stats?.columns || [],
      rows: result.previewRows || [],
      stats: result.stats,
    }
  })

  function handleClearExistingChange() {
    onClearExistingChange?.(clearExisting)
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }
</script>

<div class="p-6">
  <h2 class="text-xl font-bold mb-2">Ready to Import</h2>
  <p class="text-sm text-gray-600 mb-6">Review your data before importing</p>

  <!-- Import Summary Stats -->
  <div class="stats shadow mb-6 w-full">
    <div class="stat">
      <div class="stat-title">Files</div>
      <div class="stat-value text-2xl text-primary">{validFiles.length}</div>
      <div class="stat-desc">Ready to import</div>
    </div>
    <div class="stat">
      <div class="stat-title">Total Rows</div>
      <div class="stat-value text-2xl">{totalRows.toLocaleString()}</div>
      <div class="stat-desc">Data points</div>
    </div>
    <div class="stat">
      <div class="stat-title">Total Size</div>
      <div class="stat-value text-2xl">
        {formatFileSize(validFiles.reduce((sum, f) => sum + f.file.size, 0))}
      </div>
      <div class="stat-desc">Combined file size</div>
    </div>
  </div>

  <!-- Files to Import List -->
  <div class="mb-6">
    <h3 class="font-semibold mb-3">Files to Import:</h3>
    <div class="space-y-2">
      {#each validFiles as file (file.id)}
        {@const result = file.validationResult as ValidationResult}
        <div
          class="card bg-base-100 border border-gray-200 cursor-pointer hover:border-primary transition-colors {selectedFileForPreview?.id ===
          file.id
            ? 'border-primary bg-primary/5'
            : ''}"
          onclick={() => (selectedFileForPreview = file)}
          role="button"
          tabindex="0"
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              selectedFileForPreview = file
            }
          }}
        >
          <div class="card-body p-4">
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <p class="font-medium truncate" title={file.file.name}>{file.file.name}</p>
                <p class="text-sm text-gray-500">
                  {result.fileType} • {result.stats?.totalRows} rows • {formatFileSize(
                    file.file.size
                  )}
                </p>
              </div>
              <div class="badge badge-success">✓ Valid</div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Data Preview -->
  {#if selectedFileForPreview && previewData}
    <div class="mb-6">
      <h3 class="font-semibold mb-3">Data Preview: {selectedFileForPreview.file.name}</h3>

      <div class="alert alert-info mb-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          class="stroke-current shrink-0 w-6 h-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <div class="text-sm">
          <p>
            <strong>Type:</strong>
            {previewData.stats?.columns.join(', ')}
          </p>
          <p>
            <strong>Rows:</strong>
            {previewData.stats?.totalRows.toLocaleString()}
          </p>
        </div>
      </div>

      <!-- Data table with preview -->
      {#if previewData.columns.length > 0}
        <div class="overflow-x-auto">
          <table class="table table-zebra table-sm">
            <thead>
              <tr>
                <th class="font-bold text-xs">#</th>
                {#each previewData.columns as column}
                  <th class="font-bold">{column}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#if previewData.rows && previewData.rows.length > 0}
                {#each previewData.rows.slice(0, 10) as row, index}
                  <tr>
                    <td class="text-gray-500 text-xs">{index + 1}</td>
                    {#each previewData.columns as column}
                      <td class="truncate max-w-[200px]" title={String(row[column] ?? '')}>
                        {row[column] ?? '—'}
                      </td>
                    {/each}
                  </tr>
                {/each}
              {:else}
                <tr>
                  <td
                    colspan={previewData.columns.length + 1}
                    class="text-center text-gray-500 py-4"
                  >
                    No preview data available
                  </td>
                </tr>
              {/if}
            </tbody>
          </table>
        </div>

        <!-- Row count info -->
        {#if previewData.rows && previewData.rows.length > 0}
          <p class="text-sm text-gray-500 mt-2">
            Showing first {Math.min(10, previewData.rows.length)} of {previewData.stats
              ?.totalRows ?? 0} rows
          </p>
        {/if}
      {/if}
    </div>
  {/if}

  <!-- Import Options -->
  <div class="card bg-base-200 mb-6">
    <div class="card-body p-4">
      <h3 class="font-semibold mb-3">Import Options</h3>

      <div class="form-control">
        <label class="label cursor-pointer justify-start gap-3">
          <input
            type="checkbox"
            bind:checked={clearExisting}
            onchange={handleClearExistingChange}
            class="checkbox checkbox-primary"
          />
          <div>
            <span class="label-text font-medium">Clear existing data before import</span>
            <p class="text-xs text-gray-500 mt-1">
              Remove all currently loaded data and replace with these files
            </p>
          </div>
        </label>
      </div>
    </div>
  </div>

  <!-- Import Summary -->
  <div class="alert alert-success mb-6">
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
    <div>
      <p class="font-semibold">Ready to Import</p>
      <p class="text-sm">
        {validFiles.length} file{validFiles.length !== 1 ? 's' : ''} with {totalRows.toLocaleString()}
        total rows
      </p>
      {#if clearExisting}
        <p class="text-sm text-warning">⚠ Existing data will be cleared</p>
      {/if}
    </div>
  </div>

  <!-- Import Action -->
  <div class="flex justify-center">
    <button class="btn btn-primary btn-lg" onclick={onImport}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6 mr-2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
        />
      </svg>
      Import All Data
    </button>
  </div>
</div>
