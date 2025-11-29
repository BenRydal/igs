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
  stopSliderValue: number
  alignToggle: boolean
  wordToSearch: string
  animationRate: number
  samplingInterval: number
  smallDataThreshold: number
  conversationRectWidth: number
  movementStrokeWeight: number
  stopStrokeWeight: number
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
  samplingInterval: 0.5,
  smallDataThreshold: 3000,
  conversationRectWidth: 5,
  movementStrokeWeight: 1,
  stopStrokeWeight: 9,
}

const ConfigStore = writable<ConfigStoreState>(initialConfig)

export default ConfigStore
