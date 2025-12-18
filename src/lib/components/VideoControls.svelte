<script lang="ts">
  import { onDestroy } from 'svelte'
  import VideoStore, { toggleMute, setCurrentTime } from '../../stores/videoStore'
  import { getCurrentTime, type VideoPlayer } from '../video/video-service'
  import MdVolumeUp from '~icons/mdi/volume-high'
  import MdVolumeOff from '~icons/mdi/volume-off'

  interface Props {
    player: VideoPlayer | null
  }

  let { player }: Props = $props()

  let animationFrameId: number | null = null

  let isPlaying = $derived($VideoStore.isPlaying)
  let isMuted = $derived($VideoStore.isMuted)

  // Update current time from player (needed for visualization dot tracking)
  function updateTime() {
    if (player) {
      const time = getCurrentTime(player)
      setCurrentTime(time)
    }
    if (isPlaying) {
      animationFrameId = requestAnimationFrame(updateTime)
    } else {
      animationFrameId = null
    }
  }

  // Start/stop time updates when play state changes
  $effect(() => {
    if (isPlaying && !animationFrameId) {
      animationFrameId = requestAnimationFrame(updateTime)
    }
  })

  function handleMute(e: MouseEvent) {
    e.stopPropagation()
    toggleMute()
  }

  onDestroy(() => {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
    }
  })
</script>

<div
  class="video-controls"
  onmousedown={(e) => e.stopPropagation()}
  onclick={(e) => e.stopPropagation()}
  role="toolbar"
>
  <button class="control-btn" onclick={handleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}>
    {#if isMuted}
      <MdVolumeOff />
    {:else}
      <MdVolumeUp />
    {/if}
  </button>
</div>

<style>
  .video-controls {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 6px 10px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
    user-select: none;
  }

  .control-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 4px;
    background: rgba(0, 0, 0, 0.5);
    border: none;
    border-radius: 4px;
    color: white;
    cursor: pointer;
    transition: background 0.15s;
  }

  .control-btn:hover {
    background: rgba(0, 0, 0, 0.7);
  }

  .control-btn :global(svg) {
    width: 16px;
    height: 16px;
  }
</style>
