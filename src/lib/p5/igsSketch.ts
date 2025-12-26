import { get } from 'svelte/store'
import P5Store from '../../stores/p5Store'
import UserStore from '../../stores/userStore'
import TimelineStore from '../../stores/timelineStore'
import ConfigStore from '../../stores/configStore'
import VideoStore from '../../stores/videoStore'
import PlaybackStore, { onAnimationEnd, type PlaybackMode } from '../../stores/playbackStore'
import { toastStore } from '../../stores/toastStore'
import type { User } from '../../models/user'
import { FloorPlan, SketchGUI, Handle3D, SetPathData } from '..'
import type { Timeline } from '../../models/timeline'

let users: User[] = []
let timeline: Timeline
let highlightToggle: boolean
let animationRate = 0.05
let playbackMode: PlaybackMode = 'stopped'

TimelineStore.subscribe((data) => {
  timeline = data
})

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

export const igsSketch = (p5: any) => {
  P5Store.set(p5)

  p5.preload = () => {
    p5.font = p5.loadFont(`/fonts/PlusJakartaSans/VariableFont_wght.ttf`)
  }

  p5.setup = () => {
    const navbarHeight = (document.querySelector('.navbar') as HTMLElement).offsetHeight
    const bottomNavHeight = (document.querySelector('.btm-nav') as HTMLElement).offsetHeight

    const availableHeight = window.innerHeight - navbarHeight - bottomNavHeight

    p5.createCanvas(window.innerWidth, availableHeight, p5.WEBGL)
    p5.gui = new SketchGUI(p5)
    p5.handle3D = new Handle3D(p5, true)
    p5.floorPlan = new FloorPlan(p5)

    // Constants
    p5.PLAN = 0
    p5.SPACETIME = 1
    p5.GUI_TEXT_SIZE = p5.width / 70

    // STYLES
    p5.textSize(p5.GUI_TEXT_SIZE)
    p5.textFont(p5.font)
    p5.textAlign(p5.LEFT, p5.TOP)
    p5.smooth()
    p5.strokeCap(p5.SQUARE)
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
    p5.loop()
  }

  p5.dataIsLoaded = (data: any) => {
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

  // TODO: This needs to be moved eventually
  // Used by `timeline-panel.js` to determine whether to draw the timeline
  p5.overRect = (x: number, y: number, boxWidth: number, boxHeight: number) => {
    return (
      p5.mouseX >= x && p5.mouseX <= x + boxWidth && p5.mouseY >= y && p5.mouseY <= y + boxHeight
    )
  }

  p5.windowResized = () => {
    const navbarHeight = (document.querySelector('.navbar') as HTMLElement).offsetHeight
    const bottomNavHeight = (document.querySelector('.btm-nav') as HTMLElement).offsetHeight

    const availableHeight = window.innerHeight - navbarHeight - bottomNavHeight

    p5.resizeCanvas(window.innerWidth, availableHeight)
    p5.gui = new SketchGUI(p5) // update GUI vars
    p5.GUITEXTSIZE = p5.width / 70
    p5.textSize(p5.GUITEXTSIZE)
    p5.handle3D = new Handle3D(p5, p5.handle3D.getIs3DMode()) // update 3D display vars, pass current 3D mode
    p5.loop()
  }

  p5.overCircle = (x: number, y: number, diameter: number) => {
    return p5.sqrt(p5.sq(x - p5.mouseX) + p5.sq(y - p5.mouseY)) < diameter / 2
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
    if (p5.dataIsLoaded(p5.floorPlan.getImg()) && p5.arrayIsLoaded(users)) {
      const setPathData = new SetPathData(p5)
      let dataSaved = false // Flag to track if data was saved
      for (const user of users) {
        if (user.enabled) {
          const [startTimeArray, endTimeArray] = setPathData.getCodeFileArrays(user.dataTrail)
          if (startTimeArray.length > 0 && endTimeArray.length > 0) {
            const tableData = p5.writeTable(startTimeArray, endTimeArray)
            p5.saveTable(tableData, user.name, 'csv')
            dataSaved = true // Set flag to true if data is saved
            break // Save only the first enabled user
          }
        }
      }
      // If no data was saved, show the toast
      if (!dataSaved) {
        toastStore.info('There is no data to include in a code file')
        console.log('There is no data to include in a code file')
      }
    }
  }

  p5.arrayIsLoaded = (data: any) => {
    return Array.isArray(data) && data.length
  }

  p5.writeTable = (startTimesArray: any, endTimesArray: any) => {
    const headers = ['start', 'end']
    const table = new p5.Table()
    table.addColumn(headers[0])
    table.addColumn(headers[1])
    for (let i = 0; i < startTimesArray.length; i++) {
      const newRow = table.addRow()
      newRow.setNum(headers[0], startTimesArray[i])
      newRow.setNum(headers[1], endTimesArray[i])
    }
    return table
  }

  p5.updateAnimation = () => {
    const currentTimeline = get(TimelineStore)
    if (currentTimeline.getCurrTime() < currentTimeline.getRightMarker()) {
      p5.continueAnimation()
    } else {
      onAnimationEnd()
    }
  }

  p5.continueAnimation = () => {
    const currentTimeline = get(TimelineStore)
    let timeToSet: number

    if (playbackMode === 'playing-video') {
      // Video is driving - use video's current time
      timeToSet = get(VideoStore).currentTime
    } else {
      // Animation is driving - use frame-based increment
      timeToSet = currentTimeline.getCurrTime() + animationRate
    }

    TimelineStore.update((timeline) => {
      timeline.setCurrTime(timeToSet)
      return timeline
    })
  }

  p5.mapToSelectTimeThenPixelTime = (value) => {
    return p5.mapSelectTimeToPixelTime(timeline.mapPixelTimeToSelectTime(value))
  }

  p5.mapSelectTimeToPixelTime = (value) => {
    const currentTimeline = get(TimelineStore)
    const spaceTimeCubeBottom = p5.height / 10
    const spaceTimeCubeTop = p5.height / 1.6
    if (p5.handle3D.getIs3DMode())
      return p5.map(
        value,
        currentTimeline.getTimelineLeftMarkerXPos(),
        currentTimeline.getTimelineRightMarkerXPos(),
        spaceTimeCubeBottom,
        spaceTimeCubeTop
      )
    else return currentTimeline.mapSelectTimeToPixelTime2D(value)
  }
}
