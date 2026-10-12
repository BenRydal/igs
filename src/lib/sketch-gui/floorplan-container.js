import { drawState } from '../draw/draw-state'

/** @typedef {import('../p5/igs-p5').IgsP5} IgsP5 */

export class FloorPlanContainer {
  /**
   * @param {IgsP5} sketch
   * @param {number} start container width (capped at the timeline's left edge)
   * @param {number} height container height
   */
  constructor(sketch, start, height) {
    this.sk = sketch
    this.width = start
    this.height = height
    // Built once rather than per call: getContainer() is reached per data point,
    // per view, per frame from getSharedPosValues, and every caller only reads
    // width/height. The values are fixed for this container's lifetime — a
    // resize constructs a new SketchGUI, and with it a new FloorPlanContainer.
    this.container = { width: start, height: height }
  }

  // Served by a plain property read off the draw-layer mirror, not a `get()` on
  // ConfigStore: overCursor and overSlicer are reached from isVisible, which
  // runs per point per frame whenever a spatial selection mode is active.
  getSelectorSize() {
    return drawState.config.selectorSize
  }

  getSlicerSize() {
    return drawState.config.slicerSize
  }

  drawRegionSelector() {
    this.setSelectorStroke()
    this.sk.circle(this.sk.mouseX, this.sk.mouseY, this.getSelectorSize())
  }

  drawSlicerSelector() {
    const slicerSize = this.getSlicerSize()
    this.setSelectorStroke()
    this.sk.line(this.sk.mouseX - slicerSize, 0, this.sk.mouseX - slicerSize, this.height)
    this.sk.line(this.sk.mouseX + slicerSize, 0, this.sk.mouseX + slicerSize, this.height)
  }

  setSelectorStroke() {
    this.sk.noFill()
    this.sk.strokeWeight(4)
    this.sk.stroke(0)
  }

  /**
   * @param {number} xPos
   * @param {number} yPos
   * @param {number} xPosTime
   */
  overCursor(xPos, yPos, xPosTime) {
    const selectorSize = this.getSelectorSize()
    return (
      this.sk.overCircle(xPos, yPos, selectorSize) ||
      this.sk.overCircle(xPosTime, yPos, selectorSize)
    )
  }

  /**
   * @param {number} xPos
   * @param {number} xPosTime
   */
  overSlicer(xPos, xPosTime) {
    const slicerSize = this.getSlicerSize()
    return (
      this.sk.overRect(xPos - slicerSize, 0, 2 * slicerSize, this.height) ||
      this.sk.overRect(xPosTime - slicerSize, 0, 2 * slicerSize, this.height)
    )
  }

  getContainer() {
    return this.container
  }
}
