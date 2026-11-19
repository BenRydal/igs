<script lang="ts">
  import VideoStore, { toggleMute, toggleSplitScreen } from '../../stores/videoStore'
  import MdVolumeUp from '~icons/mdi/volume-high'
  import MdVolumeOff from '~icons/mdi/volume-off'
  import MdArrowExpandHorizontal from '~icons/mdi/arrow-expand-horizontal'
  import MdArrowCollapseHorizontal from '~icons/mdi/arrow-collapse-horizontal'

  let isMuted = $derived($VideoStore.isMuted)
  let isSplitScreen = $derived($VideoStore.isSplitScreen)

  function handleMute(e: MouseEvent) {
    e.stopPropagation()
    toggleMute()
  }

  function handleSplitScreen(e: MouseEvent) {
    e.stopPropagation()
    toggleSplitScreen()
  }
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
