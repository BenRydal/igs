import { FloorPlanContainer } from './floorplan-container.js'
import { Highlight } from './highlight.js'
import TimelineStore from '../../stores/timelineStore'
import ConfigStore from '../../stores/configStore'
import { setTimelineHover, clearTimelineHover } from '../../stores/interactionStore'
import { get } from 'svelte/store'

let timeline

TimelineStore.subscribe((data) => {
  timeline = data
})

export class SketchGUI {
  constructor(sketch) {
    this.sk = sketch
    this.displayBottom = this.sk.height
    // Cap container width to canvas width for split-screen mode
    const containerWidth = Math.min(timeline.getLeftX(), this.sk.width)
    this.fpContainer = new FloorPlanContainer(this.sk, containerWidth, this.displayBottom)
    this.highlight = new Highlight(this.sk, this.displayBottom)
  }

  update2D() {
    const config = get(ConfigStore)

    if (this.sk.isMouseOverTimeline()) {
      // Draw slicer line in 2D mode only
      if (!this.sk.handle3D.getIs3DMode()) {
        this.drawSlicerLine()
      }
      // Set timeline hover for tooltip
      const hoverTime = timeline.pixelToSelectedTime(this.sk.mouseX)
      setTimelineHover(hoverTime, this.sk.mouseX, this.sk.mouseY)
    } else {
      clearTimelineHover()
    }

    if (!this.sk.handle3D.getIs3DModeOrTransitioning()) {
      if (config.circleToggle) this.fpContainer.drawRegionSelector()
      else if (config.sliceToggle) this.fpContainer.drawSlicerSelector()
    }
  }

  update3D() {
    this.highlight.setDraw()
    if (this.sk.isMouseOverTimeline() && this.sk.handle3D.getIs3DMode()) {
      this.draw3DSlicerRect(
        this.fpContainer.getContainer(),
        this.sk.mapToSelectTimeThenPixelTime(this.sk.mouseX)
      )
    }
  }

  drawSlicerLine() {
    // Shadow
    this.sk.stroke(0, 30)
    this.sk.strokeWeight(3)
    this.sk.line(this.sk.mouseX + 1, 0, this.sk.mouseX + 1, this.sk.height)

    // Main line
    this.sk.stroke(0)
    this.sk.strokeWeight(1)
    this.sk.line(this.sk.mouseX, 0, this.sk.mouseX, this.sk.height)
  }

  draw3DSlicerRect(container, zPos) {
    this.sk.fill(255, 50)
    this.sk.stroke(0)
    this.sk.strokeWeight(1)
    this.sk.quad(
      0,
      0,
      zPos,
      container.width,
      0,
      zPos,
      container.width,
      container.height,
      zPos,
      0,
      container.height,
      zPos
    )
  }
}
