<script lang="ts">
  import { P5Canvas, type SketchFn } from 'svelte-p5'
  import type p5 from 'p5'
  import { onMount } from 'svelte'
  import { fade } from 'svelte/transition'
  import { zip } from 'fflate'
  import { drawingConfig, getSplitPositionForMode } from '../stores/drawingConfig'
  import {
    drawingState,
    createNewPath,
    handleForwardTranscription,
    handleRewindTranscription,
    handleForwardSpeculateMode,
    handleRewindSpeculateMode,
    toggleDrawingNoVideo,
  } from '../stores/drawingState'
  import IconRewind from '~icons/material-symbols/fast-rewind'
  import IconForward from '~icons/material-symbols/fast-forward'
  import {
    setupDrawing,
    drawPaths,
    timeSampler,
    adaptiveSampler,
    indexSampler,
  } from './features/drawing'
  import { setupVideo } from './features/video'
  import VideoControls from '../components/video/VideoControls.svelte'
  import { getFittedImageDisplayRect } from '$lib/mondrian-tool/utils/drawingUtils'
  import IconInfo from '~icons/material-symbols/info-outline'

  let containerDiv: HTMLDivElement
  let width = 800
  let height = 400
  let isDraggingSplitter = false
  let videoElement: p5.Element | null = null
  let p5Instance: p5
  /** False while IGS is showing: pauses the draw loop and the F/R shortcuts. */
  export let active = true

  $: if (p5Instance) {
    if (active) p5Instance.loop()
    else p5Instance.noLoop()
  }

  // Leaving for IGS ends a recording through Mondrian's own stop paths.
  $: if (!active && videoHtmlElement && !videoHtmlElement.paused) videoHtmlElement.pause()
  $: if (!active && $drawingState.isDrawing && !$drawingConfig.isTranscriptionMode) {
    toggleDrawingNoVideo()
  }
  let lastVideoTime = 0
  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF']

  $: videoHtmlElement = videoElement ? (videoElement as { elt: HTMLVideoElement }).elt : null
  $: hasRecordedPaths = $drawingState.paths.some((p) => p.points.length > 0)

  function handleSplitterDrag(e: MouseEvent | TouchEvent) {
    if (isDraggingSplitter) {
      e.preventDefault()
      e.stopPropagation()

      // Guard against empty touches array (e.g., touchend)
      if ('touches' in e && !e.touches.length) return

      const rect = containerDiv.getBoundingClientRect()
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const position = ((clientX - rect.left) / rect.width) * 100
      const minVideoWidth = 30
      const minImageWidth = 30
      const constrainedPosition = Math.min(Math.max(position, minVideoWidth), 100 - minImageWidth)

      drawingConfig.update((config) => ({
        ...config,
        splitPosition: constrainedPosition,
      }))
    }
  }

  function handleSplitterEnd() {
    isDraggingSplitter = false
    if (p5Instance) {
      p5Instance.loop()
    }
  }

  onMount(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (!active) return
      if (e.key.toLowerCase() === 'f') {
        e.preventDefault()
        if ($drawingConfig.isTranscriptionMode && videoHtmlElement) {
          handleForwardTranscription(videoHtmlElement)
        } else {
          handleForwardSpeculateMode()
        }
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault()
        if ($drawingConfig.isTranscriptionMode && videoHtmlElement) {
          handleRewindTranscription(videoHtmlElement)
        } else {
          handleRewindSpeculateMode()
        }
      }
    }

    const updateDimensions = () => {
      height = window.innerHeight - 64
      width = containerDiv.clientWidth
      if (p5Instance) {
        p5Instance.resizeCanvas(width, height)
      }
    }

    window.addEventListener('keydown', handleKeydown)
    window.addEventListener('resize', updateDimensions)
    updateDimensions()

    return () => {
      window.removeEventListener('keydown', handleKeydown)
      window.removeEventListener('resize', updateDimensions)
    }
  })

  const sketch: SketchFn = (p5: p5) => {
    p5Instance = p5
    const { handleMousePressedVideo, handleMousePressedSpeculateMode, addCurrentPoint } =
      setupDrawing(p5)

    p5.setup = () => {
      const canvas = p5.createCanvas(width, height)
      canvas.parent(containerDiv)
      p5.strokeCap(p5.ROUND)
      p5.strokeJoin(p5.ROUND)

      if (p5Instance) {
        p5Instance.noLoop()
      }
    }

    // Helper to draw rotated floor plan image
    const drawRotatedImage = () => {
      const img = $drawingState.imageElement
      const imgW = $drawingState.imageWidth
      const imgH = $drawingState.imageHeight
      if (!img || !imgW || !imgH) return

      const rotation = $drawingConfig.floorPlanRotation
      const r = getFittedImageDisplayRect(p5, getSplitPositionForMode(), imgW, imgH, rotation)

      if (rotation === 0) {
        p5.image(img, r.x, r.y, r.w, r.h)
      } else {
        p5.push()
        p5.translate(r.x + r.w / 2, r.y + r.h / 2)
        p5.rotate((rotation * Math.PI) / 180)
        // For 90°/270°, display rect dimensions are swapped relative to original image
        // so we draw with swapped dimensions and offsets
        if (rotation === 90 || rotation === 270) {
          p5.image(img, -r.h / 2, -r.w / 2, r.h, r.w)
        } else {
          p5.image(img, -r.w / 2, -r.h / 2, r.w, r.h)
        }
        p5.pop()
      }
    }

    p5.draw = () => {
      p5.background(255)

      // Draw video in transcription mode
      if ($drawingConfig.isTranscriptionMode && videoElement) {
        const { updateVideoTime, drawVideo, checkVideoEnd } = setupVideo(p5)
        lastVideoTime = updateVideoTime(videoElement, lastVideoTime)
        checkVideoEnd(videoElement)
        drawVideo(p5, videoElement)
      }

      drawRotatedImage()
      addCurrentPoint()
      drawPaths(p5)
    }

    // Update p5's mouseX/mouseY from touch coordinates
    const updateMouseFromTouch = (event: TouchEvent): boolean => {
      if (!event.touches?.length) return false
      const canvas = containerDiv.querySelector('canvas')
      if (!canvas) return false
      const rect = canvas.getBoundingClientRect()
      const touch = event.touches[0]
      const setP5Prop = (p5 as unknown as { _setProperty: (k: string, v: number) => void })
        ._setProperty
      setP5Prop.call(p5, 'mouseX', touch.clientX - rect.left)
      setP5Prop.call(p5, 'mouseY', touch.clientY - rect.top)
      return true
    }

    // Shared handler for mouse/touch press on canvas
    const handleCanvasPress = (event: MouseEvent | TouchEvent): boolean | void => {
      if (!active) return false
      const target = event?.target as HTMLElement
      if (target?.closest('[data-ui-element]')) return false

      if (!$drawingConfig.isTranscriptionMode) {
        if (!$drawingState.imageElement) return false
        handleMousePressedSpeculateMode()
      } else {
        if (!isDraggingSplitter && videoHtmlElement) {
          handleMousePressedVideo(videoHtmlElement)
        }
      }
    }

    p5.mousePressed = (event: MouseEvent) => {
      handleCanvasPress(event)
    }

    p5.touchStarted = (event: TouchEvent) => {
      // Only prevent default for canvas touches, not UI elements
      const target = event?.target as HTMLElement
      if (target?.closest('[data-ui-element]') || !target?.closest('canvas')) {
        return
      }
      if (!updateMouseFromTouch(event)) return
      handleCanvasPress(event)
      return false // Prevent default only for canvas touches
    }

    p5.touchMoved = (event: TouchEvent) => {
      // Only prevent default for canvas touches, not UI elements
      const target = event?.target as HTMLElement
      if (target?.closest('[data-ui-element]') || !target?.closest('canvas')) {
        return
      }
      updateMouseFromTouch(event)
      return false // Prevent scrolling only for canvas touches
    }

    if (p5Instance) {
      p5Instance.loop()
    }
  }

  export function setVideo(video: HTMLVideoElement) {
    // Check if this is a recovery scenario (paths exist but no video yet)
    const isRecovery = hasRecordedPaths && !videoElement
    const savedVideoTime = $drawingState.videoTime

    lastVideoTime = 0

    drawingState.update((state) => ({
      ...state,
      videoTime: isRecovery ? state.videoTime : 0,
    }))

    if (videoElement) {
      try {
        const videoElt = (videoElement as { elt: HTMLVideoElement }).elt
        if (videoElt) {
          videoElt.pause()
          videoElt.currentTime = 0
        }
        ;(videoElement as { remove: () => void }).remove()
      } catch (e) {
        window.console.warn('Error cleaning up previous video:', e)
      }
    }

    video.loop = false

    const { setVideo: setupP5Video } = setupVideo(p5Instance)
    videoElement = setupP5Video(video)

    if (videoElement) {
      ;(videoElement as { elt: HTMLVideoElement }).elt.loop = false

      if (p5Instance) {
        p5Instance.redraw()
        // Only clear drawing if not recovering
        if (!isRecovery) {
          clearDrawing()
        }
      }

      // If recovering, seek to saved timestamp once video is ready
      if (isRecovery && savedVideoTime > 0) {
        const videoElt = (videoElement as { elt: HTMLVideoElement }).elt
        videoElt.addEventListener(
          'loadedmetadata',
          () => {
            videoElt.currentTime = Math.min(savedVideoTime, videoElt.duration)
            lastVideoTime = videoElt.currentTime
          },
          { once: true }
        )
      }
    }

    // Only start new path if not recovering
    if (!isRecovery && $drawingState.imageElement) startNewPath()
  }

  export function setImage(image: HTMLImageElement, isRecovery = false) {
    // Auto-detect recovery: paths exist but no image loaded yet
    const isImplicitRecovery = !isRecovery && hasRecordedPaths && !$drawingState.imageElement

    p5Instance.loadImage(image.src, (p5Img: p5.Image) => {
      if (!isRecovery && !isImplicitRecovery) {
        // Reset rotation for new floor plans (not recovery)
        drawingConfig.update((c) => ({ ...c, floorPlanRotation: 0 }))

        if (!$drawingConfig.isTranscriptionMode) {
          if (p5Instance) {
            p5Instance.redraw()
            clearDrawing()
          }
          startNewPath()
        } else {
          if (videoElement) startNewPath()
        }
      }
      drawingState.update((state) => ({
        ...state,
        imageWidth: image.width,
        imageHeight: image.height,
        imageElement: p5Img,
      }))
      if (p5Instance) {
        p5Instance.loop()
      }
    })
  }

  /**
   * Get floor plan image as data URL for saving to localStorage
   */
  export function getFloorPlanDataUrl(): string | null {
    const imageElement = $drawingState?.imageElement
    if (!imageElement || !p5Instance) return null

    try {
      const canvas = p5Instance.createGraphics($drawingState.imageWidth, $drawingState.imageHeight)
      canvas.pixelDensity(1)
      canvas.image(imageElement, 0, 0)
      const dataUrl = (canvas as unknown as { canvas: HTMLCanvasElement }).canvas.toDataURL(
        'image/png'
      )
      canvas.remove()
      return dataUrl
    } catch (e) {
      console.warn('Failed to capture floor plan:', e)
      return null
    }
  }

  export function startNewPath(): boolean {
    // Don't allow adding a new path if current path is empty
    const currentPath = $drawingState.paths.find((p) => p.pathId === $drawingState.currentPathId)
    if (currentPath && currentPath.points.length === 0) {
      return false
    }

    const currentPathCount = $drawingState.paths.length
    const newColor = colors[currentPathCount % colors.length]
    timeSampler.reset()
    adaptiveSampler.reset()
    indexSampler.reset()

    if (!$drawingConfig.isTranscriptionMode) {
      createNewPath(newColor)
    } else {
      if (videoElement) {
        const htmlVideo = (videoElement as { elt: HTMLVideoElement }).elt
        if (htmlVideo) {
          htmlVideo.currentTime = 0
          htmlVideo.pause()
        }
      }
      createNewPath(newColor)
    }

    drawingState.update((state) => ({
      ...state,
      shouldTrackMouse: false,
      isDrawing: false,
      isVideoPlaying: false, // always false if no video
    }))
    return true
  }

  export function exportAll(onComplete?: () => void) {
    const paths = $drawingState.paths
    const imageElement = $drawingState?.imageElement
    const isTranscriptionMode = $drawingConfig.isTranscriptionMode
    const scaleValue = $drawingConfig.speculateScale

    const files: Record<string, Uint8Array> = {}

    // Add image to ZIP
    if (imageElement && p5Instance) {
      const canvas = p5Instance.createGraphics($drawingState.imageWidth, $drawingState.imageHeight)
      canvas.pixelDensity(1) // Prevent DPI scaling on retina displays
      canvas.image(imageElement, 0, 0)
      const dataUrl = (canvas as unknown as { canvas: HTMLCanvasElement }).canvas.toDataURL(
        'image/png'
      )
      const base64Data = dataUrl.split(',')[1]
      const binaryString = window.atob(base64Data)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      files['floor-plan.png'] = bytes
      try {
        canvas.remove()
      } catch {
        // p5.Graphics cleanup can throw in some builds; safe to ignore
      }
    }

    // Add each path as CSV
    paths.forEach((path, index) => {
      if (path.points.length === 0) return

      const minTime = path.points[0].time
      const maxTime = path.points[path.points.length - 1].time
      const timeRange = maxTime - minTime
      const csv = path.points
        .map((p) => {
          // Transcription mode: use video time as-is
          // Speculate mode: normalize to [0, scaleValue]
          const time = isTranscriptionMode
            ? p.time
            : timeRange > 0
              ? ((p.time - minTime) / timeRange) * scaleValue
              : 0
          return `${p.x},${p.y},${time}`
        })
        .join('\n')

      const filename = path.name ? `${path.name}.csv` : `path-${index + 1}.csv`
      files[filename] = new TextEncoder().encode(`x,y,time\n${csv}`)
    })

    // Generate ZIP asynchronously (uses Web Workers, won't block UI)
    zip(files, (err, data) => {
      if (err) {
        window.console.error('Error creating ZIP:', err)
        onComplete?.()
        return
      }

      const blob = new Blob([data], { type: 'application/zip' })
      const url = window.URL.createObjectURL(blob)
      const a = window.document.createElement('a')
      a.href = url
      a.download = 'transcription-export.zip'
      window.document.body.appendChild(a)
      a.click()
      window.document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      onComplete?.()
    })
  }

  export function clearDrawing() {
    if (videoElement) {
      const htmlVideo = (videoElement as { elt: HTMLVideoElement }).elt
      if (htmlVideo) {
        htmlVideo.currentTime = 0
        htmlVideo.pause()
      }
    }

    drawingState.update((state) => ({
      ...state,
      paths: [],
      currentPathId: 0,
      shouldTrackMouse: false,
      isDrawing: false,
      isVideoPlaying: false,
    }))
  }

  export function clearVideo() {
    if (videoElement) {
      try {
        const videoElt = (videoElement as { elt: HTMLVideoElement }).elt
        if (videoElt) {
          videoElt.pause()
          videoElt.currentTime = 0
        }
        ;(videoElement as { remove: () => void }).remove()
      } catch (e) {
        window.console.warn('Error cleaning up video:', e)
      }
      videoElement = null
    }
  }

  $: if (containerDiv && $drawingConfig) {
    containerDiv.style.setProperty('--split-width', `${$drawingConfig.splitPosition}%`)
  }
