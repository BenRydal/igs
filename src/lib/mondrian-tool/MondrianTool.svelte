<script lang="ts">
  import P5Wrapper from './p5/P5Wrapper.svelte'
  import Navbar from '$lib/mondrian-tool/components/nav/Navbar.svelte'
  import PathStats from '$lib/mondrian-tool/components/PathStats.svelte'
  import RecoveryModal from '$lib/mondrian-tool/components/RecoveryModal.svelte'
  import { onMount, type Snippet } from 'svelte'
  import { get } from 'svelte/store'
  import { drawingState } from '$lib/mondrian-tool/stores/drawingState'
  import { drawingConfig } from '$lib/mondrian-tool/stores/drawingConfig'
  import {
    getRecoverableSession,
    clearSavedSession,
    saveSession,
    hasRecordedData,
    debounce,
    type SavedSession,
  } from '$lib/mondrian-tool/stores/sessionRecovery'
  import IconWarning from '~icons/material-symbols/warning-outline'

  let { toolSwitcher, active = true }: { toolSwitcher?: Snippet; active?: boolean } = $props()

  let p5Component: P5Wrapper
  let videoUrl: string | null = null

  // The bridge to IGS goes through these, so it never reaches into Mondrian's internals.
  export function getFloorPlanDataUrl(): string | null {
    return p5Component?.getFloorPlanDataUrl() ?? null
  }

  export function getVideoUrl(): string | null {
    return videoUrl
  }

  export function hasFloorPlan(): boolean {
    return get(drawingState).imageElement !== null
  }

  export function receiveFloorPlan(url: string) {
    const image = new window.Image()
    image.onload = () => p5Component.setImage(image)
    image.src = url
  }

  export function receiveVideo(url: string) {
    const video = window.document.createElement('video')
    video.src = url
    video.autoplay = false
    video.loop = false
    p5Component.setVideo(video)
    videoUrl = url
  }
  let showRecoveryModal = $state(false)
  let recoveredSession = $state<SavedSession | null>(null)
  let showEmptyPathWarning = $state(false)

  $effect(() => {
    if ($drawingState.isDrawing) {
      showEmptyPathWarning = false
    }
  })

  // Save function (used by all save triggers)
  function saveNow() {
    if (p5Component) {
      const floorPlanDataUrl = p5Component.getFloorPlanDataUrl()
      saveSession(floorPlanDataUrl)
    }
  }

  // Debounced save for general state changes (renames, config, etc.)
  const debouncedSave = debounce(saveNow, 2000)

  onMount(() => {
    // Check for recoverable session
    const session = getRecoverableSession()
    if (session) {
      recoveredSession = session
      showRecoveryModal = true
    }

    // Track previous recording state to detect when recording stops
    let wasRecording = false
    let periodicSaveInterval: ReturnType<typeof setInterval> | null = null

    // Set up auto-save subscription
    const unsubscribe = drawingState.subscribe((state) => {
      const hasData = hasRecordedData(state.paths)
      const isRecording = state.isDrawing

      // Save immediately when recording stops
      if (wasRecording && !isRecording && hasData) {
        saveNow()
      }

      // Start/stop periodic save during recording
      if (isRecording && !periodicSaveInterval) {
        // Save every 60 seconds while recording
        periodicSaveInterval = setInterval(() => {
          if (hasRecordedData(get(drawingState).paths)) {
            saveNow()
          }
        }, 60000)
      } else if (!isRecording && periodicSaveInterval) {
        clearInterval(periodicSaveInterval)
        periodicSaveInterval = null
      }

      wasRecording = isRecording

      // Debounced save for other state changes (when not recording)
      if (!showRecoveryModal && hasData && !isRecording) {
        debouncedSave()
      }
    })

    // Save when page loses visibility (user switches tabs)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (hasRecordedData(get(drawingState).paths)) {
          saveNow()
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Warn before leaving with unsaved data
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasRecordedData(get(drawingState).paths)) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (periodicSaveInterval) clearInterval(periodicSaveInterval)
      unsubscribe()
    }
  })

  function handleRestoreSession() {
    if (!recoveredSession || !p5Component) return

    // Restore config first
    drawingConfig.update((config) => ({
      ...config,
      isTranscriptionMode: recoveredSession!.config.isTranscriptionMode,
      pollingRate: recoveredSession!.config.pollingRate,
      heartbeatInterval: recoveredSession!.config.heartbeatInterval ?? 500,
      useAdaptiveSampling: recoveredSession!.config.useAdaptiveSampling ?? true,
      strokeWeight: recoveredSession!.config.strokeWeight,
      speculateScale: recoveredSession!.config.speculateScale,
      isContinuousMode: recoveredSession!.config.isContinuousMode,
      floorPlanRotation: recoveredSession!.config.floorPlanRotation ?? 0,
    }))

    // Restore paths and state
    drawingState.update((state) => ({
      ...state,
      paths: recoveredSession!.paths,
      currentPathId: Math.max(...recoveredSession!.paths.map((p) => p.pathId), 0),
      videoTime: recoveredSession!.videoTime,
      imageWidth: recoveredSession!.imageWidth,
      imageHeight: recoveredSession!.imageHeight,
    }))

    // Restore floor plan image if saved
    if (recoveredSession.floorPlanDataUrl) {
      const image = new window.Image()
      image.onload = () => {
        p5Component.setImage(image, true)
      }
      image.onerror = () => {
        console.warn('Failed to restore floor plan image from saved session')
      }
      image.src = recoveredSession.floorPlanDataUrl
    }

    showRecoveryModal = false
    recoveredSession = null
  }

  function handleDiscardSession() {
    clearSavedSession()
    showRecoveryModal = false
    recoveredSession = null
  }

  function handleVideoUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) {
      const video = window.document.createElement('video')
      video.src = window.URL.createObjectURL(file)
      video.autoplay = false
      video.loop = false
      p5Component.setVideo(video)
      videoUrl = video.src
    }
  }

  function handleImageUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) {
      const image = new window.Image()
      image.src = window.URL.createObjectURL(file)
      image.onload = () => p5Component.setImage(image)
    }
  }

  function handleSavePath(onComplete?: () => void) {
    p5Component.exportAll(() => {
      // Clear saved session after successful export
      clearSavedSession()
      onComplete?.()
    })
  }

  function handleClear() {
    p5Component.clearDrawing()
    p5Component.startNewPath()
    clearSavedSession()
  }

  function handleModeSwitch() {
    p5Component.clearDrawing()
    p5Component.clearVideo()
    videoUrl = null
    p5Component.startNewPath()
    clearSavedSession()
  }

  function handleNewPath() {
    const created = p5Component.startNewPath()
    showEmptyPathWarning = !created
  }

  function loadExampleData(imageID: string) {
    const filePath = `/examples/${imageID}.png`
    const image = new window.Image()
    image.src = filePath
    image.onload = () => {
      p5Component.setImage(image)
    }
    image.onerror = (error) => {
      window.console.error(`Error loading example image from ${filePath}:`, error)
    }
  }
</script>

{#if showRecoveryModal && recoveredSession}
  <RecoveryModal
    session={recoveredSession}
    onRestore={handleRestoreSession}
    onDiscard={handleDiscardSession}
  />
{/if}

<Navbar
  onSelectExample={loadExampleData}
  onImageUpload={handleImageUpload}
  onVideoUpload={handleVideoUpload}
  onSavePath={handleSavePath}
  onClear={handleClear}
  onNewPath={handleNewPath}
  onModeSwitch={handleModeSwitch}
  {toolSwitcher}
/>
<div class="relative">
  <P5Wrapper bind:this={p5Component} {active} />
  <PathStats />
</div>

{#if showEmptyPathWarning}
  <div class="fixed top-20 left-4 right-4 flex justify-center pointer-events-none z-50">
    <div class="alert alert-warning shadow-lg max-w-md pointer-events-auto">
      <IconWarning class="h-5 w-5" />
      <span class="text-sm"
        >Please record some data on the current path before adding a new one.</span
      >
    </div>
  </div>
{/if}
