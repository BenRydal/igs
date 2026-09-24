import type p5 from 'p5'
import { drawingState } from '../../stores/drawingState'
import { get } from 'svelte/store'
import { drawingConfig } from '../../stores/drawingConfig'

export function setupVideo(p5: p5) {
  const setVideo = (video: HTMLVideoElement) => {
    const p5Vid = p5.createVideo([video.src])
    const videoElt = p5Vid.elt as HTMLVideoElement

    // Ensure all properties are set correctly
    videoElt.loop = false
    videoElt.currentTime = 0

    // Make sure metadata is loaded to get duration correctly
    videoElt.addEventListener('loadedmetadata', () => {
      // Reset the video time in drawingState to ensure timeline updates
      drawingState.update((state) => ({
        ...state,
        videoTime: 0,
      }))
    })

    // Force load to trigger proper timeline setup
    videoElt.load()

    // Set a small initial time to show the first frame
    setTimeout(() => {
      try {
        videoElt.currentTime = 0.1
      } catch (e) {
        console.warn('Could not set initial currentTime', e)
      }
    }, 50)

    p5Vid.elt.addEventListener('loadeddata', () => {
      if (typeof p5.draw === 'function') {
        p5.redraw()
      }

      let frameCount = 0
      const tempDraw = () => {
        frameCount++
        p5.redraw()
        if (frameCount < 3) {
          requestAnimationFrame(tempDraw)
        }
      }
      requestAnimationFrame(tempDraw)
    })

    p5Vid.hide()

    p5Vid.elt.onplay = () => drawingState.update((state) => ({ ...state, isVideoPlaying: true }))

    p5Vid.elt.onpause = () =>
      drawingState.update((state) => ({
        ...state,
        isVideoPlaying: false,
        shouldTrackMouse: false,
        isDrawing: false,
      }))

    p5Vid.elt.onended = () =>
      drawingState.update((state) => ({
        ...state,
        isVideoPlaying: false,
        shouldTrackMouse: false,
        isDrawing: false,
      }))

    return p5Vid
  }

  const updateVideoTime = (videoElement: p5.Element, lastVideoTime: number) => {
    if (videoElement) {
      const currentTime = (videoElement as any).elt.currentTime
      if (currentTime !== lastVideoTime) {
        drawingState.update((state) => ({ ...state, videoTime: currentTime }))
        return currentTime
      }
    }
    return lastVideoTime
  }

  const drawVideo = (p5: p5, videoElement: p5.Element) => {
    const config = get(drawingConfig)
    const splitX = (p5.width * config.splitPosition) / 100
    const aspectRatio = videoElement.elt.videoWidth / videoElement.elt.videoHeight
    const displayHeight = Math.min(p5.height, splitX / aspectRatio)
    const yOffset = (p5.height - displayHeight) / 2

    p5.image(videoElement, 0, yOffset, splitX, displayHeight)
  }

  const checkVideoEnd = (videoElement: p5.Element) => {
    if (videoElement && (videoElement as any).elt) {
      const video = (videoElement as any).elt
      if (video.currentTime >= video.duration - 0.1) {
        video.pause()
        video.currentTime = video.duration

        drawingState.update((state) => ({
          ...state,
          isVideoPlaying: false,
          shouldTrackMouse: false,
          isDrawing: false,
        }))
      }
    }
  }

  return {
    setVideo,
    updateVideoTime,
    drawVideo,
    checkVideoEnd,
  }
}
