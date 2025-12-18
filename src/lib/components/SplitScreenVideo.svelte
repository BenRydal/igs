<script lang="ts">
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

  const syncState = createVideoSyncState()

  let isPlaying = $derived($VideoStore.isPlaying)
  let isMuted = $derived($VideoStore.isMuted)
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
</script>

<div class="split-video-container">
  <div class="video-area">
    <VideoPlayerComponent onready={onPlayerReady} onerror={onPlayerError} />
  </div>

  <div class="controls-bar">
    <VideoControls player={syncState.player} />
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
