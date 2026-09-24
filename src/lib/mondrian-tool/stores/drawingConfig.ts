import { writable, get } from 'svelte/store'

export type RotationAngle = 0 | 90 | 180 | 270

interface DrawingConfig {
  strokeWeight: number
  strokeColor: string
  splitPosition: number // percentage (0-100)
  pollingRate: number // milliseconds - sampling interval when moving (or fixed interval if adaptive is off)
  heartbeatInterval: number // milliseconds - sampling interval when stationary (adaptive mode only)
  useAdaptiveSampling: boolean // true = adaptive/heartbeat, false = fixed interval
  isTranscriptionMode: boolean
  speculateScale: number // optional scale for speculate mode
  isContinuousMode: boolean
  jumpSeconds: number // transcription mode: fast forward/rewind duration in seconds (5-60)
  jumpSteps: number // speculate mode: undo steps (5-50)
  floorPlanRotation: RotationAngle // rotation angle for floor plan display (0, 90, 180, 270)
}

const defaultConfig: DrawingConfig = {
  strokeWeight: 5,
  strokeColor: '#000000',
  splitPosition: 50,
  pollingRate: 4,
  heartbeatInterval: 500, // 500ms heartbeat when stationary
  useAdaptiveSampling: true, // default to adaptive sampling
  isTranscriptionMode: true,
  speculateScale: 1,
  isContinuousMode: true,
  jumpSeconds: 5,
  jumpSteps: 10,
  floorPlanRotation: 0,
}

export const drawingConfig = writable<DrawingConfig>(defaultConfig)

export const updateStrokeWeight = (weight: number) => {
  drawingConfig.update((config) => ({ ...config, strokeWeight: weight }))
}

export const updateStrokeColor = (color: string) => {
  drawingConfig.update((config) => ({ ...config, strokeColor: color }))
}

export const updateSplitPosition = (position: number) => {
  drawingConfig.update((config) => ({ ...config, splitPosition: position }))
}

export const updatePollingRate = (rate: number) => {
  drawingConfig.update((config) => ({ ...config, pollingRate: rate }))
}

export function getSplitPositionForMode() {
  const { isTranscriptionMode, splitPosition } = get(drawingConfig)
  return isTranscriptionMode ? splitPosition : 0
}

const ROTATION_ANGLES: RotationAngle[] = [0, 90, 180, 270]

export function rotateFloorPlan(direction: 'cw' | 'ccw') {
  drawingConfig.update((config) => {
    const currentIndex = ROTATION_ANGLES.indexOf(config.floorPlanRotation)
    const newIndex =
      direction === 'cw'
        ? (currentIndex + 1) % 4
        : (currentIndex - 1 + 4) % 4
    return { ...config, floorPlanRotation: ROTATION_ANGLES[newIndex] }
  })
}
