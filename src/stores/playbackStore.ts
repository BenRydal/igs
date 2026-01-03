import { writable, derived, get } from 'svelte/store'
import VideoStore, { requestSeek } from './videoStore'
import { timelineV2Store } from '../lib/timeline/store'
import P5Store from './p5Store'

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
export function getMode(): PlaybackMode {
  return get(PlaybackStore).mode
}

/**
 * Set playback mode
 */
export function setMode(mode: PlaybackMode): void {
  PlaybackStore.update((state) => ({ ...state, mode }))
  triggerRedraw()
}

/**
 * Start playback - automatically picks video or animation mode based on video state
 */
export function play(): void {
  const videoState = get(VideoStore)
  const mode: PlaybackMode =
    videoState.isVisible && videoState.isLoaded ? 'playing-video' : 'playing-animation'

  // If starting video playback, seek to current timeline position
  if (mode === 'playing-video') {
    const state = timelineV2Store.getState()
    requestSeek(state.currentTime)
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
    if (state.currentTime >= state.selectionEnd) {
      timelineV2Store.setCurrentTime(state.selectionStart)
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
    requestSeek(state.currentTime)
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
  timelineV2Store.setCurrentTime(state.selectionStart)

  // Stop playback
  pause()

  // Seek video to start if visible
  const videoState = get(VideoStore)
  if (videoState.isVisible) {
    requestSeek(state.selectionStart)
  }
}

/**
 * Trigger p5 redraw
 */
function triggerRedraw(): void {
  const p5 = get(P5Store)
  if (p5) {
    p5.loop()
  }
}

export default PlaybackStore
