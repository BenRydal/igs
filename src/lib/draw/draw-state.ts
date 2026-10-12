import ConfigStore, { initialConfig, type ConfigStoreType } from '../../stores/configStore'
import VideoStore from '../../stores/videoStore'
import PlaybackStore, { type PlaybackMode } from '../../stores/playbackStore'
import CodeStore, { type CodeStoreState } from '../../stores/codeStore'

/**
 * Single store-subscription point for the imperative draw layer.
 *
 * p5's draw loop can't consume Svelte reactivity directly, so the draw classes
 * read plain mutable state each frame. This module owns those subscriptions, so
 * individual draw files do not each keep their own. Values are current as of the
 * last store emission — read them per frame, never cache across frames.
 *
 * The point of the mirror is that these fields are read once per data point,
 * per view, per frame. A `get(store)` in that position allocates and runs a
 * subscriber every time; a property read does not. Anything reached from the
 * per-point path belongs here rather than behind a `get()`.
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
  /** Live mirror of CodeStore (code colours and per-code visibility) */
  codes: [] as CodeStoreState,
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

CodeStore.subscribe((codes) => {
  drawState.codes = codes
})
