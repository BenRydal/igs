<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { Z_INDEX } from '$lib/styles/z-index'
  import { formatFileSize, getFileSizeLimit } from '$lib/validation/rules'
  import { toastStore } from '../../../stores/toastStore'

  interface Props {
    /** Whether the dialog is open */
    isOpen: boolean
    /** Callback when dialog is closed */
    onClose: () => void
    /** Callback when files should be imported */
    onImport?: (files: File[], clearExisting: boolean) => void | Promise<void>
  }

  let { isOpen = false, onClose, onImport }: Props = $props()

  // State
  let files = $state<File[]>([])
  let isDragOver = $state(false)
  let clearExistingData = $state(false)

  // File type info for display
  const fileTypeInfo: Record<string, { label: string; icon: string; color: string }> = {
    csv: { label: 'CSV Data', icon: '📊', color: 'badge-info' },
    png: { label: 'Floor Plan', icon: '🗺️', color: 'badge-success' },
    jpg: { label: 'Floor Plan', icon: '🗺️', color: 'badge-success' },
    jpeg: { label: 'Floor Plan', icon: '🗺️', color: 'badge-success' },
    mp4: { label: 'Video', icon: '🎬', color: 'badge-warning' },
  }

  /**
   * Get file extension
   */
  function getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || ''
  }

  /**
   * Get file type display info
   */
  function getFileTypeDisplay(file: File) {
    const ext = getFileExtension(file.name)
    return fileTypeInfo[ext] || { label: 'Unknown', icon: '📄', color: 'badge-ghost' }
  }

  /**
   * Validate file size
   */
  function validateFileSize(file: File): { valid: boolean; limit?: number } {
    const limit = getFileSizeLimit(file.name)
    return {
      valid: file.size <= limit,
      limit: limit,
    }
  }

  /**
   * Handle file drop
   */
  async function handleDrop(event: DragEvent) {
    event.preventDefault()
    isDragOver = false

    const droppedFiles = event.dataTransfer?.files
    if (!droppedFiles) return

    try {
      await addFiles(Array.from(droppedFiles))
    } catch (error) {
      console.error('Drop error:', error)
      toastStore.error(error instanceof Error ? error.message : 'Failed to process dropped files')
    }
  }

  /**
   * Handle drag over
   */
  function handleDragOver(event: DragEvent) {
    event.preventDefault()
    isDragOver = true
  }

  /**
   * Handle drag leave
   */
  function handleDragLeave(event: DragEvent) {
    event.preventDefault()
    isDragOver = false
  }

  /**
   * Handle file input change
   */
  async function handleFileInput(event: Event) {
    const input = event.target as HTMLInputElement
    if (!input.files) return

    try {
      await addFiles(Array.from(input.files))
    } catch (error) {
      console.error('File input error:', error)
      toastStore.error(error instanceof Error ? error.message : 'Failed to process files')
    } finally {
      // Reset input so same file can be selected again
      input.value = ''
    }
  }

  /**
   * Add files to the list
   */
  async function addFiles(newFiles: File[]): Promise<void> {
    try {
      // Filter to only supported file types
      const supportedExtensions = ['csv', 'png', 'jpg', 'jpeg', 'mp4', 'gpx']
      const validFiles = newFiles.filter((file) => {
        const ext = getFileExtension(file.name)
        return supportedExtensions.includes(ext)
      })

      // Check if any unsupported files were filtered out
      const unsupportedCount = newFiles.length - validFiles.length
      if (unsupportedCount > 0) {
        toastStore.error(
          `${unsupportedCount} file${unsupportedCount > 1 ? 's' : ''} skipped (unsupported type)`,
          { duration: 3000 }
        )
      }

      // Validate file sizes
      const oversizedFiles: Array<{ name: string; size: number; limit: number }> = []
      const sizeValidFiles = validFiles.filter((file) => {
        const { valid, limit } = validateFileSize(file)
        if (!valid && limit) {
          oversizedFiles.push({ name: file.name, size: file.size, limit })
          return false
        }
        return true
      })

      // Show error toast for oversized files
      if (oversizedFiles.length > 0) {
        const fileList = oversizedFiles
          .map(
            (f) => `${f.name} (${formatFileSize(f.size)} exceeds ${formatFileSize(f.limit)} limit)`
          )
          .join(', ')
        toastStore.error(
          `${oversizedFiles.length} file${oversizedFiles.length > 1 ? 's' : ''} too large: ${fileList}`,
          { duration: 5000 }
        )
      }

      // Avoid duplicates by name
      const existingNames = new Set(files.map((f) => f.name))
      const uniqueFiles = sizeValidFiles.filter((f) => !existingNames.has(f.name))

      // Check if any duplicates were filtered out
      const duplicateCount = sizeValidFiles.length - uniqueFiles.length
      if (duplicateCount > 0) {
        toastStore.error(
          `${duplicateCount} duplicate file${duplicateCount > 1 ? 's' : ''} skipped`,
          { duration: 3000 }
        )
      }

      if (uniqueFiles.length === 0) {
        if (
          newFiles.length > 0 &&
          unsupportedCount === 0 &&
          oversizedFiles.length === 0 &&
          duplicateCount === 0
        ) {
          throw new Error('No valid files to add')
        }
        return
      }

      files = [...files, ...uniqueFiles]

      // Show success toast for added files
      toastStore.success(`Added ${uniqueFiles.length} file${uniqueFiles.length > 1 ? 's' : ''}`, {
        duration: 2000,
      })
    } catch (error) {
      console.error('Error adding files:', error)
      throw error instanceof Error ? error : new Error('Failed to add files')
    }
  }

  /**
   * Remove a file from the list
   */
  function removeFile(index: number) {
    files = files.filter((_, i) => i !== index)
  }

  /**
   * Clear all files
   */
  function clearFiles() {
    files = []
  }

  /**
   * Handle import action
   */
  async function handleImport() {
    if (files.length === 0) return

    try {
      if (onImport) {
        await onImport(files, clearExistingData)
      }
      handleClose()
    } catch (error) {
      console.error('Import error:', error)
      toastStore.error(error instanceof Error ? error.message : 'Failed to import files')
    }
  }

  /**
   * Handle dialog close
   */
  function handleClose() {
    files = []
    clearExistingData = false
    isDragOver = false
    onClose()
  }

  /**
   * Handle Escape key
   */
  function handleKeyDown(event: KeyboardEvent) {
    if (!isOpen) return
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      handleClose()
    }
  }

  /**
   * Handle backdrop click
   */
  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleClose()
    }
  }

  onMount(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown)
    }
  })

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleKeyDown)
    }
  })
