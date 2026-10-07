import { writable } from 'svelte/store'

export interface ConfigStoreState {
  isPathColorMode: boolean
  dataHasCodes: boolean
  circleToggle: boolean
  sliceToggle: boolean
  movementToggle: boolean
  stopsToggle: boolean
  highlightToggle: boolean
  maxStopLength: number
  maxTurnLength: number
  /**
   * Seconds a subject must stay put before it counts as a stop. Drives the
   * stopped/moving split, so it shapes stop circles, the segment partition, and
   * the movement-only / stops-only views.
   */
  stopSliderValue: number
  alignToggle: boolean
  wordToSearch: string
  animationRate: number
  /**
   * How much the drawn path may be simplified, as a screen-pixel error budget:
   * the line never strays further than this from where the subject actually was,
   * so a larger number means a coarser path. Applies at render time only: the
   * imported trail keeps every row, so moving this slider restyles the drawing
   * of a dataset already on screen (see lib/draw/path-lod.ts).
   */
  pathSimplification: number
  conversationRectWidth: number
  movementStrokeWeight: number
  stopStrokeWeight: number
  selectorSize: number // Circle selector size
  slicerSize: number // Slice selector width
  clusterTimeThreshold: number // seconds - time gap to start new cluster
  clusterSpaceThreshold: number // pixels - distance to start new cluster
  showSpeakerStripes: boolean // Combine speakers into shared conversation clusters with proportional coloring
  preserveFloorplanAspectRatio: boolean // Keep floorplan proportions instead of stretching to fill
  showConversationRects: boolean // Show conversation rectangles on visualization (floor plan and space-time)
  showActivityGradient: boolean // Show movement activity gradient on timeline
}

// Legacy type alias for backwards compatibility
export type ConfigStoreType = ConfigStoreState

export const initialConfig: ConfigStoreState = {
  isPathColorMode: false,
  dataHasCodes: false,
  circleToggle: false,
  sliceToggle: false,
  movementToggle: false,
  stopsToggle: false,
  highlightToggle: false,
  maxStopLength: 0,
  maxTurnLength: 10,
  stopSliderValue: 1,
  alignToggle: true,
  wordToSearch: '',
  animationRate: 0.05,
  pathSimplification: 1,
  conversationRectWidth: 5,
  movementStrokeWeight: 1,
  stopStrokeWeight: 9,
  selectorSize: 100,
  slicerSize: 25,
  clusterTimeThreshold: 10,
  clusterSpaceThreshold: 50,
  showSpeakerStripes: true,
  preserveFloorplanAspectRatio: false,
  showConversationRects: false,
  showActivityGradient: false,
}

const ConfigStore = writable<ConfigStoreState>(initialConfig)

export default ConfigStore
