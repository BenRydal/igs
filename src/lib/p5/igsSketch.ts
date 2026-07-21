import { get } from 'svelte/store'
import { hitTest, type SketchFn } from 'svelte-p5'
import P5Store from '../../stores/p5Store'
import UserStore from '../../stores/userStore'
import { timelineV2Store } from '../timeline/store'
import ConfigStore from '../../stores/configStore'
import VideoStore from '../../stores/videoStore'
import PlaybackStore, { onAnimationEnd, type PlaybackMode } from '../../stores/playbackStore'
import { isAnyModalOpen } from '../../stores/modalStore'
import { toastStore } from '../../stores/toastStore'
import type { User } from '../../models/user'
import { FloorPlan, SketchGUI, Handle3D, SetPathData } from '..'
import { generateCodeCSV, downloadFile } from '../utils/download'
import type { IgsSketchExt } from './igs-p5'

let users: User[] = []
let highlightToggle: boolean
let animationRate = 0.05
let playbackMode: PlaybackMode = 'stopped'
let isModalOpen = false

ConfigStore.subscribe((data) => {
  highlightToggle = data.highlightToggle
  animationRate = data.animationRate
})

UserStore.subscribe((data) => {
  users = data
})

PlaybackStore.subscribe((data) => {
  playbackMode = data.mode
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

  p5.setup = () => {
    const { width, height } = p5.getContainerSize()
    p5.createCanvas(width, height, p5.WEBGL)
    p5.gui = new SketchGUI(p5)
    p5.handle3D = new Handle3D(p5, true)
    p5.floorPlan = new FloorPlan(p5)

    // Constants
    p5.PLAN = 0
    p5.SPACETIME = 1
    applyStyles()
  }

  p5.draw = () => {
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
    if (playbackMode !== 'stopped') {
      p5.updateAnimation()
    }

    // Determine whether to re-run draw loop
    if (playbackMode !== 'stopped' || p5.handle3D.getIsTransitioning() || highlightToggle) {
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

  p5.windowResized = () => {
    const { width, height } = p5.getContainerSize()
    p5.resizeCanvas(width, height)
    p5.gui = new SketchGUI(p5)
    p5.handle3D = new Handle3D(p5, p5.handle3D.getIs3DMode())
    applyStyles()
    p5.loop()
  }

  /**
   * Recreate the canvas to reset WebGL state
   * This helps with Safari performance issues after loading large datasets
   *
   * Raw-p5 escape hatch: replaced by svelte-p5's `{#key}` remount +
   * WEBGL_lose_context recipe in the layout-chrome phase of the migration.
   */
  p5.recreateCanvas = () => {
    const { width, height } = p5.getContainerSize()
    p5.createCanvas(width, height, p5.WEBGL)
    p5.gui = new SketchGUI(p5)
    p5.handle3D = new Handle3D(p5, true)
    p5.floorPlan = new FloorPlan(p5)
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
    if (highlightToggle && !p5.handle3D.getIs3DModeOrTransitioning())
      p5.gui.highlight.handleMousePressed()
    p5.loop()
  }

  p5.mouseReleased = () => {
    if (highlightToggle && !p5.handle3D.getIs3DModeOrTransitioning())
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

    if (playbackMode === 'playing-video') {
      // Video is driving - use video's current time
      timeToSet = get(VideoStore).currentTime
    } else {
      // Animation is driving - use frame-based increment
      timeToSet = state.currentTime + animationRate
    }

    timelineV2Store.setCurrentTime(timeToSet)
  }

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
    else return timelineV2Store.viewPixelToPixel(value)
  }
}
