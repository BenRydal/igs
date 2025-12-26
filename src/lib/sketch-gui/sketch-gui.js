import { FloorPlanContainer } from './floorplan-container.js'
import { Highlight } from './highlight.js'
import TimelineStore from '../../stores/timelineStore'
import ConfigStore from '../../stores/configStore'
import { get } from 'svelte/store'
import { formatTime } from '../utils/format'

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
      // Always draw time label when hovering over timeline
      this.drawHoverTimeLabel()
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

  drawHoverTimeLabel() {
    const hoverTime = timeline.mapPixelTimeToTotalTime(this.sk.mouseX)
    const timeText = formatTime(hoverTime)

    this.sk.textSize(14)
    const textW = this.sk.textWidth(timeText)
    const padding = 8
    const pillHeight = 24
    const pillWidth = textW + padding * 2

    // Y follows mouse, clamped to stay on canvas
    const minY = 20
    const maxY = this.sk.height - pillHeight
    const labelY = Math.max(minY, Math.min(this.sk.mouseY - pillHeight / 2, maxY))

    // X position: centered in 3D mode, offset to side in 2D mode
    let labelX
    if (this.sk.handle3D.getIs3DMode()) {
      // Center above mouse
      labelX = this.sk.mouseX - pillWidth / 2
    } else {
      // Offset to right, flip to left if near edge
      labelX = this.sk.mouseX + 15
      if (labelX + pillWidth > this.sk.width - 10) {
        labelX = this.sk.mouseX - pillWidth - 15
      }
    }
    // Keep within canvas bounds
    labelX = Math.max(10, Math.min(labelX, this.sk.width - pillWidth - 10))

    // Background pill
    this.sk.noStroke()
    this.sk.fill(0, 180)
    this.sk.rect(labelX, labelY, pillWidth, pillHeight, 4)

    // Text
    this.sk.fill(255)
    this.sk.textAlign(this.sk.CENTER, this.sk.CENTER)
    this.sk.text(timeText, labelX + pillWidth / 2, labelY + pillHeight / 2)
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
