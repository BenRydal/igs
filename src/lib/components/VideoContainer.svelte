<script lang="ts">
  import { onMount } from 'svelte'
  import { browser } from '$app/environment'
  import { DraggableWindow } from 'svelte-p5-components'
  import VideoStore from '../../stores/videoStore'
  import { isPlayingVideo } from '../../stores/playbackStore'
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

  const MIN_WIDTH = 160
  const DEFAULT_WIDTH = 480
  const ASPECT_RATIO = 16 / 9
  const CHROME_HEIGHT = 30 // DraggableWindow titlebar

  const syncState = createVideoSyncState()

  let isPlaying = $derived($isPlayingVideo)
  let isMuted = $derived($VideoStore.isMuted)
  let isVisible = $derived($VideoStore.isVisible)
  let isLoaded = $derived($VideoStore.isLoaded)
  let seekRequest = $derived($VideoStore.seekRequest)

  // Handle seek requests
  $effect(() => {
    handleSeekRequest(syncState, seekRequest, isPlaying)
  })

  // Sync playback state with player
  $effect(() => {
    syncPlaybackState(syncState, isPlaying, isLoaded)
  })

  // Sync mute state with player
  $effect(() => {
    syncMuteState(syncState, isMuted, isLoaded)
  })

  function onPlayerReady(playerInstance: VideoPlayer) {
    handlePlayerReady(syncState, playerInstance, isPlaying, isMuted)
  }

  function onPlayerError(message: string) {
    console.error('Video player error:', message)
  }

  // Initial position: top-right of the canvas container. DraggableWindow owns
  // position from then on (user drag). Mounting is deferred until the canvas
  // container has settled to a real size — measuring during CanvasFrame's
  // first flex layout yields a tiny rect, and DraggableWindow's parent clamp
  // would pin the window to (0,0). The window then renders even while hidden
  // (visibility, not {#if}) because the YouTube iframe must stay in the DOM.
  let initial = $state<{ x: number; y: number } | null>(null)

  onMount(() => {
    if (!browser) return
    let raf = 0
    const measure = () => {
      const rect = document.getElementById('p5-canvas-container')?.getBoundingClientRect()
      if (rect && rect.width > 200) {
        initial = { x: Math.max(10, rect.width - DEFAULT_WIDTH - 20), y: 10 }
      } else {
        raf = requestAnimationFrame(measure)
      }
    }
    measure()
    return () => cancelAnimationFrame(raf)
  })

  // Width is the only size state; height follows it, which is what keeps the
  // window at 16:9. DraggableWindow's native `resize: both` is disabled in CSS
  // so the two can't fight over the element's inline size.
  let width = $state(DEFAULT_WIDTH)
  let height = $derived(width / ASPECT_RATIO + CHROME_HEIGHT)

  let resizeStartX = 0
  let resizeStartWidth = 0
  let maxWidth = Infinity

  function startResize(e: PointerEvent) {
    e.preventDefault()
    e.stopPropagation()
    resizeStartX = e.clientX
    resizeStartWidth = width
    const shell = (e.currentTarget as HTMLElement).closest('.video-window-shell')
    const win = (e.currentTarget as HTMLElement).closest('.draggable-window')
    // Cap growth at the canvas pane, otherwise DraggableWindow's parent clamp
    // snaps the window to (0,0) once it outgrows its container.
    maxWidth =
      shell && win
        ? shell.getBoundingClientRect().right - win.getBoundingClientRect().left - 10
        : Infinity
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  function trackResize(e: PointerEvent) {
    const el = e.currentTarget as HTMLElement
    if (!el.hasPointerCapture(e.pointerId)) return
    width = Math.min(maxWidth, Math.max(MIN_WIDTH, resizeStartWidth + (e.clientX - resizeStartX)))
  }

  function endResize(e: PointerEvent) {
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  }
</script>

{#if initial}
  <div class="video-window-shell" class:shell-hidden={!isVisible}>
    <DraggableWindow
      title="Video"
      initialX={initial.x}
      initialY={initial.y}
      {width}
      {height}
      minWidth={MIN_WIDTH}
      minHeight={MIN_WIDTH / ASPECT_RATIO + CHROME_HEIGHT}
      constrained="parent"
    >
      <div class="video-area">
        <VideoPlayerComponent onready={onPlayerReady} onerror={onPlayerError} />

        <!-- Click shield for YouTube -->
        <div class="click-shield"></div>

        <!-- Controls bar at bottom -->
        <div class="controls-bar">
          <VideoControls player={syncState.player} />
        </div>

        <!-- Pointer capture keeps the drag alive over the YouTube iframe. -->
        <button
          class="resize-grip"
          aria-label="Resize video"
          onpointerdown={startResize}
          onpointermove={trackResize}
          onpointerup={endResize}
          onpointercancel={endResize}
        ></button>
      </div>
    </DraggableWindow>
  </div>
{/if}

<style>
  /* Fills #p5-canvas-container so DraggableWindow's constrained="parent"
     clamps against the canvas area; pointer-events discipline keeps the
     shell from swallowing canvas input (same pattern as CanvasFrame's
     overlay region). */
  .video-window-shell {
    position: absolute;
    inset: 0;
    pointer-events: none;
    /* Contains DraggableWindow's unbounded z-index so it can't reach a modal. */
    isolation: isolate;
  }

  .video-window-shell > :global(*) {
    pointer-events: auto;
  }

  /* The native corner gripper is invisible against the controls bar and can't
     hold 16:9 — .resize-grip replaces it. */
  .video-window-shell :global(.draggable-window) {
    resize: none;
  }

  .video-window-shell.shell-hidden {
    /* visibility (not display) keeps the YouTube iframe attached to the DOM */
    visibility: hidden;
  }

  .video-window-shell.shell-hidden > :global(*) {
    pointer-events: none;
  }

  .video-area {
    position: relative;
    width: 100%;
    height: 100%;
    background: #000;
  }

  .click-shield {
    position: absolute;
    inset: 0;
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

  .resize-grip {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 18px;
    height: 18px;
    z-index: 3;
    padding: 0;
    border: none;
    cursor: nwse-resize;
    touch-action: none;
    background: linear-gradient(
      135deg,
      transparent 50%,
      rgba(255, 255, 255, 0.5) 50%,
      rgba(255, 255, 255, 0.5) 65%,
      transparent 65%,
      transparent 78%,
      rgba(255, 255, 255, 0.5) 78%
    );
  }

  .resize-grip:hover,
  .resize-grip:focus-visible {
    background-color: rgba(100, 150, 255, 0.35);
  }
</style>
