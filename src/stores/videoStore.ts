import { writable, get } from 'svelte/store'

export interface VideoSource {
  type: 'youtube' | 'file' | null
  videoId?: string
  fileUrl?: string
}

interface VideoState {
  // Source
  source: VideoSource

  // Video state
  isLoaded: boolean
  duration: number
  isMuted: boolean

  // UI state
  isVisible: boolean
  isSplitScreen: boolean

  // Seek request (for external components to request seek)
}

const initialState: VideoState = {
  source: { type: null },
  isLoaded: false,
  duration: 0,
  isMuted: false,
  isVisible: false,
  isSplitScreen: false,
}

const VideoStore = writable<VideoState>(initialState)

// Action functions
export function loadVideo(source: VideoSource): void {
  VideoStore.update((state) => ({
    ...state,
    source,
    isLoaded: false,
    duration: 0,
    isVisible: false,
  }))
}

export function setLoaded(duration: number): void {
  VideoStore.update((state) => ({
    ...state,
    isLoaded: true,
    duration,
  }))
}

function showVideo(): void {
  VideoStore.update((state) => ({
    ...state,
    isVisible: true,
  }))
}

function hideVideo(): void {
  VideoStore.update((state) => ({
    ...state,
    isVisible: false,
    isSplitScreen: false, // Exit split-screen when hiding video
  }))
}

export function toggleVisibility(): void {
  const state = get(VideoStore)
  if (!state.isLoaded) return
  if (state.isVisible) {
    hideVideo()
  } else {
    showVideo()
  }
}

function setMuted(muted: boolean): void {
  VideoStore.update((state) => ({
    ...state,
    isMuted: muted,
  }))
}

export function toggleMute(): void {
  const state = get(VideoStore)
  setMuted(!state.isMuted)
}

export function toggleSplitScreen(): void {
  VideoStore.update((state) => {
    const newSplitScreen = !state.isSplitScreen
    return {
      ...state,
      isSplitScreen: newSplitScreen,
      // When entering split-screen, ensure video is visible
      isVisible: newSplitScreen ? true : state.isVisible,
    }
  })
}

export function reset(): void {
  VideoStore.set(initialState)
}

export function hasVideoSource(): boolean {
  const state = get(VideoStore)
  return state.source.type !== null
}

export default VideoStore
