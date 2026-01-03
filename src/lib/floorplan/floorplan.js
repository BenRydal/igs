import { toastStore } from '../../stores/toastStore'
import GPSStore from '../../stores/gpsStore'
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
   * Organizes floor plan drawing methods with correct rotation angle and corresponding width/height that vary bsed on rotation angle
   */
  setFloorPlan(container) {
    switch (this.curFloorPlanRotation) {
      case 1:
        this.rotateAndDraw(this.sk.HALF_PI, container.height, container.width, container)
        break
      case 2:
        this.rotateAndDraw(this.sk.PI, container.width, container.height, container)
        break
      case 3:
        this.rotateAndDraw(-this.sk.HALF_PI, container.height, container.width, container)
        break
      case 0:
      default:
        this.draw(container.width, container.height)
        break
    }
  }

  /**
   * Converts x/y pixel positions from data point to floor plan depending on floor plan rotation mode
   * In GPS mode, coordinates are in normalized 0-1000 space; in regular mode, based on image dimensions
   * @param  {Float} xPos
   * @param  {Float} yPos
   */
  getScaledXYPos(xPos, yPos, container) {
    const gpsState = get(GPSStore)

    // Normalize coordinates to 0-1 range based on mode
    const normX =
      gpsState.isGPSMode && this.img ? xPos / GPS_NORMALIZED_SIZE : xPos / this.img.width
    const normY =
      gpsState.isGPSMode && this.img ? yPos / GPS_NORMALIZED_SIZE : yPos / this.img.height

    // Apply rotation and scale to container dimensions
    switch (this.curFloorPlanRotation) {
      case 0:
        return [normX * container.width, normY * container.height]
      case 1:
        return [container.width - normY * container.width, normX * container.height]
      case 2:
        return [container.width - normX * container.width, container.height - normY * container.height]
      case 3:
        return [normY * container.width, container.height - normX * container.height]
      default:
        return [normX * container.width, normY * container.height]
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
