import { writable } from 'svelte/store'

export type ViewMode = '3d' | '2d' | 'map'

export interface ConfigStoreState {
  advancedMode: boolean
  isPathColorMode: boolean
  dataHasCodes: boolean
  viewMode: ViewMode
  circleToggle: boolean
  sliceToggle: boolean
  movementToggle: boolean
  stopsToggle: boolean
  highlightToggle: boolean
  maxStopLength: number
  maxTurnLength: number
  stopSliderValue: number
  alignToggle: boolean
  wordToSearch: string
  animationRate: number
  samplingInterval: number
  smallDataThreshold: number
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
  advancedMode: false,
  isPathColorMode: false,
  dataHasCodes: false,
  viewMode: '3d',
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
  samplingInterval: 0.5,
  smallDataThreshold: 3000,
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
