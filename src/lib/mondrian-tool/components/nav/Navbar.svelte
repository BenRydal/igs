<script lang="ts">
  import IconHelp from '~icons/material-symbols/help-outline'
  import IconSettings from '~icons/material-symbols/settings'
  import IconUpload from '~icons/material-symbols/upload'
  import IconDownload from '~icons/material-symbols/download'
  import IconDeleteAll from '~icons/material-symbols/delete-sweep-outline'
  import IconImage from '~icons/material-symbols/image'
  import IconVideo from '~icons/material-symbols/videocam'
  import IconMenu from '~icons/material-symbols/menu'
  import IconClose from '~icons/material-symbols/close'
  import IconRotateLeft from '~icons/material-symbols/rotate-left'
  import IconRotateRight from '~icons/material-symbols/rotate-right'
  import { onMount, onDestroy } from 'svelte'
  import { get } from 'svelte/store'
  import { drawingConfig, rotateFloorPlan } from '$lib/mondrian-tool/stores/drawingConfig'
  import { drawingState } from '$lib/mondrian-tool/stores/drawingState'
  import { getRecoverableSession } from '$lib/mondrian-tool/stores/sessionRecovery'
  import WelcomeModal from '$lib/mondrian-tool/components/WelcomeModal.svelte'

  export let onImageUpload: (event: Event) => void
  export let onVideoUpload: (event: Event) => void
  export let onSavePath: (onComplete?: () => void) => void
  export let onClear: () => void
  export let onNewPath: () => void
  export let onSelectExample: (data: string) => void
  export let onModeSwitch: () => void

  let showModal = false
  let showClearAllModal = false
  let isExporting = false
  let showMobileMenu = false
  let showSettingsMenu = false
  // Use strings for safe comparison with option values
  let pendingValue = get(drawingConfig).isTranscriptionMode ? 'true' : 'false'
  let originalValue = pendingValue

  // Sync when store changes externally (e.g., session recovery)
  $: if (!showModal) {
    const storeValue = $drawingConfig.isTranscriptionMode ? 'true' : 'false'
    pendingValue = storeValue
    originalValue = storeValue
  }

  // Define modes as strings
  const modes = [
    { label: 'Transcription Mode', value: 'true' },
    { label: 'Speculate Mode', value: 'false' },
  ]

  let showScaleModal = false
  let showExportPreviewModal = false
  let showUploadModal = false
  let isDraggingFile = false
  let minutes = 0
  let seconds = 10 // default

  $: scaleSeconds = minutes * 60 + seconds
  $: paths = $drawingState.paths
  $: hasImage = $drawingState.imageElement !== null
  $: hasExportableData = hasImage || paths.some(p => p.points.length > 0)
  $: isRecording = $drawingState.shouldTrackMouse

  onMount(() => {
    // Skip welcome modal if there's a recoverable session (RecoveryModal will show instead)
    const hasRecoverableSession = getRecoverableSession() !== null
    if (!hasRecoverableSession) {
      openWelcomeModal()
    }
  })

  const strokeWeights = [1, 2, 3, 4, 5, 8, 10]
  const pollingRates = [
    { labelVideo: '4ms', labelSpeculate: '4 steps', value: 4 },
    { labelVideo: '8ms', labelSpeculate: '8 steps', value: 8 },
    { labelVideo: '16ms', labelSpeculate: '16 steps', value: 16 },
    { labelVideo: '32ms', labelSpeculate: '32 steps', value: 32 },
    { labelVideo: '64ms', labelSpeculate: '64 steps', value: 64 },
    { labelVideo: '100ms', labelSpeculate: '100 steps', value: 100 },
  ]

  const examples = [
    { id: 'classroom', label: 'Classroom Space' },
    { id: 'museum', label: 'Museum Gallery' },
    { id: 'basketball', label: 'Basketball Court' },
  ]

  function handleExport() {
    if ($drawingConfig.isTranscriptionMode) {
      showExportPreviewModal = true
    } else {
      showScaleModal = true // ask for scaling first
    }
  }

  function confirmScale() {
    drawingConfig.update((c) => ({
      ...c,
      speculateScale: scaleSeconds,
    }))
    showScaleModal = false
    showExportPreviewModal = true
  }

  function cancelScale() {
    showScaleModal = false
  }

  function confirmExport() {
    isExporting = true
    onSavePath(() => {
      isExporting = false
      showExportPreviewModal = false
    })
  }

  function cancelExport() {
    showExportPreviewModal = false
  }

  function formatPoints(count: number): string {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toString()
  }

  function handleModeChange(e: Event & { currentTarget: HTMLSelectElement }) {
    pendingValue = e.currentTarget.value
    showModal = true
  }

  function confirmSwitch() {
    // Clear existing data
    onModeSwitch()

    // Update store
    drawingConfig.update((c) => ({
      ...c,
      isTranscriptionMode: pendingValue === 'true',
    }))

    originalValue = pendingValue
    showModal = false
  }

  function cancelSwitch() {
    // Revert select UI back to original
    pendingValue = originalValue
    showModal = false
  }

  function confirmClearAll() {
    onClear()
    showClearAllModal = false
  }

  function cancelClearAll() {
    showClearAllModal = false
  }

  function handleFileUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return

    if (file.type.startsWith('video/')) {
      onVideoUpload(event)
    } else if (file.type.startsWith('image/')) {
      onImageUpload(event)
    } else {
      window.alert('Please upload a video or image file')
      return
    }

    // Keep modal open so user can upload additional files
    ;(event.target as HTMLInputElement).value = ''
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    isDraggingFile = true
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault()
    isDraggingFile = false
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    isDraggingFile = false

    const file = e.dataTransfer?.files[0]
    if (!file) return

    // Create a synthetic event for the existing handlers
    const input = document.createElement('input')
    input.type = 'file'
    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(file)
    input.files = dataTransfer.files
    const syntheticEvent = { target: input } as unknown as Event

    if (file.type.startsWith('video/')) {
      onVideoUpload(syntheticEvent)
    } else if (file.type.startsWith('image/')) {
      onImageUpload(syntheticEvent)
    } else {
      window.alert('Please upload a video or image file')
      return
    }
    // Keep modal open so user can upload additional files
  }

  function preventDrawing(e: MouseEvent) {
    e.stopPropagation()
  }

  function openWelcomeModal() {
    const modal = window.document.getElementById('welcome_modal')
    if (modal instanceof HTMLDialogElement) {
      modal.showModal()
    }
  }

  function closeWelcomeModal() {
    const modal = window.document.getElementById('welcome_modal')
    if (modal instanceof HTMLDialogElement) {
      modal.close()
    }
  }

  function handleTryExample() {
    // Switch to Speculate mode if in Transcription mode
    if ($drawingConfig.isTranscriptionMode) {
      onModeSwitch()
      drawingConfig.update((c) => ({
        ...c,
        isTranscriptionMode: false,
      }))
      pendingValue = 'false'
      originalValue = 'false'
    }
    // Load classroom example
    onSelectExample('classroom')
    // Close modal
    closeWelcomeModal()
  }


  // Config update helpers to reduce duplication
  function setPollingRate(e: Event) {
    drawingConfig.update((c) => ({
      ...c,
      pollingRate: parseInt((e.currentTarget as HTMLSelectElement).value),
    }))
  }

  function setStrokeWeight(e: Event) {
    drawingConfig.update((c) => ({
      ...c,
      strokeWeight: parseInt((e.currentTarget as HTMLSelectElement).value),
    }))
  }

  function toggleAdaptiveSampling() {
    drawingConfig.update((c) => ({
      ...c,
      useAdaptiveSampling: !c.useAdaptiveSampling,
    }))
  }

  function toggleContinuousMode() {
    drawingConfig.update((c) => ({
      ...c,
      isContinuousMode: !c.isContinuousMode,
    }))
  }

  function setJumpValue(e: Event) {
    const value = parseInt((e.currentTarget as HTMLInputElement).value)
    drawingConfig.update((c) => ({
      ...c,
      ...(c.isTranscriptionMode ? { jumpSeconds: value } : { jumpSteps: value }),
    }))
  }

  function getPollingRateLabel(rate: typeof pollingRates[number]): string {
    return $drawingConfig.isTranscriptionMode ? rate.labelVideo : rate.labelSpeculate
  }

  function handleSettingsClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement
    if (!target.closest('[data-settings-menu]')) {
      showSettingsMenu = false
    }
  }

  // Watch showSettingsMenu and add/remove click listener (browser only)
  $: if (typeof window !== 'undefined') {
    if (showSettingsMenu) {
      document.addEventListener('click', handleSettingsClickOutside)
    } else {
      document.removeEventListener('click', handleSettingsClickOutside)
    }
  }

  // Cleanup on destroy
  onDestroy(() => {
    if (typeof window !== 'undefined') {
      document.removeEventListener('click', handleSettingsClickOutside)
    }
  })
