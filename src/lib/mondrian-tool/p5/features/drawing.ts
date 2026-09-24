import type p5 from 'p5'
import type { Point } from '../types/sketch'
import { get } from 'svelte/store'
import {
  drawingState,
  addPointToCurrentPath,
  toggleDrawing,
  toggleDrawingNoVideo,
  type PathData,
} from '../../stores/drawingState'
import { drawingConfig, getSplitPositionForMode } from '../../stores/drawingConfig'
import {
  isInDrawableArea,
  convertToImageCoordinates,
  getFittedImageDisplayRect,
  applyForwardRotation,
} from '../../utils/drawingUtils'
import { TimeBasedSampler, AdaptiveSampler, IndexBasedSampler } from './samplers'

const initialConfig = get(drawingConfig)

// Fixed-interval sampler (original behavior for transcription mode)
export const timeSampler = new TimeBasedSampler(initialConfig.pollingRate / 1000)

// Adaptive sampler with heartbeat (used for both modes when adaptive is ON)
export const adaptiveSampler = new AdaptiveSampler(
  initialConfig.pollingRate / 1000, // activeInterval (fast sampling when moving)
  initialConfig.heartbeatInterval / 1000, // heartbeatInterval (slow sampling when stationary)
  2 // minMovement in pixels
)

// Fixed index-based sampler (original behavior for speculate mode)
export const indexSampler = new IndexBasedSampler(initialConfig.pollingRate)

/** Reset all samplers to initial state. Call when starting a new recording session. */
export function resetAllSamplers() {
  timeSampler.reset()
  adaptiveSampler.reset()
  indexSampler.reset()
}

export function setupDrawing(p5: p5) {
  drawingConfig.subscribe((config) => {
    timeSampler.setInterval(config.pollingRate / 1000)
    adaptiveSampler.setActiveInterval(config.pollingRate / 1000)
    adaptiveSampler.setHeartbeatInterval(config.heartbeatInterval / 1000)
    indexSampler.setStep(config.pollingRate)
  })

  const addCurrentPoint = () => {
    const state = get(drawingState)
    const config = get(drawingConfig)
    if (!state.shouldTrackMouse || !isInDrawableArea(p5, p5.mouseX, p5.mouseY)) return

    const curPath = state.paths.find((p) => p.pathId === state.currentPathId)
    if (!curPath) return

    const coords = convertToImageCoordinates(p5, p5.mouseX, p5.mouseY)

    let time = 0
    let shouldAdd = false

    if (config.isTranscriptionMode) {
      time = state.videoTime
      if (config.useAdaptiveSampling) {
        // Adaptive sampling: fast when moving, heartbeat when stationary
        const result = adaptiveSampler.shouldSample(time, coords)
        shouldAdd = result.shouldAdd
      } else {
        // Fixed interval sampling (original behavior)
        shouldAdd = timeSampler.shouldSample(time)
      }
    } else {
      // Speculate mode
      if (config.useAdaptiveSampling) {
        // Adaptive sampling: use wall-clock for movement detection,
        // but store incremental time from last point to avoid jumps
        const wallTime = performance.now() / 1000
        const result = adaptiveSampler.shouldSample(wallTime, coords)
        shouldAdd = result.shouldAdd

        if (shouldAdd) {
          const lastPoint = curPath.points.at(-1)
          // First point starts at 0, subsequent points increment by the actual interval used
          time = lastPoint ? lastPoint.time + result.timeIncrement : 0
        }
      } else {
        // Fixed index-based sampling (original behavior)
        shouldAdd = indexSampler.shouldSample()
        time = indexSampler.getPseudoTime()
      }
    }

    if (!shouldAdd) return

    const point: Point = {
      ...coords,
      time,
      pathId: state.currentPathId,
    }

    addPointToCurrentPath(point)
  }

  const handleMousePressedVideo = (videoElement?: HTMLVideoElement) => {
    if (isInDrawableArea(p5, p5.mouseX, p5.mouseY)) {
      const state = get(drawingState)

      if (videoElement && videoElement.currentTime >= videoElement.duration - 0.1) {
        return
      }
      if (!state.shouldTrackMouse) {
        resetAllSamplers()
      }
      toggleDrawing(videoElement)
    }
  }

  const handleMousePressedSpeculateMode = () => {
    if (isInDrawableArea(p5, p5.mouseX, p5.mouseY)) {
      const state = get(drawingState)
      if (!state.shouldTrackMouse) {
        // Reset time-based samplers (for fresh movement detection)
        timeSampler.reset()
        adaptiveSampler.reset()
        // Sync index sampler to current path's point count (preserves state after rewind/forward)
        const curPath = state.paths.find((p) => p.pathId === state.currentPathId)
        indexSampler.reset(curPath?.points.length ?? 0)
      }
      toggleDrawingNoVideo()
    }
  }

  return {
    handleMousePressedVideo,
    handleMousePressedSpeculateMode,
    addCurrentPoint,
  }
}

