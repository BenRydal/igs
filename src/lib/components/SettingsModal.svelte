<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import RangeSlider from './RangeSlider.svelte'
  import { Z_INDEX } from '$lib/styles/z-index'
  import ConfigStore from '$stores/configStore'
  import TimelineStore from '$stores/timelineStore'
  import P5Store from '$stores/p5Store'
  import {
    resetConfig,
    setAnimationRate,
    setSamplingInterval,
    setConfigNumber,
  } from '$lib/history/config-actions'

  interface Props {
    isOpen: boolean
    onClose: () => void
    onOpenDataExplorer: () => void
  }

  let { isOpen = false, onClose, onOpenDataExplorer }: Props = $props()

  // Subscribe to stores
  let currentConfig = $state($ConfigStore)
  let timeline = $state($TimelineStore)
  let p5Instance = $state($P5Store)

  // Keep config in sync with store
  $effect(() => {
    currentConfig = $ConfigStore
  })

  $effect(() => {
    timeline = $TimelineStore
  })

  $effect(() => {
    p5Instance = $P5Store
  })

  // Modal element reference for focus trap
  let modalBoxRef: HTMLDivElement | null = $state(null)
  let firstFocusableElement: HTMLElement | null = null
  let lastFocusableElement: HTMLElement | null = null
  let previouslyFocusedElement: HTMLElement | null = null

  // Handle escape key to close
  function handleKeyDown(event: KeyboardEvent) {
    if (!isOpen) return

    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      handleClose()
    }

    // Handle focus trap
    if (event.key === 'Tab' && modalBoxRef) {
      const focusableElements = modalBoxRef.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

      if (focusableElements.length === 0) return

      firstFocusableElement = focusableElements[0]
      lastFocusableElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusableElement) {
          event.preventDefault()
          lastFocusableElement?.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusableElement) {
          event.preventDefault()
          firstFocusableElement?.focus()
        }
      }
    }
  }

  // Handle backdrop click
  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleClose()
    }
  }

  // Close handler with focus restoration
  function handleClose() {
    onClose()

    // Return focus to previously focused element
    if (previouslyFocusedElement) {
      previouslyFocusedElement.focus()
      previouslyFocusedElement = null
    }
  }

  // Reset all settings to initial config (with undo support)
  function resetSettings() {
    resetConfig()

    if (p5Instance) {
      p5Instance.loop()
    }
  }

  // Handle end time input change
  function handleEndTimeChange(event: Event) {
    const target = event.target as HTMLInputElement
    let value = parseInt(target.value.replace(/\D/g, '')) || 0

    TimelineStore.update((timeline) => {
      timeline.setCurrTime(0)
      timeline.setStartTime(0)
      timeline.setEndTime(value)
      timeline.setLeftMarker(0)
      timeline.setRightMarker(value)
      return timeline
    })
  }

  // Set up keyboard listener when modal opens
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

  // Focus first element when modal opens and store previously focused element
  $effect(() => {
    if (isOpen && modalBoxRef) {
      // Store previously focused element
      previouslyFocusedElement = document.activeElement as HTMLElement

      const focusableElements = modalBoxRef.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusableElements.length > 0) {
        focusableElements[0].focus()
      }
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
    aria-labelledby="settings-modal-title"
  >
    <div class="modal-box w-11/12 max-w-md" bind:this={modalBoxRef}>
      <!-- Header -->
      <div class="flex justify-between mb-4">
        <h3 id="settings-modal-title" class="font-bold text-lg">Settings</h3>
        <button
          class="btn btn-circle btn-sm"
          onclick={handleClose}
          aria-label="Close settings modal"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
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

      <!-- Settings Form -->
      <div class="flex flex-col space-y-4">
        <!-- Animation Rate -->
        <RangeSlider
          id="animationRate"
          label="Animation Rate"
          value={currentConfig.animationRate}
          min={0.01}
          max={1}
          step={0.01}
          onChange={(value) => setAnimationRate(value)}
        />

        <!-- Sampling Interval -->
        <RangeSlider
          id="samplingInterval"
          label="Sampling Interval"
          value={currentConfig.samplingInterval}
          min={0.1}
          max={5}
          step={0.1}
          unit="sec"
          onChange={(value) => setSamplingInterval(value)}
        />

        <!-- Small Data Threshold -->
        <RangeSlider
          id="smallDataThreshold"
          label="Small Data Threshold"
          value={currentConfig.smallDataThreshold}
          min={500}
          max={10000}
          step={100}
          onChange={(value) => setConfigNumber('smallDataThreshold', value, 'small data threshold')}
        />

        <!-- Movement Line Weight -->
        <RangeSlider
          id="movementStrokeWeight"
          label="Movement Line Weight"
          value={currentConfig.movementStrokeWeight}
          min={1}
          max={20}
          step={1}
          onChange={(value) => setConfigNumber('movementStrokeWeight', value, 'movement stroke')}
        />

        <!-- Stop Line Weight -->
        <RangeSlider
          id="stopStrokeWeight"
          label="Stop Line Weight"
          value={currentConfig.stopStrokeWeight}
          min={1}
          max={20}
          step={1}
          onChange={(value) => setConfigNumber('stopStrokeWeight', value, 'stop stroke')}
        />

        <!-- End Time Input -->
        <div class="flex flex-col">
          <label for="inputSeconds" class="text-sm font-medium text-base-content mb-2">
            End Time (seconds)
          </label>
          <input
            id="inputSeconds"
            type="text"
            value={timeline.endTime}
            oninput={handleEndTimeChange}
            class="input input-bordered"
            aria-label="End time in seconds"
            inputmode="numeric"
            pattern="[0-9]*"
          />
        </div>
      </div>

      <!-- Data Explorer Button -->
      <div class="flex flex-col mt-4">
        <button class="btn btn-sm ml-4" onclick={onOpenDataExplorer}>Data Explorer</button>
      </div>

      <!-- Modal Actions -->
      <div class="modal-action">
        <button class="btn btn-warning" onclick={resetSettings}>Reset Settings</button>
        <button class="btn" onclick={handleClose}>Close</button>
      </div>
    </div>
  </div>
{/if}
