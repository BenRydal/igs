import ConfigStore, { initialConfig, type ConfigStoreType } from '../../stores/configStore'
import VideoStore from '../../stores/videoStore'
import PlaybackStore, { type PlaybackMode } from '../../stores/playbackStore'

/**
 * Single store-subscription point for the imperative draw layer.
 *
 * p5's draw loop can't consume Svelte reactivity directly, so the draw
 * classes read plain mutable state each frame. Previously every draw file
 * kept its own module-scope subscribe block mirroring the same stores;
 * this module owns those subscriptions once. Values are current as of the
 * last store emission — read them per frame, never cache across frames.
 */
export const drawState = {
  /** Live mirror of ConfigStore (toggles, stroke weights, thresholds) */
  config: initialConfig as ConfigStoreType,
  /** Current video playback position in seconds */
  videoCurrentTime: 0,
  /** Current playback mode ('stopped' | 'playing-video' | 'playing-animation') */
  playbackMode: 'stopped' as PlaybackMode,
  /** Case-insensitive matcher for the conversation search term, or null */
  searchRegex: null as RegExp | null,
}

ConfigStore.subscribe((config) => {
  drawState.config = config
  drawState.searchRegex = config.wordToSearch
    ? new RegExp(config.wordToSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    : null
})

VideoStore.subscribe((video) => {
  drawState.videoCurrentTime = video.currentTime
})

PlaybackStore.subscribe((playback) => {
  drawState.playbackMode = playback.mode
})
