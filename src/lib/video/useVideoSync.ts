/**
 * Shared video player synchronization logic
 * Used by both VideoContainer and SplitScreenVideo components
 */
import { get } from 'svelte/store'
import VideoStore, { clearSeekRequest } from '../../stores/videoStore'
import { playVideo, pauseVideo, seekTo, muteVideo, unmuteVideo, type VideoPlayer } from './video-service'

export interface VideoSyncState {
  player: VideoPlayer | null
  prevIsPlaying: boolean | null
  prevIsMuted: boolean | null
  lastSeekRequestId: number
}

export function createVideoSyncState(): VideoSyncState {
  return {
    player: null,
    prevIsPlaying: null,
    prevIsMuted: null,
    lastSeekRequestId: 0,
  }
}

/**
 * Handle seek requests from the store
 */
export function handleSeekRequest(
  state: VideoSyncState,
  seekRequest: { time: number; id: number } | null
): void {
  if (state.player && seekRequest && seekRequest.id !== state.lastSeekRequestId) {
    state.lastSeekRequestId = seekRequest.id
    seekTo(state.player, seekRequest.time)
    clearSeekRequest()
  }
}

/**
 * Sync playback state (play/pause) with the video player
 */
export function syncPlaybackState(
  state: VideoSyncState,
  isPlaying: boolean,
  isLoaded: boolean
): void {
  if (!state.player || !isLoaded) return

  if (isPlaying !== state.prevIsPlaying) {
    if (isPlaying) {
      playVideo(state.player)
    } else if (state.prevIsPlaying === true) {
      pauseVideo(state.player)
    }
    state.prevIsPlaying = isPlaying
  }
}

/**
 * Sync mute state with the video player
 */
export function syncMuteState(
  state: VideoSyncState,
  isMuted: boolean,
  isLoaded: boolean
): void {
  if (!state.player || !isLoaded) return

  if (isMuted !== state.prevIsMuted) {
    if (isMuted) {
      muteVideo(state.player)
    } else if (state.prevIsMuted === true) {
      unmuteVideo(state.player)
    }
    state.prevIsMuted = isMuted
  }
}

/**
 * Handle player ready event - restores position and state
 */
export function handlePlayerReady(
  state: VideoSyncState,
  playerInstance: VideoPlayer,
  isPlaying: boolean,
  isMuted: boolean
): void {
  state.player = playerInstance
  state.prevIsPlaying = isPlaying
  state.prevIsMuted = isMuted

  // Restore video position if there was a saved position
  const savedTime = get(VideoStore).currentTime
  if (savedTime > 0) {
    seekTo(state.player, savedTime)
    // Ensure we stay paused if we weren't playing
    if (!isPlaying) {
      setTimeout(() => pauseVideo(state.player!), 100)
    }
  }
}
