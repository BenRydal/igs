import { writable, get } from 'svelte/store'
import type p5 from 'p5'
import type { Point } from '../p5/types/sketch'
import { drawingConfig } from '../stores/drawingConfig'
import { indexSampler } from '../p5/features/drawing'

export interface PathData {
  points: Point[]
  color: string
  pathId: number
  name?: string
  visible?: boolean
}

export interface DrawingState {
  isVideoPlaying: boolean
  isDrawing: boolean
  shouldTrackMouse: boolean
  paths: PathData[]
  imageWidth: number
  imageHeight: number
  videoTime: number
  imageElement: p5.Image | null
  currentPathId: number
  isJumping: boolean
}

const initialState: DrawingState = {
  isVideoPlaying: false,
  isDrawing: false,
  shouldTrackMouse: false,
  paths: [],
  imageWidth: 0,
  imageHeight: 0,
  videoTime: 0,
  imageElement: null,
  currentPathId: 0,
  isJumping: false,
}

function clearJumpingOnSeek(videoElement: HTMLVideoElement) {
  const onSeeked = () => {
    videoElement.removeEventListener('seeked', onSeeked)
    drawingState.update((state) => ({ ...state, isJumping: false }))
  }
  videoElement.addEventListener('seeked', onSeeked)
}

export function handleRewindSpeculateMode() {
  drawingState.update((state) => {
    const currentPathIndex = state.paths.findIndex((p) => p.pathId === state.currentPathId)
    if (currentPathIndex === -1) return state

    const { jumpSteps } = get(drawingConfig)
    const updatedPaths = [...state.paths]
    const currentPath = updatedPaths[currentPathIndex]

    if (currentPath.points.length === 0) return state

    // Remove last N points directly (works regardless of time units)
    const updatedPoints = currentPath.points.slice(
      0,
      Math.max(0, currentPath.points.length - jumpSteps)
    )
    updatedPaths[currentPathIndex] = { ...currentPath, points: updatedPoints }

    // Reset index sampler with the new point count (not time!)
    indexSampler.reset(updatedPoints.length)

    return { ...state, shouldTrackMouse: false, isDrawing: false, paths: updatedPaths }
  })
}

export function handleForwardSpeculateMode() {
  drawingState.update((state) => {
    const currentPathIndex = state.paths.findIndex((p) => p.pathId === state.currentPathId)
    if (currentPathIndex === -1) return state

    const { jumpSteps, useAdaptiveSampling, heartbeatInterval } = get(drawingConfig)
    const updatedPaths = [...state.paths]
    const currentPath = updatedPaths[currentPathIndex]

    const lastPoint = currentPath.points[currentPath.points.length - 1]
    if (!lastPoint) return state

    // Time increment depends on sampling mode:
    // - Adaptive: heartbeat interval (seconds) for stationary pause simulation
    // - Index-based: step value (which equals pollingRate)
    const timeStep = useAdaptiveSampling ? heartbeatInterval / 1000 : indexSampler.getStep()

    // Add stationary points at the last position (simulating a pause/stop)
    const updatedPoints = [...currentPath.points]
    for (let i = 1; i <= jumpSteps; i++) {
      updatedPoints.push({
        x: lastPoint.x,
        y: lastPoint.y,
        time: lastPoint.time + i * timeStep,
        pathId: state.currentPathId,
      })
    }
    updatedPaths[currentPathIndex] = { ...currentPath, points: updatedPoints }

    // Reset index sampler with the new point count
    indexSampler.reset(updatedPoints.length)

    return { ...state, paths: updatedPaths }
  })
}

export function handleForwardTranscription(videoElement: HTMLVideoElement) {
  drawingState.update((state) => {
    if (state.isJumping) return state
    if (!videoElement.duration || isNaN(videoElement.duration)) return state

    const { jumpSeconds, useAdaptiveSampling, heartbeatInterval, pollingRate } = get(drawingConfig)
    const currentTime = state.videoTime
    const currentPathIndex = state.paths.findIndex((p) => p.pathId === state.currentPathId)
    if (currentPathIndex === -1) return state

    const updatedPaths = [...state.paths]
    const currentPath = updatedPaths[currentPathIndex]
    const lastPoint = currentPath.points[currentPath.points.length - 1]
    if (!lastPoint) return state

    const newTime = Math.min(currentTime + jumpSeconds, videoElement.duration)
    videoElement.currentTime = newTime

    // Use heartbeat interval when adaptive sampling is on (fewer points for stationary periods)
    const samplingRate = useAdaptiveSampling ? heartbeatInterval / 1000 : pollingRate / 1000
    const updatedPoints = [...currentPath.points]

    // Use multiplication to avoid floating point accumulation drift
    const timeDelta = newTime - currentTime
    const numPoints = Math.floor(timeDelta / samplingRate)
    for (let i = 1; i <= numPoints; i++) {
      const t = currentTime + i * samplingRate
      updatedPoints.push({ x: lastPoint.x, y: lastPoint.y, time: t, pathId: state.currentPathId })
    }

    updatedPaths[currentPathIndex] = { ...currentPath, points: updatedPoints }

    return { ...state, isJumping: true, videoTime: newTime, paths: updatedPaths }
  })

  clearJumpingOnSeek(videoElement)
}