</script>

<div
  bind:this={containerDiv}
  class="relative w-full h-[calc(100vh-64px)] touch-none"
  on:mousemove={handleSplitterDrag}
  on:mouseup={handleSplitterEnd}
  on:mouseleave={handleSplitterEnd}
  on:touchmove={handleSplitterDrag}
  on:touchend={handleSplitterEnd}
  on:touchcancel={handleSplitterEnd}
  on:keydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
    }
  }}
  role="application"
  aria-label="Drawing Canvas"
>
  <!-- The sketch moves its canvas into containerDiv; keep the emptied, full-size host out of flow. -->
  <P5Canvas {sketch} class="absolute pointer-events-none" />

  <!-- Empty State -->
  {#if !$drawingState.imageElement}
    <div
      class="absolute inset-0 flex items-center justify-center pointer-events-none"
      data-ui-element
    >
      <div class="text-center text-base-content/40 text-2xl space-y-2">
        {#if $drawingConfig.isTranscriptionMode}
          <p>Upload a floor plan and video to get started</p>
        {:else}
          <p>Upload a floor plan to get started</p>
          <p>or try an example from the <span class="font-medium">Example Data</span> menu</p>
        {/if}
      </div>
    </div>
  {/if}

  {#if $drawingConfig.isTranscriptionMode}
    {@const startSplitterDrag = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
      isDraggingSplitter = true
    }}
    <button
      class="absolute top-0 bottom-0 w-8 bg-transparent cursor-col-resize hover:bg-base-content/5 touch-none"
      style="left: calc({$drawingConfig.splitPosition}% - 16px)"
      data-ui-element
      on:mousedown={startSplitterDrag}
      on:touchstart={startSplitterDrag}
      on:keydown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') startSplitterDrag(e)
      }}
      role="separator"
      aria-label="Resize panels"
      transition:fade={{ duration: 200 }}
    >
      <div
        class="absolute top-0 bottom-0 w-1 bg-base-300 hover:bg-primary transition-colors"
        style="left: 50%"
      ></div>
    </button>
  {/if}

  {#if videoHtmlElement}
    <VideoControls videoElement={videoHtmlElement} />
  {:else if !$drawingConfig.isTranscriptionMode && $drawingState.imageElement}
    <!-- Speculate mode controls (forward/rewind buttons) -->
    <div
      class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-base-200/80 backdrop-blur-sm rounded-lg p-2 shadow-lg"
      data-ui-element
    >
      <button
        class="btn btn-ghost btn-sm btn-circle"
        on:click={handleRewindSpeculateMode}
        aria-label="Rewind"
        title="Rewind (R)"
      >
        <IconRewind class="h-5 w-5" />
      </button>
      <button
        class="btn btn-ghost btn-sm btn-circle"
        on:click={handleForwardSpeculateMode}
        aria-label="Forward"
        title="Forward (F)"
      >
        <IconForward class="h-5 w-5" />
      </button>
    </div>
  {/if}

  <!-- Assets needed for recovered session -->
  {#if hasRecordedPaths}
    {@const alertMessage =
      $drawingConfig.isTranscriptionMode && !$drawingState.imageElement
        ? 'Upload your floor plan and video to continue recording'
        : $drawingConfig.isTranscriptionMode && !videoHtmlElement
          ? 'Upload your video to continue recording'
          : !$drawingConfig.isTranscriptionMode && !$drawingState.imageElement
            ? 'Upload your floor plan to continue recording'
            : null}
    {#if alertMessage}
      <div
        class="absolute top-4 left-4 right-4 flex justify-center pointer-events-none"
        data-ui-element
      >
        <div class="alert alert-info shadow-lg max-w-md pointer-events-auto">
          <IconInfo class="h-5 w-5" />
          <span class="text-sm">{alertMessage}</span>
        </div>
      </div>
    {/if}
  {/if}
</div>
