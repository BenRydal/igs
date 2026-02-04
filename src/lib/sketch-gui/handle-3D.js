import ConfigStore from '../../stores/configStore'

// Module-level state (avoids get() calls during rendering)
let viewMode = '3d'

ConfigStore.subscribe((data) => {
  viewMode = data.viewMode
})

const VIEW_MODE_CYCLE = { '3d': '2d', '2d': 'map', map: '3d' }

/**
 * Class to control view modes (3D, 2D, Map) and transitioning between them
 */
export class Handle3D {
  constructor(sketch) {
    this.sk = sketch
    this.isTransitioning = false
    this.translate = {
      zoom: -(this.sk.height / 1.5),
      xPos: this.sk.width / 4,
      yPos: this.sk.height / 1.65,
      rotateX: this.sk.PI / 2.3,
    }
    this.curTranslatePos = {
      zoom: this.translate.zoom,
      xPos: this.translate.xPos,
      yPos: this.translate.yPos,
      rotateX: this.translate.rotateX,
    }
  }

  /**
   * Cycle through view modes: 3D -> 2D -> Map -> 3D
   */
  update() {
    const currentMode = viewMode
    const nextMode = VIEW_MODE_CYCLE[currentMode]

    ConfigStore.update((c) => ({ ...c, viewMode: nextMode }))

    // Animate transition when moving to/from 3D mode
    if (currentMode === '3d' || nextMode === '3d') {
      this.setIsTransitioning(true)
    }

    this.sk.loop()
  }

  update3DTranslation() {
    if (this.isTransitioning) {
      if (this.getIs3DMode()) this.isTransitioning = this.updatePositions()
      else this.isTransitioning = this.resetPositions()
    }
    const curPos = this.getCurTranslatePos()
    this.sk.translate(curPos.xPos, curPos.yPos, curPos.zoom)
    this.sk.rotateX(curPos.rotateX)
  }

  updatePositions() {
    let isRunning = false
    this.curTranslatePos.zoom = this.translate.zoom
    if (this.curTranslatePos.rotateX < this.translate.rotateX) {
      this.curTranslatePos.rotateX += 0.03
      isRunning = true
    }
    if (this.curTranslatePos.xPos < this.translate.xPos) {
      this.curTranslatePos.xPos += 10
      isRunning = true
    }
    if (this.curTranslatePos.yPos < this.translate.yPos) {
      this.curTranslatePos.yPos += 10
      isRunning = true
    }
    return isRunning
  }

  resetPositions() {
    this.curTranslatePos.rotateX = 0
    this.curTranslatePos.xPos = 0
    this.curTranslatePos.yPos = 0
    this.curTranslatePos.zoom = 0
    return false
  }

  setIsTransitioning(value) {
    this.isTransitioning = value
  }

  getIs3DMode() {
    return viewMode === '3d'
  }

  isMapView() {
    return viewMode === 'map'
  }

  getIsTransitioning() {
    return this.isTransitioning
  }

  getIs3DModeOrTransitioning() {
    return this.getIs3DMode() || this.isTransitioning
  }

  getCurTranslatePos() {
    return this.curTranslatePos
  }
}
