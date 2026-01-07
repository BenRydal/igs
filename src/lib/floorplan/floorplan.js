import { toastStore } from '../../stores/toastStore'
import GPSStore from '../../stores/gpsStore'
import ConfigStore from '../../stores/configStore'
import { get } from 'svelte/store'
import { GPS_NORMALIZED_SIZE } from '../gps/gps-transformer'

export class FloorPlan {
  constructor(sk) {
    this.sk = sk
    this.img = null
    this.width = null
    this.height = null
    this.curFloorPlanRotation = 1 // [0-3] 4 rotation modes none, 90, 180, 270
  }

  /**
   * Calculate effective dimensions for the floorplan within the container.
   * When preserveFloorplanAspectRatio is true, maintains image proportions.
   * Returns { width, height, offsetX, offsetY } for positioning.
   */
  getEffectiveDimensions(container) {
    const config = get(ConfigStore)

    if (!config.preserveFloorplanAspectRatio || !this.img) {
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
   * Creates P5 image file from path and updates core floorPlan image and input width/heights to properly scale and display data
   * @param  {String} filePath
   */
  update(filePath) {
    this.sk.loadImage(
      filePath,
      (img) => {
        this.img = img
        this.width = img.width
        this.height = img.height
        this.sk.loop() // rerun P5 draw loop after loading image
      },
      () => {
        toastStore.error(
          'Error loading floor plan image file. Please make sure it is correctly formatted as a PNG or JPG image file.'
        )
      }
    )
  }

  /**
   * Organizes floor plan drawing methods with correct rotation angle and corresponding width/height that vary based on rotation angle
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
   * @param  {Float} xPos
   * @param  {Float} yPos
   */
  getScaledXYPos(xPos, yPos, container) {
    const gpsState = get(GPSStore)
    const eff = this.getEffectiveDimensions(container)

    // Normalize coordinates to 0-1 range based on mode
    const normX =
      gpsState.isGPSMode && this.img ? xPos / GPS_NORMALIZED_SIZE : xPos / this.img.width
    const normY =
      gpsState.isGPSMode && this.img ? yPos / GPS_NORMALIZED_SIZE : yPos / this.img.height

    // Apply rotation and scale to effective dimensions, then add offset
    switch (this.curFloorPlanRotation) {
      case 1:
        return [eff.offsetX + eff.width - normY * eff.width, eff.offsetY + normX * eff.height]
      case 2:
        return [eff.offsetX + eff.width - normX * eff.width, eff.offsetY + eff.height - normY * eff.height]
      case 3:
        return [eff.offsetX + normY * eff.width, eff.offsetY + eff.height - normX * eff.height]
      default:
        return [eff.offsetX + normX * eff.width, eff.offsetY + normY * eff.height]
    }
  }

  /**
   * NOTE: When drawing floor plan, translate down on z axis -1 pixel so shapes are drawn cleanly on top of the floor plan
   */
  draw(width, height) {
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

  clear() {
    this.img = null
    this.width = null
    this.height = null
  }
}