export function drawPaths(p5: p5) {
  const state = get(drawingState)
  const config = get(drawingConfig)

  const { imageWidth: imgW, imageHeight: imgH } = state
  if (!imgW || !imgH) return

  const rotation = config.floorPlanRotation
  const rect = getFittedImageDisplayRect(p5, getSplitPositionForMode(), imgW, imgH, rotation)

  // Convert stored original image coords to rotated display coords
  const toDisplay = (pt: { x: number; y: number }) => {
    const { nx, ny } = applyForwardRotation(pt.x, pt.y, imgW, imgH, rotation)
    return {
      x: rect.x + nx * rect.w,
      y: rect.y + ny * rect.h,
    }
  }

  p5.push()

  // Draw all path lines
  state.paths.forEach((path) => {
    drawPathLine(p5, path, toDisplay, config.strokeWeight, config.isContinuousMode)
  })

  // Draw pulsing endpoints
  const activePath = state.paths.find((p) => p.pathId === state.currentPathId)
  const currentEndpoint = activePath?.points.at(-1) ?? null

  state.paths.forEach((path) => {
    if (path.visible === false || path.points.length === 0) return

    const endpoint =
      path.pathId === state.currentPathId
        ? currentEndpoint!
        : findSyncedEndpoint(path, activePath, currentEndpoint, config.isTranscriptionMode)

    const { x, y } = toDisplay(endpoint)
    drawPulsingMarker(p5, x, y, path.color, state.isDrawing ? p5.frameCount : 0)
  })

  p5.pop()
}

/** Draw a single path as a continuous line or discrete points */
function drawPathLine(
  p5: p5,
  path: PathData,
  toDisplay: (pt: { x: number; y: number }) => { x: number; y: number },
  strokeWeight: number,
  isContinuousMode: boolean
) {
  if (path.visible === false) return

  p5.strokeWeight(strokeWeight)
  p5.stroke(path.color)
  p5.noFill()

  if (isContinuousMode) {
    if (path.points.length > 1) {
      p5.beginShape()
      path.points.forEach((pt) => p5.vertex(...(Object.values(toDisplay(pt)) as [number, number])))
      p5.endShape()
    } else if (path.points.length === 1) {
      const { x, y } = toDisplay(path.points[0])
      p5.point(x, y)
    }
  } else {
    path.points.forEach((pt) => {
      const { x, y } = toDisplay(pt)
      p5.circle(x, y, strokeWeight)
    })
  }
}

/** Find the synced endpoint for a path based on the current active path's position */
function findSyncedEndpoint(
  path: PathData,
  activePath: PathData | undefined,
  currentEndpoint: Point | null,
  isTranscriptionMode: boolean
): Point {
  if (!currentEndpoint || !activePath) {
    return path.points[0]
  }

  if (isTranscriptionMode) {
    // Transcription mode: find closest point in time (all paths share video time)
    return path.points.reduce((closest, pt) => {
      const prevDiff = Math.abs(closest.time - currentEndpoint.time)
      const currDiff = Math.abs(pt.time - currentEndpoint.time)
      return currDiff < prevDiff ? pt : closest
    }, path.points[0])
  } else {
    // Speculate mode: sync by point index. Synthetic time values differ across paths
    // (heartbeat vs active sampling rates), making elapsed-time comparison unreliable.
    const activeIndex = activePath.points.length - 1
    const targetIndex = Math.min(activeIndex, path.points.length - 1)
    return path.points[targetIndex]
  }
}

/** Draw a pulsing marker at the given position */
function drawPulsingMarker(
  p5: p5,
  x: number,
  y: number,
  color: string,
  frameCount: number,
  markerSize: number = 15
) {
  const pulseScale = (Math.sin(frameCount * 0.05) + 1) * 0.25 + 0.5

  p5.noStroke()
  const c = p5.color(color)
  c.setAlpha(50)
  p5.fill(c)

  // Draw expanding rings
  for (let i = 4; i > 0; i--) {
    const size = markerSize * (1.5 + i * 0.5) * pulseScale
    p5.circle(x, y, size)
  }

  // Draw center dot
  p5.circle(x, y, markerSize * pulseScale)
  p5.fill(255)
  p5.circle(x, y, markerSize * 0.5 * pulseScale)
}
