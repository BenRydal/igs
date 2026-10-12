import GPSStore from '../../stores/gpsStore'
import ConfigStore from '../../stores/configStore'
import { GPS_NORMALIZED_SIZE } from '../gps/gps-transformer'

/** @typedef {import('../p5/igs-p5').IgsP5} IgsP5 */
/** @typedef {{ width: number, height: number }} ContainerSize */
/** @typedef {{ width: number, height: number, offsetX: number, offsetY: number }} EffectiveDims */
/**
 * @typedef {{ containerWidth: number, containerHeight: number, imgW: number,
 *   imgH: number, rotation: number, preserve: boolean, result: EffectiveDims }} EffDimsMemo
 */

/**
 * Mirrors of the only two store fields this module reads, following the same
 * subscribe-once pattern as draw-state.ts.
 *
 * getScaledXYPos and getEffectiveDimensions run once per data point, per view,
 * per frame — hundreds of thousands of times a second on a large dataset — and
 * a `get(store)` call allocates and runs a subscriber every time. A writable
 * notifies synchronously on set, so a mirror is exactly as current as a `get()`.
 */
const storeMirror = {
  isGPSMode: false,
  preserveFloorplanAspectRatio: false,
}

GPSStore.subscribe((gps) => {
  storeMirror.isGPSMode = gps.isGPSMode
})

ConfigStore.subscribe((config) => {
  storeMirror.preserveFloorplanAspectRatio = config.preserveFloorplanAspectRatio
})

export class FloorPlan {
  /** @param {IgsP5} sk */
  constructor(sk) {
    this.sk = sk
    /** @type {import('p5').Image | null} */
    this.img = null
    this.curFloorPlanRotation = 1 // [0-3] 4 rotation modes none, 90, 180, 270
    /** @type {EffDimsMemo | null} */
    this.effDimsMemo = null
  }

  /**
   * Calculate effective dimensions for the floorplan within the container.
   * When preserveFloorplanAspectRatio is true, maintains image proportions.
   * Returns { width, height, offsetX, offsetY } for positioning.
   * @param {ContainerSize} container
   * @returns {EffectiveDims}
   */
  getEffectiveDimensions(container) {
    const preserve = storeMirror.preserveFloorplanAspectRatio
    const imgW = this.img ? this.img.width : 0
    const imgH = this.img ? this.img.height : 0

    // Memoized because this is called once per data point, per view, per frame
    // via getScaledXYPos, yet depends on nothing that varies between points.
    const memo = this.effDimsMemo
    if (
      memo !== null &&
      memo.containerWidth === container.width &&
      memo.containerHeight === container.height &&
      memo.imgW === imgW &&
      memo.imgH === imgH &&
      memo.rotation === this.curFloorPlanRotation &&
      memo.preserve === preserve
    ) {
      return memo.result
    }

    const result = this.computeEffectiveDimensions(container, preserve)
    this.effDimsMemo = {
      containerWidth: container.width,
      containerHeight: container.height,
      imgW,
      imgH,
      rotation: this.curFloorPlanRotation,
      preserve,
      result,
    }
    return result
  }

  /**
   * Uncached body of getEffectiveDimensions.
   * @param {ContainerSize} container
   * @param {boolean} preserve
   * @returns {EffectiveDims}
   */
  computeEffectiveDimensions(container, preserve) {
    if (!preserve || !this.img) {
      return { width: container.width, height: container.height, offsetX: 0, offsetY: 0 }
    }

    // Get image aspect ratio, accounting for rotation
    // Rotations 1 and 3 (90° and 270°) swap width/height
    const isRotated90or270 = this.curFloorPlanRotation === 1 || this.curFloorPlanRotation === 3
    const imgWidth = isRotated90or270 ? this.img.height : this.img.width
    const imgHeight = isRotated90or270 ? this.img.width : this.img.height
    const imgAspect = imgWidth / imgHeight
    const containerAspect = container.width / container.height

    let width, height, offsetX, offsetY

    if (imgAspect > containerAspect) {
      // Image is wider than container - fit to width
      width = container.width
      height = width / imgAspect
      offsetX = 0
      offsetY = (container.height - height) / 2
    } else {
      // Image is taller than container - fit to height
      height = container.height
      width = height * imgAspect
      offsetX = (container.width - width) / 2
      offsetY = 0
    }

    return { width, height, offsetX, offsetY }
  }

