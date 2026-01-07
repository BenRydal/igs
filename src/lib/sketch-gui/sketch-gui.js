import { FloorPlanContainer } from './floorplan-container.js'
import { Highlight } from './highlight.js'
import { timelineV2Store } from '../timeline/store'
import ConfigStore from '../../stores/configStore'
import { get } from 'svelte/store'

/** Padding between floorplan edge and timeline data start */
const FLOORPLAN_TIMELINE_GAP = 20

export class SketchGUI {
  constructor(sketch) {
    this.sk = sketch
    this.displayBottom = this.sk.height
    // Cap container width to canvas width for split-screen mode, with gap for timeline
    const state = timelineV2Store.getState()
    const containerWidth = Math.min(state.leftX, this.sk.width) - FLOORPLAN_TIMELINE_GAP
    this.fpContainer = new FloorPlanContainer(this.sk, containerWidth, this.displayBottom)
    this.highlight = new Highlight(this.sk, this.displayBottom)
  }

  update2D() {
    const config = get(ConfigStore)

    // Draw slicer line in 2D mode when hovering over timeline
    if (this.sk.isMouseOverTimeline() && !this.sk.handle3D.getIs3DMode()) {
      this.drawSlicerLine()
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
        this.sk.mapToSelectTimeThenPixelTime(this.sk.winMouseX)
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