export function handleRewindTranscription(videoElement: HTMLVideoElement) {
  drawingState.update((state) => {
    if (state.isJumping) return state
    if (!videoElement.duration || isNaN(videoElement.duration)) return state

    const { jumpSeconds } = get(drawingConfig)
    const currentTime = state.videoTime
    const currentPathIndex = state.paths.findIndex((p) => p.pathId === state.currentPathId)
    if (currentPathIndex === -1) return state

    const newTime = Math.max(currentTime - jumpSeconds, 0)
    videoElement.currentTime = newTime
    videoElement.pause()

    const updatedPaths = [...state.paths]
    const currentPath = updatedPaths[currentPathIndex]
    const updatedPoints = currentPath.points.filter((point) => point.time <= newTime)
    updatedPaths[currentPathIndex] = { ...currentPath, points: updatedPoints }

    return {
      ...state,
      isJumping: true,
      shouldTrackMouse: false,
      isDrawing: false,
      isVideoPlaying: false,
      videoTime: newTime,
      paths: updatedPaths,
    }
  })

  clearJumpingOnSeek(videoElement)
}

export const drawingState = writable<DrawingState>(initialState)

export function toggleDrawing(videoElement?: HTMLVideoElement) {
  drawingState.update((state) => {
    const newShouldTrack = !state.shouldTrackMouse

    if (videoElement) {
      try {
        if (newShouldTrack) {
          const playPromise = videoElement.play()
          if (playPromise !== undefined) {
            playPromise.catch((error) => {
              console.error('Error playing video:', error)
              drawingState.update((s) => ({
                ...s,
                shouldTrackMouse: false,
                isDrawing: false,
                isVideoPlaying: false,
              }))
            })
          }
        } else {
          videoElement.pause()
        }
      } catch (error) {
        console.error('Error handling video:', error)
        return {
          ...state,
          shouldTrackMouse: false,
          isDrawing: false,
          isVideoPlaying: false,
        }
      }
    }

    return {
      ...state,
      shouldTrackMouse: newShouldTrack,
      isDrawing: newShouldTrack,
      isVideoPlaying: newShouldTrack,
    }
  })
}

export function toggleDrawingNoVideo() {
  drawingState.update((state) => {
    const newShouldTrack = !state.shouldTrackMouse
    return {
      ...state,
      shouldTrackMouse: newShouldTrack,
      isDrawing: newShouldTrack,
    }
  })
}

export function createNewPath(color: string) {
  console.log('Creating new path with color', color)
  drawingState.update((state) => {
    const newPathId = state.currentPathId + 1
    return {
      ...state,
      currentPathId: newPathId,
      paths: [
        ...state.paths,
        {
          points: [],
          color,
          pathId: newPathId,
        },
      ],
    }
  })
}

export function addPointToCurrentPath(point: Point) {
  drawingState.update((state) => {
    if (!state.shouldTrackMouse) return state

    const currentPathIndex = state.paths.findIndex((p) => p.pathId === state.currentPathId)
    if (currentPathIndex === -1) return state

    const updatedPaths = [...state.paths]
    updatedPaths[currentPathIndex] = {
      ...updatedPaths[currentPathIndex],
      points: [...updatedPaths[currentPathIndex].points, point],
    }

    return {
      ...state,
      paths: updatedPaths,
    }
  })
}

export function renamePathById(pathId: number, name: string) {
  drawingState.update((state) => {
    const pathIndex = state.paths.findIndex((p) => p.pathId === pathId)
    if (pathIndex === -1) return state

    const updatedPaths = [...state.paths]
    updatedPaths[pathIndex] = {
      ...updatedPaths[pathIndex],
      name: name.trim() || undefined,
    }

    return {
      ...state,
      paths: updatedPaths,
    }
  })
}

export function deletePathById(pathId: number) {
  drawingState.update((state) => {
    const updatedPaths = state.paths.filter((p) => p.pathId !== pathId)

    // If no paths remain, create a new empty path (consistent with Clear All behavior)
    const newPaths =
      updatedPaths.length === 0 ? [{ points: [], color: '#FF0000', pathId: 1 }] : updatedPaths

    const newCurrentPathId =
      updatedPaths.length === 0
        ? 1
        : state.currentPathId === pathId
          ? (updatedPaths.at(-1)?.pathId ?? 0)
          : state.currentPathId

    return {
      ...state,
      paths: newPaths,
      currentPathId: newCurrentPathId,
      shouldTrackMouse: false,
      isDrawing: false,
      isVideoPlaying: false,
    }
  })
}

export function togglePathVisibility(pathId: number) {
  drawingState.update((state) => {
    const pathIndex = state.paths.findIndex((p) => p.pathId === pathId)
    if (pathIndex === -1) return state

    const updatedPaths = [...state.paths]
    updatedPaths[pathIndex] = {
      ...updatedPaths[pathIndex],
      visible: updatedPaths[pathIndex].visible === false,
    }

    return {
      ...state,
      paths: updatedPaths,
    }
  })
}

export function updatePathColor(pathId: number, color: string) {
  drawingState.update((state) => {
    const pathIndex = state.paths.findIndex((p) => p.pathId === pathId)
    if (pathIndex === -1) return state

    const updatedPaths = [...state.paths]
    updatedPaths[pathIndex] = {
      ...updatedPaths[pathIndex],
      color,
    }

    return {
      ...state,
      paths: updatedPaths,
    }
  })
}