</script>

<div
  class="navbar bg-base-100 h-16 px-2 md:px-4"
  role="presentation"
  on:mousedown={preventDrawing}
  on:mouseup={preventDrawing}
  on:mousemove={preventDrawing}
>
  <!-- Logo - always visible -->
  <div class="flex-1">
    <a class="btn btn-ghost text-lg md:text-xl px-2" href="https://interactiongeography.org">Mondrian</a>
  </div>

  <!-- Desktop Navigation - hidden on small screens -->
  <div class="hidden lg:flex justify-end items-center gap-2">
    <!-- Clear All Button -->
    <button class="btn btn-ghost" on:click={() => (showClearAllModal = true)} title="Clear all paths">
      <IconDeleteAll class="w-5 h-5" />
      Clear All
    </button>

    <div class="divider divider-horizontal"></div>

    <!-- Export Data -->
    <button class="btn btn-ghost" on:click={handleExport}
      ><IconDownload class="w-5 h-5" />Export</button
    >

    <!-- File Upload -->
    <button class="btn btn-ghost" on:click={() => (showUploadModal = true)}>
      <IconUpload class="w-5 h-5" />
      Upload
    </button>

    <!-- Rotation Controls (only when floor plan is loaded, disabled during recording) -->
    {#if hasImage}
      <div class="flex items-center gap-1" data-ui-element>
        <button
          class="btn btn-ghost btn-sm btn-square"
          class:opacity-30={isRecording}
          on:click={() => rotateFloorPlan('ccw')}
          title={isRecording ? "Stop recording to rotate" : "Rotate counterclockwise"}
          disabled={isRecording}
        >
          <IconRotateLeft class="w-5 h-5" />
        </button>
        <button
          class="btn btn-ghost btn-sm btn-square"
          class:opacity-30={isRecording}
          on:click={() => rotateFloorPlan('cw')}
          title={isRecording ? "Stop recording to rotate" : "Rotate clockwise"}
          disabled={isRecording}
        >
          <IconRotateRight class="w-5 h-5" />
        </button>
      </div>
    {/if}

    <div class="divider divider-horizontal"></div>

    <!-- Mode -->
    <div data-ui-element>
      <label class="label cursor-pointer flex-col items-start">
        <select
          id="mode-select"
          class="select select-bordered select-sm w-full"
          bind:value={pendingValue}
          on:change={handleModeChange}
        >
          {#each modes as m (m.value)}
            <option value={m.value}>{m.label}</option>
          {/each}
        </select>
      </label>
    </div>

    <!-- Sample Data for Speculate Mode -->
    {#if !$drawingConfig.isTranscriptionMode}
      <!-- Example Data Dropdown -->
      <div class="dropdown dropdown-end">
        <div tabindex="0" role="button" class="btn btn-neutral flex items-center gap-2">
          <IconImage class="w-5 h-5" />
          <span>Example Data</span>
        </div>

        <ul
          class="dropdown-content menu bg-base-100 rounded-box z-[100] w-72 p-3 shadow-lg mt-2 border border-base-300"
          role="menu"
        >
          {#each examples as example (example.id)}
            <li class="mb-1">
              <button
                class="btn btn-sm btn-outline w-full text-left text-base-content border-base-300 hover:bg-base-200 transition"
                on:click={() => onSelectExample(example.id)}
              >
                {example.label}
              </button>
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    <!-- New Path -->
    <button class="btn btn-neutral gap-2" on:click={onNewPath}> New Path </button>

    <!-- Settings Dropdown (controlled) -->
    <div class="relative" data-settings-menu data-ui-element>
      <button
        class="btn btn-ghost"
        on:click={() => (showSettingsMenu = !showSettingsMenu)}
        aria-label="Settings menu"
      >
        <IconSettings class="w-5 h-5" />
      </button>

      {#if showSettingsMenu}
        <div class="absolute right-0 mt-2 w-80 bg-base-100 rounded-box shadow-lg p-4 z-50">
          <!-- Sampling Section -->
          <div class="text-xs uppercase text-base-content/50 text-center mb-2">Sampling</div>

          <!-- Point Capture Interval -->
          <div class="form-control mb-3">
            <label class="label py-1">
              <span class="label-text">Point Capture Interval</span>
            </label>
            <select
              class="select select-bordered select-sm w-full"
              value={$drawingConfig.pollingRate}
              on:change={setPollingRate}
            >
              {#each pollingRates as rate (rate.value)}
                <option value={rate.value}>{getPollingRateLabel(rate)}</option>
              {/each}
            </select>
          </div>

          <!-- Adaptive Sampling Toggle -->
          <div class="form-control mb-3">
            <div class="flex items-center justify-between mb-1">
              <span class="label-text">Adaptive Sampling</span>
              <div class="tooltip tooltip-left" data-tip="When ON: samples frequently during movement, less when stationary. When OFF: fixed interval sampling.">
                <IconHelp class="w-4 h-4 text-base-content/50" />
              </div>
            </div>
            <button
              type="button"
              class="btn btn-sm w-full"
              class:bg-blue-800={$drawingConfig.useAdaptiveSampling}
              class:text-white={$drawingConfig.useAdaptiveSampling}
              class:bg-gray-200={!$drawingConfig.useAdaptiveSampling}
              class:text-gray-800={!$drawingConfig.useAdaptiveSampling}
              on:click={toggleAdaptiveSampling}
            >
              {$drawingConfig.useAdaptiveSampling ? 'ON' : 'OFF'}
            </button>
          </div>

          <!-- Fast Forward/Rewind Slider (adapts based on mode) -->
          <div class="form-control mb-3">
            <div class="flex items-center justify-between mb-1">
              <span class="label-text">Fast Forward / Rewind</span>
              <span class="label-text text-base-content/50">
                {$drawingConfig.isTranscriptionMode ? `${$drawingConfig.jumpSeconds}s` : `${$drawingConfig.jumpSteps} steps`}
              </span>
            </div>
            <input
              type="range"
              min="5"
              max={$drawingConfig.isTranscriptionMode ? 60 : 50}
              step="5"
              value={$drawingConfig.isTranscriptionMode ? $drawingConfig.jumpSeconds : $drawingConfig.jumpSteps}
              on:input={setJumpValue}
              class="range range-sm w-full"
            />
            <div class="flex justify-between text-xs text-base-content/40 w-full px-1">
              <span>5{$drawingConfig.isTranscriptionMode ? 's' : ''}</span>
              <span>{$drawingConfig.isTranscriptionMode ? '60s' : '50'}</span>
            </div>
          </div>

          <div class="divider my-2"></div>

          <!-- Rendering Section -->
          <div class="text-xs uppercase text-base-content/50 text-center mb-2">Rendering</div>

          <!-- Stroke Weight -->
          <div class="form-control mb-3">
            <label class="label py-1">
              <span class="label-text">Stroke Weight</span>
            </label>
            <select
              class="select select-bordered select-sm w-full"
              value={$drawingConfig.strokeWeight}
              on:change={setStrokeWeight}
            >
              {#each strokeWeights as weight (weight)}
                <option value={weight}>{weight}px</option>
              {/each}
            </select>
          </div>

          <!-- Continuous Mode Toggle -->
          <div class="form-control">
            <span class="label-text mb-1">Continuous Mode</span>
            <button
              type="button"
              class="btn btn-sm w-full"
              class:bg-blue-800={$drawingConfig.isContinuousMode}
              class:text-white={$drawingConfig.isContinuousMode}
              class:bg-gray-200={!$drawingConfig.isContinuousMode}
              class:text-gray-800={!$drawingConfig.isContinuousMode}
              on:click={toggleContinuousMode}
            >
              {$drawingConfig.isContinuousMode ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      {/if}
    </div>

    <!-- Help -->
    <button class="btn btn-ghost" on:click={openWelcomeModal}>
      <IconHelp class="w-5 h-5" />
    </button>
  </div>

  <!-- Mobile Navigation - visible on small screens -->
  <div class="flex lg:hidden items-center gap-1">
    <!-- Quick action buttons always visible on mobile -->
    <button class="btn btn-ghost btn-sm" on:click={() => (showUploadModal = true)} title="Upload">
      <IconUpload class="w-5 h-5" />
    </button>
    <button class="btn btn-ghost btn-sm" on:click={handleExport} title="Export">
      <IconDownload class="w-5 h-5" />
    </button>
    <!-- Rotation buttons on mobile (only when floor plan loaded, disabled during recording) -->
    {#if hasImage}
      <button
        class="btn btn-ghost btn-sm btn-square"
        class:opacity-30={isRecording}
        on:click={() => rotateFloorPlan('ccw')}
        title={isRecording ? "Stop recording to rotate" : "Rotate counterclockwise"}
        disabled={isRecording}
      >
        <IconRotateLeft class="w-5 h-5" />
      </button>
      <button
        class="btn btn-ghost btn-sm btn-square"
        class:opacity-30={isRecording}
        on:click={() => rotateFloorPlan('cw')}
        title={isRecording ? "Stop recording to rotate" : "Rotate clockwise"}
        disabled={isRecording}
      >
        <IconRotateRight class="w-5 h-5" />
      </button>
    {/if}
    <button class="btn btn-neutral btn-sm" on:click={onNewPath} title="New Path">
      New Path
    </button>

    <!-- Hamburger Menu Button -->
    <button
      class="btn btn-ghost btn-sm"
      on:click={() => (showMobileMenu = !showMobileMenu)}
      aria-label="Toggle menu"
    >
      {#if showMobileMenu}
        <IconClose class="w-6 h-6" />
      {:else}
        <IconMenu class="w-6 h-6" />
      {/if}
    </button>
  </div>
</div>

<!-- Mobile Menu Dropdown -->
{#if showMobileMenu}
  <div
    class="lg:hidden fixed top-16 left-0 right-0 bg-base-100 border-b border-base-300 shadow-lg z-50 max-h-[calc(100vh-4rem)] overflow-y-auto"
    role="presentation"
    on:mousedown={preventDrawing}
    on:mouseup={preventDrawing}
    on:mousemove={preventDrawing}
  >
    <div class="p-4 space-y-3">
      <!-- Mode Selector -->
      <div class="form-control" data-ui-element>
        <label class="label" for="mobile-mode-select">
          <span class="label-text font-medium">Mode</span>
        </label>
        <select
          id="mobile-mode-select"
          class="select select-bordered w-full"
          bind:value={pendingValue}
          on:change={handleModeChange}
        >
          {#each modes as m (m.value)}
            <option value={m.value}>{m.label}</option>
          {/each}
        </select>
      </div>

      <!-- Example Data for Speculate Mode -->
      {#if !$drawingConfig.isTranscriptionMode}
        <div class="form-control">
          <span class="label-text font-medium mb-2">Example Data</span>
          <div class="flex flex-wrap gap-2">
            {#each examples as example (example.id)}
              <button
                class="btn btn-sm btn-outline"
                on:click={() => {
                  onSelectExample(example.id)
                  showMobileMenu = false
                }}
              >
                {example.label}
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <div class="divider my-2"></div>

      <!-- Settings Section -->
      <div class="text-xs uppercase text-base-content/50 font-medium">Sampling</div>

      <!-- Point Capture Interval -->
      <div class="form-control">
        <label class="label py-1" for="mobile-polling-rate">
          <span class="label-text">Point Capture Interval</span>
        </label>
        <select
          id="mobile-polling-rate"
          class="select select-bordered select-sm w-full"
          value={$drawingConfig.pollingRate}
          on:change={setPollingRate}
        >
          {#each pollingRates as rate (rate.value)}
            <option value={rate.value}>{getPollingRateLabel(rate)}</option>
          {/each}
        </select>
      </div>

      <!-- Adaptive Sampling -->
      <div class="form-control">
        <label class="label py-1 cursor-pointer justify-between">
          <span class="label-text">Adaptive Sampling</span>
          <input
            type="checkbox"
            class="toggle [--tglbg:#1e40af] checked:bg-blue-800 checked:border-blue-800"
            checked={$drawingConfig.useAdaptiveSampling}
            on:change={toggleAdaptiveSampling}
          />
        </label>
      </div>

      <!-- Fast Forward/Rewind Slider (adapts based on mode) -->
      <div class="form-control">
        <div class="flex items-center justify-between">
          <span class="label-text">Fast Forward / Rewind</span>
          <span class="label-text text-base-content/50">
            {$drawingConfig.isTranscriptionMode ? `${$drawingConfig.jumpSeconds}s` : `${$drawingConfig.jumpSteps} steps`}
          </span>
        </div>
        <input
          type="range"
          min="5"
          max={$drawingConfig.isTranscriptionMode ? 60 : 50}
          step="5"
          value={$drawingConfig.isTranscriptionMode ? $drawingConfig.jumpSeconds : $drawingConfig.jumpSteps}
          on:input={setJumpValue}
          class="range range-sm w-full mt-1"
        />
        <div class="flex justify-between text-xs text-base-content/40 w-full px-1">
          <span>5{$drawingConfig.isTranscriptionMode ? 's' : ''}</span>
          <span>{$drawingConfig.isTranscriptionMode ? '60s' : '50'}</span>
        </div>
      </div>

      <div class="divider my-2"></div>

      <div class="text-xs uppercase text-base-content/50 font-medium">Rendering</div>

      <!-- Stroke Weight -->
      <div class="form-control">
        <label class="label py-1" for="mobile-stroke-weight">
          <span class="label-text">Stroke Weight</span>
        </label>
        <select
          id="mobile-stroke-weight"
          class="select select-bordered select-sm w-full"
          value={$drawingConfig.strokeWeight}
          on:change={setStrokeWeight}
        >
          {#each strokeWeights as weight (weight)}
            <option value={weight}>{weight}px</option>
          {/each}
        </select>
      </div>

      <!-- Continuous Mode -->
      <div class="form-control">
        <label class="label py-1 cursor-pointer justify-between">
          <span class="label-text">Continuous Mode</span>
          <input
            type="checkbox"
            class="toggle [--tglbg:#1e40af] checked:bg-blue-800 checked:border-blue-800"
            checked={$drawingConfig.isContinuousMode}
            on:change={toggleContinuousMode}
          />
        </label>
      </div>

      <div class="divider my-2"></div>

      <!-- Action Buttons -->
      <div class="flex flex-col gap-2">
        <button
          class="btn btn-ghost justify-start"
          on:click={() => {
            showClearAllModal = true
            showMobileMenu = false
          }}
        >
          <IconDeleteAll class="w-5 h-5" />
          Clear All Paths
        </button>
        <button
          class="btn btn-ghost justify-start"
          on:click={() => {
            openWelcomeModal()
            showMobileMenu = false
          }}
        >
          <IconHelp class="w-5 h-5" />
          Help
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- All Modals (shared between desktop and mobile) -->

<!-- Scale Modal using DaisyUI Modal -->
<dialog id="scale_modal" class="modal" class:modal-open={showScaleModal} data-ui-element>
  <div class="modal-box w-80">
    <h2 class="text-lg font-semibold mb-4">Set Time Scale</h2>
    <p class="mb-4 text-sm">
      In <strong>Speculate Mode</strong>, recorded data is stretched over a chosen duration.
      Enter total time below:
    </p>

    <div class="flex gap-2 mb-2">
      <div class="flex-1">
        <label for="minutes-input" class="block text-xs font-medium mb-1">Minutes</label>
        <input
          id="minutes-input"
          type="number"
          min="0"
          class="input input-bordered w-full"
          bind:value={minutes}
        />
      </div>
      <div class="flex-1">
        <label for="seconds-input" class="block text-xs font-medium mb-1">Seconds</label>
        <input
          id="seconds-input"
          type="number"
          min="0"
          max="59"
          class="input input-bordered w-full"
          bind:value={seconds}
        />
      </div>
    </div>

    <p class="text-sm text-base-content/70 mb-4">
      Total duration: <strong>{scaleSeconds} seconds</strong>
    </p>

    {#if scaleSeconds <= 0}
      <p class="text-error text-xs mb-2">Please enter a duration greater than 0 seconds.</p>
    {/if}

    <div class="modal-action">
      <button class="btn" on:click={cancelScale}>Cancel</button>
      <button class="btn btn-primary" on:click={confirmScale} disabled={scaleSeconds <= 0}>
        Save with Scaling
      </button>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button on:click={cancelScale}>close</button>
  </form>
</dialog>

<!-- Mode Switch Modal using DaisyUI Modal -->
<dialog id="mode_switch_modal" class="modal" class:modal-open={showModal} data-ui-element>
  <div class="modal-box w-80">
    <h2 class="text-lg font-semibold mb-4">Switch Mode?</h2>
    <p class="mb-6 text-sm">
      Switching modes will erase all recorded data. Do you want to continue?
    </p>
    <div class="modal-action">
      <button class="btn" on:click={cancelSwitch}>Cancel</button>
      <button class="btn btn-error" on:click={confirmSwitch}>Switch</button>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button on:click={cancelSwitch}>close</button>
  </form>
</dialog>

<!-- Clear All Modal -->
<dialog id="clear_all_modal" class="modal" class:modal-open={showClearAllModal} data-ui-element>
  <div class="modal-box w-80">
    <h2 class="text-lg font-semibold mb-4">Clear All Paths?</h2>
    <p class="mb-6 text-sm">
      This will delete all recorded paths. This action cannot be undone.
    </p>
    <div class="modal-action">
      <button class="btn" on:click={cancelClearAll}>Cancel</button>
      <button class="btn btn-error" on:click={confirmClearAll}>Clear All</button>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button on:click={cancelClearAll}>close</button>
  </form>
</dialog>

<!-- Export Preview Modal -->
<dialog id="export_preview_modal" class="modal" class:modal-open={showExportPreviewModal} data-ui-element>
  <div class="modal-box w-96 max-w-[90vw]">
    <h2 class="text-lg font-semibold mb-4">Export Preview</h2>
    <p class="mb-4 text-sm text-base-content/70">
      The following files will be included in your ZIP:
    </p>

    <div class="bg-base-200 rounded-lg p-3 space-y-2 max-h-64 overflow-y-auto">
      {#if hasImage}
        <div class="flex items-center gap-2 text-sm">
          <IconImage class="w-4 h-4 text-primary" />
          <span class="font-mono">floor-plan.png</span>
        </div>
      {/if}

      {#each paths as path, index (path.pathId)}
        {#if path.points.length > 0}
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
              <span
                class="w-3 h-3 rounded-full flex-shrink-0"
                style="background-color: {path.color}"
              ></span>
              <span class="font-mono">{path.name || `path-${index + 1}`}.csv</span>
            </div>
            <span class="text-base-content/50 text-xs">
              {formatPoints(path.points.length)} pts
            </span>
          </div>
        {/if}
      {/each}

      {#if !hasExportableData}
        <p class="text-sm text-base-content/50 italic">No data to export</p>
      {/if}
    </div>

    <div class="modal-action">
      <button class="btn" on:click={cancelExport}>Cancel</button>
      <button
        class="btn btn-primary"
        on:click={confirmExport}
        disabled={!hasExportableData || isExporting}
      >
        {#if isExporting}
          <span class="loading loading-spinner loading-sm"></span>
          Exporting...
        {:else}
          <IconDownload class="w-4 h-4" />
          Download ZIP
        {/if}
      </button>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button on:click={cancelExport}>close</button>
  </form>
</dialog>

<!-- Upload Modal -->
<dialog class="modal" class:modal-open={showUploadModal} data-ui-element>
  <div class="modal-box w-96 max-w-[90vw]">
    <h2 class="text-lg font-semibold mb-4">Upload Files</h2>

    <!-- Drag & Drop Zone -->
    <div
      class="border-2 border-dashed rounded-lg p-8 text-center transition-colors {isDraggingFile ? 'border-primary bg-primary/5' : 'border-base-300'}"
      on:dragover={handleDragOver}
      on:dragleave={handleDragLeave}
      on:drop={handleDrop}
      role="button"
      tabindex="0"
    >
      <IconUpload class="w-12 h-12 mx-auto mb-3 text-base-content/40" />
      <p class="text-base-content/70 mb-1">Drag & drop files here</p>
      <p class="text-sm text-base-content/50">or use the buttons below</p>
    </div>

    <!-- File Type Buttons -->
    <div class="flex gap-3 mt-4">
      <label class="btn btn-outline flex-1">
        <IconImage class="w-5 h-5" />
        Floor Plan
        <input type="file" class="hidden" accept="image/*" on:change={handleFileUpload} />
      </label>
      {#if $drawingConfig.isTranscriptionMode}
        <label class="btn btn-outline flex-1">
          <IconVideo class="w-5 h-5" />
          Video
          <input type="file" class="hidden" accept="video/*" on:change={handleFileUpload} />
        </label>
      {/if}
    </div>

    <div class="modal-action">
      <button class="btn btn-primary" on:click={() => (showUploadModal = false)}>Done</button>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button on:click={() => (showUploadModal = false)}>close</button>
  </form>
</dialog>

<!-- Welcome Modal Component -->
<WelcomeModal onClose={closeWelcomeModal} onTryExample={handleTryExample} />
