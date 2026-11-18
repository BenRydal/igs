import { writable, derived, get } from 'svelte/store'
import VideoStore from './videoStore'
import { seekVideo } from '../lib/video/player'
import { timelineV2Store } from '../lib/timeline/store'
import { redrawCanvas } from '../lib/utils/p5'

export type PlaybackMode = 'stopped' | 'playing-video' | 'playing-animation'

interface PlaybackState {
  mode: PlaybackMode
}

const initialState: PlaybackState = {
  mode: 'stopped',
}

const PlaybackStore = writable<PlaybackState>(initialState)

// Derived store: is playback active (either mode)?
export const isPlaying = derived(PlaybackStore, ($store) => $store.mode !== 'stopped')

// Derived store: is video-driven playback?
export const isPlayingVideo = derived(PlaybackStore, ($store) => $store.mode === 'playing-video')

/**
 * Get current playback mode
 */
function getMode(): PlaybackMode {
  return get(PlaybackStore).mode
}

/**
 * Set playback mode
 */
function setMode(mode: PlaybackMode): void {
  PlaybackStore.update((state) => ({ ...state, mode }))
  redrawCanvas()
}

/**
 * Start playback - automatically picks video or animation mode based on video state
 */
function play(): void {
  const videoState = get(VideoStore)
  const mode: PlaybackMode =
    videoState.isVisible && videoState.isLoaded ? 'playing-video' : 'playing-animation'

  // If starting video playback, seek to current timeline position
  if (mode === 'playing-video') {
    const state = timelineV2Store.getState()
    seekVideo(state.currentTime)
  }

  setMode(mode)
}

/**
 * Stop playback
 */
export function pause(): void {
  setMode('stopped')
}

/**
 * Toggle between playing and stopped
 */
export function togglePlayback(): void {
  const currentMode = getMode()
  if (currentMode === 'stopped') {
    // If at the end, reset to beginning before playing
    const state = timelineV2Store.getState()
    if (state.currentTime >= state.viewEnd) {
      timelineV2Store.setCurrentTime(state.viewStart)
    }
    play()
  } else {
    pause()
  }
}

/**
 * Handle video visibility change - switch modes if currently playing
 */
export function onVideoVisibilityChange(isVisible: boolean): void {
  const currentMode = getMode()

  if (currentMode === 'stopped') {
    return
  }

  const videoState = get(VideoStore)

  if (isVisible && videoState.isLoaded) {
    // Showing video while playing - switch to video mode
    const state = timelineV2Store.getState()
    seekVideo(state.currentTime)
    setMode('playing-video')
  } else if (!isVisible && currentMode === 'playing-video') {
    // Hiding video while in video mode - switch to animation mode
    setMode('playing-animation')
  }
}

/**
 * Handle animation reaching the end
 */
export function onAnimationEnd(): void {
  const state = timelineV2Store.getState()

  // Reset timeline to start
  timelineV2Store.setCurrentTime(state.viewStart)

  // Stop playback
  pause()

  // Seek video to start if visible
  const videoState = get(VideoStore)
  if (videoState.isVisible) {
    seekVideo(state.viewStart)
  }
}

export default PlaybackStore
