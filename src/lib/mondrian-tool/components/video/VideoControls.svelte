<script lang="ts">
  import { onMount, afterUpdate } from 'svelte'
  import {
    handleForwardTranscription,
    handleRewindTranscription,
  } from '../../stores/drawingState'
  import IconRewind from '~icons/material-symbols/fast-rewind'
  import IconForward from '~icons/material-symbols/fast-forward'

  export let videoElement: HTMLVideoElement

  let progress = 0
  let duration = 0
  let currentTime = 0
  let isDraggingProgress = false
  let progressBarElement: HTMLDivElement

  function updateDuration() {
    if (videoElement && !isNaN(videoElement.duration)) {
      duration = videoElement.duration
    }
  }

  function updateProgress() {
    if (!isDraggingProgress && videoElement) {
      if (!isNaN(videoElement.duration) && videoElement.duration > 0) {
        progress = (videoElement.currentTime / videoElement.duration) * 100
        currentTime = videoElement.currentTime
      } else {
        progress = 0
        currentTime = 0
      }
    }
  }

  function handleProgressBarClick(e: MouseEvent | TouchEvent) {
    if (!videoElement || !progressBarElement) return

    const rect = progressBarElement.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const pos = (clientX - rect.left) / rect.width
    videoElement.currentTime = pos * videoElement.duration
  }

  function handleKeyPress(e: KeyboardEvent) {
    if (!videoElement) return

    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      videoElement.currentTime = Math.max(0, videoElement.currentTime - 5)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      videoElement.currentTime = Math.min(videoElement.duration, videoElement.currentTime + 5)
    }
  }

  function handleProgressBarDrag(e: MouseEvent | TouchEvent) {
    if (isDraggingProgress && progressBarElement) {
      handleProgressBarClick(e)
    }
  }

  function formatTime(seconds: number): string {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  onMount(() => {
    setupVideoListeners()

    return () => {
      removeVideoListeners()
    }
  })

  afterUpdate(() => {
    setupVideoListeners()
    updateDuration()
    updateProgress()
  })

  function setupVideoListeners() {
    if (videoElement) {
      removeVideoListeners()

      videoElement.addEventListener('timeupdate', updateProgress)
      videoElement.addEventListener('loadedmetadata', updateDuration)
      videoElement.addEventListener('durationchange', updateDuration)
    }
  }

  function removeVideoListeners() {
    if (videoElement) {
      videoElement.removeEventListener('timeupdate', updateProgress)
      videoElement.removeEventListener('loadedmetadata', updateDuration)
      videoElement.removeEventListener('durationchange', updateDuration)
    }
  }
</script>

<div class="video-controls p-2 rounded-b-lg" data-ui-element>
  <div class="w-full flex items-center gap-2">
    <!-- Rewind button -->
    <button
      class="btn btn-ghost btn-sm btn-circle"
      on:click={() => handleRewindTranscription(videoElement)}
      aria-label="Rewind 5 seconds"
      title="Rewind 5s (R)"
    >
      <IconRewind class="h-5 w-5" />
    </button>

    <div
      bind:this={progressBarElement}
      class="progress progress-secondary flex-1 cursor-pointer relative touch-none"
      on:mousedown={() => (isDraggingProgress = true)}
      on:mousemove={handleProgressBarDrag}
      on:mouseup={() => (isDraggingProgress = false)}
      on:mouseleave={() => (isDraggingProgress = false)}
      on:click={handleProgressBarClick}
      on:touchstart={(e) => {
        isDraggingProgress = true
        handleProgressBarClick(e) // Seek immediately on tap
      }}
      on:touchmove={handleProgressBarDrag}
      on:touchend={() => (isDraggingProgress = false)}
      on:touchcancel={() => (isDraggingProgress = false)}
      on:keydown={handleKeyPress}
      role="slider"
      aria-label="Video progress"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow={progress}
      tabindex="0"
    >
      <div
        class="progress-bar-fill bg-secondary h-full transition-all duration-100"
        style="width: {progress}%"
      ></div>
    </div>

    <!-- Forward button -->
    <button
      class="btn btn-ghost btn-sm btn-circle"
      on:click={() => handleForwardTranscription(videoElement)}
      aria-label="Forward 5 seconds"
      title="Forward 5s (F)"
    >
      <IconForward class="h-5 w-5" />
    </button>
  </div>

  <div class="flex justify-between items-center mt-1 text-sm">
    <span>{formatTime(currentTime)}</span>
    <span>{formatTime(duration)}</span>
  </div>
</div>

<style>
  .video-controls {
    position: absolute;
    bottom: 0;
    left: 0;
    z-index: 10;
    width: var(--split-width);
  }

  .progress:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  .progress-bar-fill {
    border-radius: inherit;
  }
</style>
