import ConfigStore from '../../stores/configStore'
import { get } from 'svelte/store'

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
  }

  getSelectorSize() {
    return get(ConfigStore).selectorSize
  }

  getSlicerSize() {
    return get(ConfigStore).slicerSize
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
    return {
      width: this.width,
      height: this.height,
    }
  }
}
