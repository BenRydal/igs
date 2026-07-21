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
</script>

{#if initial}
  <div class="video-window-shell" class:shell-hidden={!isVisible}>
    <DraggableWindow
      title="Video"
      initialX={initial.x}
      initialY={initial.y}
      width={DEFAULT_WIDTH}
      height={DEFAULT_WIDTH / ASPECT_RATIO + CHROME_HEIGHT}
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
  }

  .video-window-shell > :global(*) {
    pointer-events: auto;
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
</style>
