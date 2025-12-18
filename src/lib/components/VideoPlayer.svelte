<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { browser } from '$app/environment'
  import VideoStore, { setLoaded } from '../../stores/videoStore'
  import {
    createYouTubePlayer,
    type VideoPlayer,
    destroyPlayer,
  } from '../video/video-service'

  interface Props {
    onready?: (player: VideoPlayer, duration: number) => void
    onerror?: (message: string) => void
  }

  let { onready, onerror }: Props = $props()

  let containerEl = $state<HTMLDivElement>()
  let youtubeContainerEl = $state<HTMLDivElement>()
  let videoEl = $state<HTMLVideoElement>()
  let player = $state<VideoPlayer | null>(null)

  const youtubeContainerId = 'youtube-player-container'

  // Track source changes
  let prevSourceType: string | null = null
  let prevVideoId: string | undefined = undefined
  let prevFileUrl: string | undefined = undefined

  let source = $derived($VideoStore.source)

  // Watch for source changes and initialize player
  $effect(() => {
    if (!browser || !containerEl) return

    const sourceChanged =
      source.type !== prevSourceType ||
      source.videoId !== prevVideoId ||
      source.fileUrl !== prevFileUrl

    if (sourceChanged && source.type) {
      prevSourceType = source.type
      prevVideoId = source.videoId
      prevFileUrl = source.fileUrl
      initializePlayer()
    }
  })

  function initializePlayer() {
    // Destroy existing player first
    if (player) {
      destroyPlayer(player)
      player = null
    }

    // Clear the YouTube container if switching away from YouTube
    if (youtubeContainerEl) {
      youtubeContainerEl.innerHTML = ''
    }

    if (source.type === 'youtube' && source.videoId) {
      // Small delay to ensure DOM is ready
      setTimeout(() => initYouTubePlayer(source.videoId!), 50)
    }
    // HTML5 video will be initialized via the element binding
  }

  function initYouTubePlayer(videoId: string) {
    if (!youtubeContainerEl) return

    // Create a new div for the YouTube player inside our container
    const playerDiv = document.createElement('div')
    playerDiv.id = youtubeContainerId + '-' + Date.now()
    youtubeContainerEl.innerHTML = ''
    youtubeContainerEl.appendChild(playerDiv)

    createYouTubePlayer(
      playerDiv.id,
      videoId,
      (ytPlayer, duration) => {
        player = ytPlayer
        setLoaded(duration)
        onready?.(player, duration)
      },
      (error) => {
        onerror?.(`YouTube error: ${error}`)
      }
    )
  }

  function handleVideoLoaded() {
    if (videoEl) {
      player = videoEl
      const duration = videoEl.duration
      setLoaded(duration)
      onready?.(player, duration)
    }
  }

  function handleVideoError() {
    onerror?.('Error loading video file')
  }

  onDestroy(() => {
    if (player) {
      destroyPlayer(player)
      player = null
    }
  })
</script>

<div class="video-player" bind:this={containerEl}>
  <!-- Always render both containers, hide with CSS -->
  <div
    bind:this={youtubeContainerEl}
    class="youtube-container"
    class:hidden={source.type !== 'youtube'}
  ></div>

  {#if source.type === 'file' && source.fileUrl}
    <video
      bind:this={videoEl}
      src={source.fileUrl}
      onloadedmetadata={handleVideoLoaded}
      onerror={handleVideoError}
      playsinline
    >
      <track kind="captions" />
    </video>
  {/if}
</div>

<style>
  .video-player {
    width: 100%;
    height: 100%;
    background: #000;
  }

  .youtube-container {
    width: 100%;
    height: 100%;
  }

  .youtube-container.hidden {
    display: none;
  }

  .youtube-container :global(iframe) {
    width: 100%;
    height: 100%;
    border: none;
  }

  video {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
</style>
