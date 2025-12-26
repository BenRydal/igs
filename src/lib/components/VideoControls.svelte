<script lang="ts">
  import { onDestroy } from 'svelte'
  import VideoStore, { toggleMute, toggleSplitScreen, setCurrentTime } from '../../stores/videoStore'
  import { isPlayingVideo } from '../../stores/playbackStore'
  import { getCurrentTime, type VideoPlayer } from '../video/video-service'
  import MdVolumeUp from '~icons/mdi/volume-high'
  import MdVolumeOff from '~icons/mdi/volume-off'
  import MdArrowExpandHorizontal from '~icons/mdi/arrow-expand-horizontal'
  import MdArrowCollapseHorizontal from '~icons/mdi/arrow-collapse-horizontal'

  interface Props {
    player: VideoPlayer | null
  }

  let { player }: Props = $props()

  let animationFrameId: number | null = null

  let isPlaying = $derived($isPlayingVideo)
  let isMuted = $derived($VideoStore.isMuted)
  let isSplitScreen = $derived($VideoStore.isSplitScreen)

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

  function handleSplitScreen(e: MouseEvent) {
    e.stopPropagation()
    toggleSplitScreen()
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
  <button
    class="control-btn"
    onclick={handleSplitScreen}
    aria-label={isSplitScreen ? 'Exit split screen' : 'Enter split screen'}
    title={isSplitScreen ? 'Exit split screen' : 'Split screen'}
  >
    {#if isSplitScreen}
      <MdArrowCollapseHorizontal />
    {:else}
      <MdArrowExpandHorizontal />
    {/if}
  </button>
</div>

<style>
  .video-controls {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    padding: 6px 10px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
    user-select: none;
  }

  .control-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 6px;
    background: rgba(0, 0, 0, 0.5);
    border: none;
    border-radius: 6px;
    color: white;
    cursor: pointer;
    transition: background 0.15s;
  }

  .control-btn:hover {
    background: rgba(0, 0, 0, 0.7);
  }

  .control-btn :global(svg) {
    width: 22px;
    height: 22px;
  }
</style>
