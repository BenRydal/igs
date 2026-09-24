import GPSStore from '../../stores/gpsStore'
import ConfigStore from '../../stores/configStore'
import { get } from 'svelte/store'
import { GPS_NORMALIZED_SIZE } from '../gps/gps-transformer'
import { effectiveRect, toCanvas } from './transform'

/** @typedef {import('../p5/igs-p5').IgsP5} IgsP5 */
/** @typedef {{ width: number, height: number }} ContainerSize */
/** @typedef {{ width: number, height: number, offsetX: number, offsetY: number }} EffectiveDims */

export class FloorPlan {
  /** @param {IgsP5} sk */
  constructor(sk) {
    this.sk = sk
    /** @type {import('p5').Image | null} */
    this.img = null
    this.curFloorPlanRotation = 1 // [0-3] 4 rotation modes none, 90, 180, 270
  }

  /**
   * The floorplan's placement inputs for the pure transforms in ./transform.
   * @param {ContainerSize} container
   * @returns {import('./transform').FloorplanGeometry | null} null until an image is loaded
   */
  getGeometry(container) {
    if (!this.img) return null
    const image = { width: this.img.width, height: this.img.height }
    return {
      container,
      image,
      source: get(GPSStore).isGPSMode
        ? { width: GPS_NORMALIZED_SIZE, height: GPS_NORMALIZED_SIZE }
        : image,
      rotation: /** @type {import('./transform').FloorplanRotation} */ (this.curFloorPlanRotation),
      preserveAspectRatio: get(ConfigStore).preserveFloorplanAspectRatio,
    }
  }

  /**
   * Calculate effective dimensions for the floorplan within the container.
   * When preserveFloorplanAspectRatio is true, maintains image proportions.
   * @param {ContainerSize} container
   * @returns {EffectiveDims}
   */
  getEffectiveDimensions(container) {
    const geometry = this.getGeometry(container)
    if (!geometry)
      return { width: container.width, height: container.height, offsetX: 0, offsetY: 0 }
    return effectiveRect(geometry)
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
    const geometry = this.getGeometry(container)
    if (!geometry) return [0, 0]
    return toCanvas(xPos, yPos, geometry)
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
}
