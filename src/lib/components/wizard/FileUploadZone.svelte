<script lang="ts">
  import type { DataFileType } from '$lib/validation/types'
  import type { WizardFile } from './types'
  import { formatFileSize, getFileSizeLimit } from '$lib/validation/rules'
  import { toastStore } from '../../../stores/toastStore'

  interface Props {
    files?: WizardFile[]
    selectedDataType: DataFileType | null
    onFilesAdded: (files: File[]) => void | Promise<void>
    onFileRemoved: (fileId: string) => void
  }

  let { files = $bindable([]), selectedDataType, onFilesAdded, onFileRemoved }: Props = $props()

  let isDragging = $state(false)
  let fileInputRef: HTMLInputElement | null = $state(null)

  const acceptTypes = $derived.by(() => {
    if (!selectedDataType) return '.csv'
    switch (selectedDataType) {
      case 'movement':
      case 'conversation':
      case 'singleCode':
      case 'multiCode':
        return '.csv'
      default:
        return '.csv'
    }
  })

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
   * Validate and filter files by size
   */
  function validateFiles(filesToValidate: File[]): File[] {
    try {
      const oversizedFiles: Array<{ name: string; size: number; limit: number }> = []
      const validFiles = filesToValidate.filter((file) => {
        try {
          const { valid, limit } = validateFileSize(file)
          if (!valid && limit) {
            oversizedFiles.push({ name: file.name, size: file.size, limit })
            return false
          }
          return true
        } catch (error) {
          console.error(`Error validating file ${file.name}:`, error)
          return false
        }
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

      return validFiles
    } catch (error) {
      console.error('Error during file validation:', error)
      toastStore.error('Failed to validate files')
      return []
    }
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    isDragging = true
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault()
    isDragging = false
  }

  async function handleDrop(e: DragEvent) {
    e.preventDefault()
    isDragging = false

    const droppedFiles = e.dataTransfer?.files
    if (!droppedFiles) return

    try {
      const fileArray = Array.from(droppedFiles)
      const validFiles = validateFiles(fileArray)
      if (validFiles.length > 0) {
        await onFilesAdded(validFiles)
      } else if (fileArray.length > 0) {
        toastStore.error('No valid files to add')
      }
    } catch (error) {
      console.error('Drop error:', error)
      toastStore.error(error instanceof Error ? error.message : 'Failed to process dropped files')
    }
  }

  async function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement
    if (!input.files) return

    try {
      const selectedFiles = Array.from(input.files)
      const validFiles = validateFiles(selectedFiles)
      if (validFiles.length > 0) {
        await onFilesAdded(validFiles)
      } else if (selectedFiles.length > 0) {
        toastStore.error('No valid files to add')
      }
    } catch (error) {
      console.error('File input error:', error)
      toastStore.error(error instanceof Error ? error.message : 'Failed to process files')
    } finally {
      // Reset input so same file can be selected again
      input.value = ''
    }
  }

  function triggerFileInput() {
    fileInputRef?.click()
  }

  function getFileIcon(fileName: string): string {
    if (fileName.endsWith('.csv')) return '📊'
    if (fileName.match(/\.(jpg|jpeg|png)$/i)) return '🖼️'
    if (fileName.endsWith('.mp4')) return '🎥'
    return '📄'
  }

  function getStatusBadge(status: WizardFile['status']) {
    switch (status) {
      case 'pending':
        return { class: 'badge-ghost', text: 'Pending' }
      case 'validating':
        return { class: 'badge-warning', text: 'Validating...' }
      case 'valid':
        return { class: 'badge-success', text: 'Valid ✓' }
      case 'error':
        return { class: 'badge-error', text: 'Error ✗' }
    }
  }
</script>

<div class="p-6">
  <h2 class="text-xl font-bold mb-2">Upload Files</h2>
  <p class="text-sm text-gray-600 mb-6">Upload your data files (accepts {acceptTypes})</p>

  <!-- Drop Zone -->
  <div
    class="border-2 border-dashed rounded-lg p-8 transition-colors {isDragging
      ? 'border-primary bg-primary/10'
      : 'border-gray-300 hover:border-primary/50'}"
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
    role="button"
    tabindex="0"
    onkeydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        triggerFileInput()
      }
    }}
    onclick={triggerFileInput}
  >
    <div class="flex flex-col items-center justify-center text-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-12 w-12 text-gray-400 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
      <p class="text-lg font-medium mb-2">Drop files here or click to browse</p>
      <p class="text-sm text-gray-500">Accepts {acceptTypes} files</p>
    </div>

    <input
      type="file"
      bind:this={fileInputRef}
      onchange={handleFileSelect}
      accept={acceptTypes}
      multiple
      class="hidden"
      aria-label="File upload input"
    />
  </div>

  <!-- File List -->
  {#if files.length > 0}
    <div class="mt-6">
      <h3 class="font-semibold mb-3">Selected Files ({files.length})</h3>
      <div class="space-y-2">
        {#each files as file (file.id)}
          <div class="card bg-base-100 border border-gray-200">
            <div class="card-body p-4">
              <div class="flex items-center justify-between gap-4">
                <!-- File Info -->
                <div class="flex items-center gap-3 flex-1 min-w-0">
                  <div class="text-2xl">{getFileIcon(file.file.name)}</div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium truncate" title={file.file.name}>{file.file.name}</p>
                    <p class="text-sm text-gray-500">{formatFileSize(file.file.size)}</p>
                  </div>
                </div>

                <!-- Status Badge -->
                <div class="badge {getStatusBadge(file.status).class}">
                  {getStatusBadge(file.status).text}
                </div>

                <!-- Remove Button -->
                <button
                  class="btn btn-circle btn-sm btn-ghost"
                  onclick={() => onFileRemoved(file.id)}
                  aria-label="Remove {file.file.name}"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <!-- Loading Indicator for Validating -->
              {#if file.status === 'validating'}
                <div class="mt-2">
                  <progress class="progress progress-primary w-full"></progress>
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Help Text -->
  <div class="alert alert-info mt-6">
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
    <span>You can upload multiple files. Each file will be validated before import.</span>
  </div>
</div>
