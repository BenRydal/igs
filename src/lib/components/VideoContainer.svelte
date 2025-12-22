<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { browser } from '$app/environment'
  import VideoStore from '../../stores/videoStore'
  import { type VideoPlayer } from '../video/video-service'
  import {
    createVideoSyncState,
    handleSeekRequest,
    syncPlaybackState,
    syncMuteState,
    handlePlayerReady,
  } from '../video/useVideoSync'
  import VideoPlayerComponent from './VideoPlayer.svelte'
  import VideoControls from './VideoControls.svelte'

  const DRAG_HANDLE_HEIGHT = 24
  const MIN_WIDTH = 160
  const DEFAULT_WIDTH = 480
  const ASPECT_RATIO = 16 / 9

  const syncState = createVideoSyncState()

  // Local state for position/size
  let posX = $state(50)
  let posY = $state(50)
  let width = $state(DEFAULT_WIDTH)

  let height = $derived(width / ASPECT_RATIO + DRAG_HANDLE_HEIGHT)

  // Drag state
  let isDragging = $state(false)
  let dragStartX = 0
  let dragStartY = 0
  let dragStartPosX = 0
  let dragStartPosY = 0

  // Resize state
  let isResizing = $state(false)
  let resizeCorner = ''
  let resizeStartX = 0
  let resizeStartWidth = 0
  let resizeStartPosX = 0
  let resizeStartPosY = 0

  let isPlaying = $derived($VideoStore.isPlaying)
  let isMuted = $derived($VideoStore.isMuted)
  let isVisible = $derived($VideoStore.isVisible)
  let isLoaded = $derived($VideoStore.isLoaded)
  let seekRequest = $derived($VideoStore.seekRequest)

  // Handle seek requests
  $effect(() => {
    handleSeekRequest(syncState, seekRequest)
  })

  // Sync playback state with player
  $effect(() => {
    syncPlaybackState(syncState, isPlaying, isLoaded)
  })

  // Sync mute state with player
  $effect(() => {
    syncMuteState(syncState, isMuted, isLoaded)
  })

  function onPlayerReady(playerInstance: VideoPlayer, duration: number) {
    handlePlayerReady(syncState, playerInstance, isPlaying, isMuted)
  }

  function onPlayerError(message: string) {
    console.error('Video player error:', message)
  }

  function handleDragStart(e: MouseEvent) {
    if (isResizing) return
    isDragging = true
    dragStartX = e.clientX
    dragStartY = e.clientY
    dragStartPosX = posX
    dragStartPosY = posY
    e.preventDefault()
  }

  function handleResizeStart(e: MouseEvent, corner: string) {
    isResizing = true
    resizeCorner = corner
    resizeStartX = e.clientX
    resizeStartWidth = width
    resizeStartPosX = posX
    resizeStartPosY = posY
    e.preventDefault()
    e.stopPropagation()
  }

  function handleMouseMove(e: MouseEvent) {
    if (isDragging) {
      const dx = e.clientX - dragStartX
      const dy = e.clientY - dragStartY
      let newX = dragStartPosX + dx
      let newY = dragStartPosY + dy

      // Constrain to container
      const canvasContainer = document.getElementById('p5-canvas-container')
      if (canvasContainer) {
        const rect = canvasContainer.getBoundingClientRect()
        newX = Math.max(0, Math.min(newX, rect.width - width))
        newY = Math.max(0, Math.min(newY, rect.height - height))
      }

      posX = newX
      posY = newY
    }

    if (isResizing) {
      const dx = e.clientX - resizeStartX

      let newWidth = resizeStartWidth
      let newX = resizeStartPosX
      let newY = resizeStartPosY

      const videoHeight = (w: number) => w / ASPECT_RATIO
      const totalHeight = (w: number) => videoHeight(w) + DRAG_HANDLE_HEIGHT

      if (resizeCorner === 'se') {
        newWidth = Math.max(MIN_WIDTH, resizeStartWidth + dx)
      } else if (resizeCorner === 'sw') {
        newWidth = Math.max(MIN_WIDTH, resizeStartWidth - dx)
        newX = resizeStartPosX + (resizeStartWidth - newWidth)
      } else if (resizeCorner === 'ne') {
        newWidth = Math.max(MIN_WIDTH, resizeStartWidth + dx)
        const oldHeight = totalHeight(resizeStartWidth)
        const newHeight = totalHeight(newWidth)
        newY = resizeStartPosY + (oldHeight - newHeight)
      } else if (resizeCorner === 'nw') {
        newWidth = Math.max(MIN_WIDTH, resizeStartWidth - dx)
        newX = resizeStartPosX + (resizeStartWidth - newWidth)
        const oldHeight = totalHeight(resizeStartWidth)
        const newHeight = totalHeight(newWidth)
        newY = resizeStartPosY + (oldHeight - newHeight)
      }

      width = newWidth
      posX = newX
      posY = newY
    }
  }

  function handleMouseUp() {
    isDragging = false
    isResizing = false
    resizeCorner = ''
  }

  onMount(() => {
    if (browser) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      // Position video on the right side of the container
      const canvasContainer = document.getElementById('p5-canvas-container')
      if (canvasContainer) {
        const rect = canvasContainer.getBoundingClientRect()
        posX = rect.width - width - 20 // 20px margin from right
      }
    }
  })

  onDestroy(() => {
    if (browser) {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  })
</script>

<div
  class="video-container"
  class:hidden={!isVisible}
  style="left: {posX}px; top: {posY}px; width: {width}px; height: {height}px;"
>
  <!-- Drag handle -->
  <div
    class="drag-handle"
    class:dragging={isDragging}
    onmousedown={handleDragStart}
    role="button"
    tabindex="0"
    aria-label="Drag to move video"
  >
    <span class="drag-dots">&#x22EE;&#x22EE;</span>
  </div>

  <!-- Video player area -->
  <div class="video-area" style="height: {height - DRAG_HANDLE_HEIGHT}px;">
    <VideoPlayerComponent onready={onPlayerReady} onerror={onPlayerError} />

    <!-- Click shield for YouTube -->
    <div class="click-shield"></div>
  </div>

  <!-- Controls bar at bottom -->
  <div class="controls-bar">
    <VideoControls player={syncState.player} />
  </div>

  <!-- Resize handles -->
  <button
    class="resize-handle nw"
    onmousedown={(e) => handleResizeStart(e, 'nw')}
    aria-label="Resize from top-left corner"
  ></button>
  <button
    class="resize-handle ne"
    onmousedown={(e) => handleResizeStart(e, 'ne')}
    aria-label="Resize from top-right corner"
  ></button>
  <button
    class="resize-handle sw"
    onmousedown={(e) => handleResizeStart(e, 'sw')}
    aria-label="Resize from bottom-left corner"
  ></button>
  <button
    class="resize-handle se"
    onmousedown={(e) => handleResizeStart(e, 'se')}
    aria-label="Resize from bottom-right corner"
  ></button>
</div>

<style>
  .video-container {
    position: absolute;
    z-index: 100;
    border: 2px solid rgba(0, 0, 0, 0.5);
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .video-container.hidden {
    /* Use visibility instead of display:none to keep YouTube iframe attached to DOM */
    visibility: hidden;
    pointer-events: none;
  }

  .drag-handle {
    height: 24px;
    background: linear-gradient(to bottom, #444, #333);
    cursor: grab;
    display: flex;
    justify-content: center;
    align-items: center;
    user-select: none;
  }

  .drag-handle.dragging {
    cursor: grabbing;
    background: linear-gradient(to bottom, #555, #444);
  }

  .drag-dots {
    color: rgba(255, 255, 255, 0.6);
    font-size: 12px;
    letter-spacing: 2px;
  }

  .video-area {
    position: relative;
    background: #000;
  }

  .click-shield {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
    background: transparent;
  }

  .controls-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 2;
  }

  .resize-handle {
    position: absolute;
    width: 20px;
    height: 20px;
    background: rgba(255, 255, 255, 0.95);
    border: 2px solid rgba(0, 0, 0, 0.5);
    border-radius: 3px;
    z-index: 103;
    padding: 0;
  }

  .resize-handle:hover {
    background: rgba(100, 150, 255, 0.95);
    transform: scale(1.1);
  }

  .resize-handle.nw {
    top: -8px;
    left: -8px;
    cursor: nw-resize;
  }

  .resize-handle.ne {
    top: -8px;
    right: -8px;
    cursor: ne-resize;
  }

  .resize-handle.sw {
    bottom: -8px;
    left: -8px;
    cursor: sw-resize;
  }

  .resize-handle.se {
    bottom: -8px;
    right: -8px;
    cursor: se-resize;
  }
</style>
