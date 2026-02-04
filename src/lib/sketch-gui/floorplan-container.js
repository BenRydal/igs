import ConfigStore from '../../stores/configStore'

// Module-level config state (avoids get() calls during rendering)
let viewMode = '3d'
let selectorSize = 100
let slicerSize = 25

ConfigStore.subscribe((data) => {
  viewMode = data.viewMode
  selectorSize = data.selectorSize
  slicerSize = data.slicerSize
})

export class FloorPlanContainer {
  constructor(sketch, start, height) {
    this.sk = sketch
    this.width = start
    this.height = height
  }

  drawRegionSelector() {
    this.setSelectorStroke()
    this.sk.circle(this.sk.mouseX, this.sk.mouseY, selectorSize)
  }

  drawSlicerSelector() {
    this.setSelectorStroke()
    this.sk.line(this.sk.mouseX - slicerSize, 0, this.sk.mouseX - slicerSize, this.height)
    this.sk.line(this.sk.mouseX + slicerSize, 0, this.sk.mouseX + slicerSize, this.height)
  }

  setSelectorStroke() {
    this.sk.noFill()
    this.sk.strokeWeight(4)
    this.sk.stroke(0)
  }

  overCursor(xPos, yPos, xPosTime) {
    const overFloorPlan = this.sk.overCircle(xPos, yPos, selectorSize)
    if (viewMode === 'map') return overFloorPlan
    return overFloorPlan || this.sk.overCircle(xPosTime, yPos, selectorSize)
  }

  overSlicer(xPos, xPosTime) {
    const overFloorPlan = this.sk.overRect(xPos - slicerSize, 0, 2 * slicerSize, this.height)
    if (viewMode === 'map') return overFloorPlan
    return overFloorPlan || this.sk.overRect(xPosTime - slicerSize, 0, 2 * slicerSize, this.height)
  }

  getContainer() {
    // In map view, use full canvas width since we're not showing the space-time view
    const width = viewMode === 'map' ? this.sk.width : this.width
    return {
      width,
      height: this.height,
    }
  }
}
