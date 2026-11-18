<script lang="ts">
  import VideoPlayerComponent from './VideoPlayer.svelte'
  import VideoControls from './VideoControls.svelte'
</script>

<div class="split-video-container">
  <div class="video-area">
    <VideoPlayerComponent />
  </div>

  <div class="controls-bar">
    <VideoControls />
  </div>
</div>

<style>
  .split-video-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #000;
    position: relative;
  }

  .video-area {
    flex: 1;
    position: relative;
    min-height: 0;
  }

  .controls-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 2;
  }
</style>
