import { writable } from 'svelte/store'

export interface VideoStoreState {
  isShowing: boolean
  isPlaying: boolean
}

const VideoStore = writable<VideoStoreState>({
  isShowing: false,
  isPlaying: false,
})

export default VideoStore