  /**
   * Organizes floor plan drawing methods with correct rotation angle and corresponding width/height that vary based on rotation angle
   * @param {ContainerSize} container
   */
  setFloorPlan(container) {
    const eff = this.getEffectiveDimensions(container)

    // Apply offset for centered positioning when preserving aspect ratio
    this.sk.push()
    this.sk.translate(eff.offsetX, eff.offsetY)

    switch (this.curFloorPlanRotation) {
      case 1:
        this.rotateAndDraw(this.sk.HALF_PI, eff.height, eff.width, eff)
        break
      case 2:
        this.rotateAndDraw(this.sk.PI, eff.width, eff.height, eff)
        break
      case 3:
        this.rotateAndDraw(-this.sk.HALF_PI, eff.height, eff.width, eff)
        break
      case 0:
      default:
        this.draw(eff.width, eff.height)
        break
    }

    this.sk.pop()
  }

  /**
   * Converts x/y pixel positions from data point to floor plan depending on floor plan rotation mode
   * In GPS mode, coordinates are in normalized 0-1000 space; in regular mode, based on image dimensions
   * @param {number} xPos
   * @param {number} yPos
   * @param {ContainerSize} container
   */
  getScaledXYPos(xPos, yPos, container) {
    // Callers only invoke this with a loaded floorplan (guarded via getImg());
    // the early return is defensive and satisfies null narrowing.
    if (!this.img) return [0, 0]
    const isGPSMode = storeMirror.isGPSMode
    const eff = this.getEffectiveDimensions(container)

    // Normalize coordinates to 0-1 range based on mode
    const normX = isGPSMode ? xPos / GPS_NORMALIZED_SIZE : xPos / this.img.width
    const normY = isGPSMode ? yPos / GPS_NORMALIZED_SIZE : yPos / this.img.height

    // Apply rotation and scale to effective dimensions, then add offset
    switch (this.curFloorPlanRotation) {
      case 1:
        return [eff.offsetX + eff.width - normY * eff.width, eff.offsetY + normX * eff.height]
      case 2:
        return [
          eff.offsetX + eff.width - normX * eff.width,
          eff.offsetY + eff.height - normY * eff.height,
        ]
      case 3:
        return [eff.offsetX + normY * eff.width, eff.offsetY + eff.height - normX * eff.height]
      default:
        return [eff.offsetX + normX * eff.width, eff.offsetY + normY * eff.height]
    }
  }

  /**
   * NOTE: When drawing floor plan, translate down on z axis -1 pixel so shapes are drawn cleanly on top of the floor plan
   * @param {number} width
   * @param {number} height
   */
  draw(width, height) {
    if (!this.img) return
    if (this.sk.handle3D.getIs3DMode()) {
      this.sk.push()
      this.sk.translate(0, 0, -1)
      this.sk.image(this.img, 0, 0, width, height)
      this.sk.pop()
    } else {
      this.sk.translate(0, 0, -1)
      this.sk.image(this.img, 0, 0, width, height)
    }
  }

  /**
   * @param {number} angle
   * @param {number} width
   * @param {number} height
   * @param {EffectiveDims} container
   */
  rotateAndDraw(angle, width, height, container) {
    this.sk.push()
    this.sk.imageMode(this.sk.CENTER) // important method to include here
    this.sk.translate(container.width / 2, container.height / 2)
    this.sk.rotate(angle)
    this.draw(width, height)
    this.sk.pop()
  }

  setRotateRight() {
    this.curFloorPlanRotation++
    if (this.curFloorPlanRotation > 3) this.curFloorPlanRotation = 0
  }

  setRotateLeft() {
    this.curFloorPlanRotation--
    if (this.curFloorPlanRotation < 0) this.curFloorPlanRotation = 3
  }

  getImg() {
    return this.img
  }

  /**
   * Size of the coordinate space data points actually live in: the floorplan
   * image's own pixel grid, or the normalized square that GPS coordinates are
   * projected into. Null until an image is loaded.
   *
   * Read by the draw layer to scale source coordinates into screen pixels, which
   * is the space the path reduction measures its error budget in. It lives here
   * rather than there because the GPS-mode distinction is already this module's
   * concern.
   *
   * @returns {ContainerSize | null}
   */
  getSourceDimensions() {
    if (!this.img) return null
    if (storeMirror.isGPSMode) {
      return { width: GPS_NORMALIZED_SIZE, height: GPS_NORMALIZED_SIZE }
    }
    return { width: this.img.width, height: this.img.height }
  }
}