</script>

{#if isOpen}
  <div
    class="modal modal-open"
    style="z-index: {Z_INDEX.MODAL}"
    onclick={handleBackdropClick}
    role="dialog"
    aria-modal="true"
    aria-labelledby="import-title"
    tabindex="-1"
  >
    <div class="modal-box w-11/12 max-w-2xl">
      <!-- Header -->
      <div class="flex justify-between items-center mb-4">
        <h3 id="import-title" class="font-bold text-xl">Import Data</h3>
        <button class="btn btn-circle btn-sm btn-ghost" onclick={handleClose} aria-label="Close">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Supported file types info -->
      <div class="mb-4 flex flex-wrap gap-2 justify-center">
        <span class="badge badge-outline gap-1">📊 CSV</span>
        <span class="badge badge-outline gap-1">🗺️ PNG/JPG</span>
        <span class="badge badge-outline gap-1">🎬 MP4</span>
      </div>

      <!-- Drop Zone -->
      <div
        class="border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
               {isDragOver
          ? 'border-primary bg-primary/10'
          : 'border-base-300 hover:border-primary/50'}"
        ondrop={handleDrop}
        ondragover={handleDragOver}
        ondragleave={handleDragLeave}
        onclick={() => document.getElementById('file-input-import')?.click()}
        onkeydown={(e) =>
          e.key === 'Enter' && document.getElementById('file-input-import')?.click()}
        role="button"
        tabindex="0"
        aria-label="Drop files here or click to browse"
      >
        <input
          id="file-input-import"
          type="file"
          multiple
          accept=".csv,.png,.jpg,.jpeg,.mp4,.gpx"
          onchange={handleFileInput}
          class="hidden"
        />

        <div class="text-4xl mb-3">{isDragOver ? '📥' : '📂'}</div>
        <p class="text-lg font-medium mb-1">
          {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p class="text-sm text-base-content/60">or click to browse</p>
      </div>

      <!-- File List -->
      {#if files.length > 0}
        <div class="mt-4">
          <div class="flex justify-between items-center mb-2">
            <span class="font-medium"
              >{files.length} file{files.length !== 1 ? 's' : ''} selected</span
            >
            <button class="btn btn-ghost btn-xs" onclick={clearFiles}>Clear all</button>
          </div>

          <div class="space-y-2 max-h-48 overflow-y-auto">
            {#each files as file, index}
              {@const typeInfo = getFileTypeDisplay(file)}
              <div class="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                <div class="flex items-center gap-3 min-w-0">
                  <span class="text-xl flex-shrink-0">{typeInfo.icon}</span>
                  <div class="min-w-0">
                    <p class="font-medium truncate">{file.name}</p>
                    <div class="flex items-center gap-2 text-sm text-base-content/60">
                      <span class="badge {typeInfo.color} badge-sm">{typeInfo.label}</span>
                      <span>{formatFileSize(file.size)}</span>
                    </div>
                  </div>
                </div>
                <button
                  class="btn btn-ghost btn-sm btn-circle flex-shrink-0"
                  onclick={() => removeFile(index)}
                  aria-label="Remove {file.name}"
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Clear existing data option -->
      <div class="form-control mt-4">
        <label class="label cursor-pointer justify-start gap-3">
          <input
            type="checkbox"
            bind:checked={clearExistingData}
            class="checkbox checkbox-warning checkbox-sm"
          />
          <span class="label-text">Clear existing data before import</span>
        </label>
      </div>

      <!-- Footer -->
      <div class="modal-action">
        <button class="btn btn-ghost" onclick={handleClose}>Cancel</button>
        <button class="btn btn-primary" onclick={handleImport} disabled={files.length === 0}>
          Import {files.length > 0 ? `${files.length} file${files.length !== 1 ? 's' : ''}` : ''}
        </button>
      </div>
    </div>
  </div>
{/if}
