import { get } from 'svelte/store'
import { hitTest, type SketchFn } from 'svelte-p5'
import P5Store from '../../stores/p5Store'
import UserStore from '../../stores/userStore'
import { timelineV2Store } from '../timeline/store'
import VideoStore from '../../stores/videoStore'
import { onAnimationEnd } from '../../stores/playbackStore'
import { isAnyModalOpen } from '../../stores/modalStore'
import { toastStore } from '../../stores/toastStore'
import type { User } from '../../models/user'
import { FloorPlan, SketchGUI, Handle3D, SetPathData } from '..'
import { drawState } from '../draw/draw-state'
import { generateCodeCSV, downloadFile } from '../utils/download'
import type { IgsSketchExt } from './igs-p5'

let users: User[] = []
let isModalOpen = false

UserStore.subscribe((data) => {
  users = data
})

isAnyModalOpen.subscribe((data) => {
  isModalOpen = data
})

export const igsSketch: SketchFn<IgsSketchExt> = (p5) => {
  P5Store.set(p5)

  p5.getContainerSize = () => {
    const container = document.getElementById('p5-canvas-container')
    if (container) {
      const rect = container.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        return { width: Math.floor(rect.width), height: Math.floor(rect.height) }
      }
    }
    // Fallback for calls before layout settles: replicate the historical
    // window-minus-chrome measurement.
    const navbarHeight =
      (document.querySelector('.navbar') as HTMLElement | null)?.offsetHeight ?? 0
    const bottomNavHeight =
      (document.querySelector('.btm-nav') as HTMLElement | null)?.offsetHeight ?? 0
    return { width: window.innerWidth, height: window.innerHeight - navbarHeight - bottomNavHeight }
  }

  const applyStyles = () => {
    p5.smooth()
    p5.strokeCap(p5.SQUARE)
  }

  p5.canvasLeft = 0
  p5.updateCanvasOffset = () => {
    const container = document.getElementById('p5-canvas-container')
    if (container) p5.canvasLeft = container.getBoundingClientRect().left
  }

  p5.setup = () => {
    const { width, height } = p5.getContainerSize()
    p5.createCanvas(width, height, p5.WEBGL)
    p5.updateCanvasOffset()
    p5.gui = new SketchGUI(p5)
    p5.handle3D = new Handle3D(p5, true)
    p5.floorPlan = new FloorPlan(p5)

    // Constants
    p5.PLAN = 0
    p5.SPACETIME = 1
    applyStyles()
  }

  p5.draw = () => {
    p5.updateCanvasOffset() // one rect read per frame; keeps viewport→canvas mapping current
    p5.background(255)
    p5.translate(-p5.width / 2, -p5.height / 2, 0) // recenter canvas to top left when using WEBGL renderer

    if (p5.handle3D.getIs3DModeOrTransitioning()) {
      // Translate/update canvas if in 3D mode
      p5.push()
      p5.handle3D.update3DTranslation()
    }
    p5.visualizeData()
    p5.gui.update3D() // draw canvas GUI elements that adapt to 3D mode

    if (p5.handle3D.getIs3DModeOrTransitioning()) p5.pop()
    p5.gui.update2D() // draw all other canvas GUI elements in 2D mode

    // Update animation if playing
    if (drawState.playbackMode !== 'stopped') {
      p5.updateAnimation()
    }

    // Determine whether to re-run draw loop
    if (
      drawState.playbackMode !== 'stopped' ||
      p5.handle3D.getIsTransitioning() ||
      drawState.config.highlightToggle
    ) {
      p5.loop()
    } else p5.noLoop()
  }

  p5.mouseMoved = () => {
    // Don't trigger expensive redraws when a modal is open
    // This prevents UI freezing during drag-and-drop operations
    if (!isModalOpen) {
      p5.loop()
    }
  }

  p5.dataIsLoaded = (data: unknown) => {
    return data != null // in javascript this tests for both undefined and null values
  }

  p5.visualizeData = () => {
    if (p5.dataIsLoaded(p5.floorPlan.getImg())) {
      const container = p5.gui.fpContainer.getContainer()
      p5.floorPlan.setFloorPlan(container)
      if (p5.arrayIsLoaded(users)) {
        const setPathData = new SetPathData(p5)
        setPathData.setMovementAndConversation(users)
      }
    }
  }

  p5.overRect = (x: number, y: number, boxWidth: number, boxHeight: number) => {
    return hitTest.rect(p5.mouseX, p5.mouseY, x, y, boxWidth, boxHeight)
  }

  p5.overCircle = (x: number, y: number, diameter: number) => {
    return hitTest.circle(p5.mouseX, p5.mouseY, x, y, diameter)
  }

  /**
   * Rebuilds size-dependent sketch state after the canvas has been resized.
   * Deliberately NOT named windowResized: the library <Sketch>'s
   * ResizeObserver is the single resize driver (it calls resizeCanvas and
   * then invokes this via its onResize callback); defining windowResized
   * would add a second, p5-native resize path on window resize events.
   */
  p5.rebuildAfterResize = () => {
    // The ResizeObserver can fire before setup() installs these.
    if (!p5.gui || !p5.handle3D) return
    p5.updateCanvasOffset()
    // highlightArray is the active data filter, so carry it across the rebuild.
    const prevHighlight = p5.gui.highlight.highlightArray
    p5.gui = new SketchGUI(p5)
    p5.gui.highlight.highlightArray = prevHighlight
    p5.handle3D = new Handle3D(p5, p5.handle3D.getIs3DMode())
    applyStyles()
    p5.loop()
  }

  /**
   * Check if mouse is over the timeline interaction area.
   * Uses winMouseX/Y (viewport coordinates) to match timeline bounds.
   */
  p5.isMouseOverTimeline = () => {
    const state = timelineV2Store.getState()
    const inXBounds = p5.winMouseX >= state.leftX && p5.winMouseX <= state.rightX
    if (p5.handle3D.getIs3DMode()) {
      return inXBounds && p5.winMouseY > p5.height
    }
    return inXBounds
  }

  p5.mousePressed = () => {
    if (drawState.config.highlightToggle && !p5.handle3D.getIs3DModeOrTransitioning())
      p5.gui.highlight.handleMousePressed()
    p5.loop()
  }

  p5.mouseReleased = () => {
    if (drawState.config.highlightToggle && !p5.handle3D.getIs3DModeOrTransitioning())
      p5.gui.highlight.handleMouseRelease()
    p5.loop()
  }

  p5.saveCodeFile = () => {
    if (!p5.dataIsLoaded(p5.floorPlan.getImg()) || !p5.arrayIsLoaded(users)) return

    const setPathData = new SetPathData(p5)
    const user = users.find((u) => u.enabled)
    if (!user) {
      toastStore.info('There is no data to include in a code file')
      return
    }

    const [startTimes, endTimes] = setPathData.getCodeFileArrays(user.dataTrail)
    if (startTimes.length === 0) {
      toastStore.info('There is no data to include in a code file')
      return
    }

    downloadFile(generateCodeCSV(startTimes, endTimes), `${user.name}.csv`)
  }

  p5.arrayIsLoaded = (data: unknown) => {
    return Array.isArray(data) && data.length > 0
  }

  p5.updateAnimation = () => {
    const state = timelineV2Store.getState()
    if (state.currentTime < state.viewEnd) {
      p5.continueAnimation()
    } else {
      onAnimationEnd()
    }
  }

  p5.continueAnimation = () => {
    const state = timelineV2Store.getState()
    let timeToSet: number

    if (drawState.playbackMode === 'playing-video') {
      // Video is driving - use video's current time
      timeToSet = get(VideoStore).currentTime
    } else {
      // Animation is driving - use frame-based increment
      timeToSet = state.currentTime + drawState.config.animationRate
    }

    timelineV2Store.setCurrentTime(timeToSet)
  }

  // Both map functions take VIEWPORT pixels (the timeline store's leftX/rightX
  // coordinate space) and return CANVAS coordinates: a canvas x in 2D, or a
  // position along the space-time cube's time axis in 3D. The canvasLeft
  // subtraction is what lets the canvas live anywhere in the layout (split
  // screen, frames) instead of assuming it starts at viewport x = 0.
  p5.mapToSelectTimeThenPixelTime = (value: number) => {
    return p5.mapSelectTimeToPixelTime(timelineV2Store.pixelToViewPixel(value))
  }

  p5.mapSelectTimeToPixelTime = (value: number) => {
    const spaceTimeCubeBottom = p5.height / 10
    const spaceTimeCubeTop = p5.height / 1.6
    if (p5.handle3D.getIs3DMode())
      return p5.map(
        value,
        timelineV2Store.getViewStartPixel(),
        timelineV2Store.getViewEndPixel(),
        spaceTimeCubeBottom,
        spaceTimeCubeTop
      )
    else return timelineV2Store.viewPixelToPixel(value) - p5.canvasLeft
  }
}
