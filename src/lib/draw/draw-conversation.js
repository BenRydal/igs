import ConfigStore from '../../stores/configStore'
import TimelineStore from '../../stores/timelineStore'
import { setHoveredConversation, clearHoveredConversation } from '../../stores/interactionStore'

/**
 * Draws conversation rectangles with level-of-detail:
 * - Aggregated clusters when zoomed out (>30% timeline visible)
 * - Individual rectangles when zoomed in
 *
 * Individual rect sizing:
 *   Floor plan:  width = conversationRectWidth (config), height = text length
 *                Jittered position to separate overlapping turns
 *   Space-time:  width = conversationRectWidth (config), height = text length
 *
 * Aggregate cluster sizing:
 *   Floor plan:  size scales with total text volume (15-80px)
 *   Space-time:  width = time span, height = total text volume (15-80px)
 */

let alignToggle, isPathColorMode, conversationRectWidth
let clusterTimeThreshold, clusterSpaceThreshold
let timelineLeftMarker, timelineRightMarker, timelineEndTime
let searchRegex = null

// Aggregate rect dimensions
const TAIL_HEIGHT = 8
const TAIL_WIDTH = 10
const RECT_GAP = 12 // gap between aggregate rect and movement path

ConfigStore.subscribe((data) => {
  alignToggle = data.alignToggle
  isPathColorMode = data.isPathColorMode
  conversationRectWidth = data.conversationRectWidth
  clusterTimeThreshold = data.clusterTimeThreshold
  clusterSpaceThreshold = data.clusterSpaceThreshold
  if (data.wordToSearch) {
    const escaped = data.wordToSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    searchRegex = new RegExp(escaped, 'i')
  } else {
    searchRegex = null
  }
})

TimelineStore.subscribe((data) => {
  timelineLeftMarker = data.getLeftMarker()
  timelineRightMarker = data.getRightMarker()
  timelineEndTime = data.getEndTime()
})

export class DrawConversation {
  constructor(sketch, drawUtils) {
    this.sk = sketch
    this.drawUtils = drawUtils
  }

  static clearHoverState() {
    clearHoveredConversation()
  }

  setData(user) {
    this.speaker = user.name
    this.color = user.color
    this.is3D = this.sk.handle3D.getIs3DMode()
    if (this.is3D) {
      this.translateZoom = Math.abs(this.sk.handle3D.getCurTranslatePos().zoom)
    }

    const zoomLevel = timelineEndTime ? (timelineRightMarker - timelineLeftMarker) / timelineEndTime : 1
    zoomLevel > 0.3 ? this.drawAggregated(user.dataTrail) : this.drawDetailed(user.dataTrail)
  }

  drawDetailed(dataTrail) {
    const JITTER_AMOUNT = 8 // max pixels to offset in each direction

    for (const point of dataTrail) {
      if (!point.speech || (searchRegex && !searchRegex.test(point.speech))) continue

      const pos = this.drawUtils.getScaledConversationPos(point)
      if (!this.drawUtils.isVisible(point, pos, point.stopLength)) continue

      // Deterministic jitter based on point time (consistent across redraws)
      const jitterX = ((point.time * 7) % JITTER_AMOUNT) - JITTER_AMOUNT / 2
      const jitterY = ((point.time * 13) % JITTER_AMOUNT) - JITTER_AMOUNT / 2
      const fpX = pos.floorPlanXPos + jitterX
      const fpY = pos.adjustYPos + jitterY

      this.sk.noStroke()
      const color = isPathColorMode ? this.drawUtils.setCodeColor(point.codes) : this.color
      this.sk.fill(this.sk.red(color), this.sk.green(color), this.sk.blue(color), 180)

      if (this.is3D) {
        this.sk.rect(fpX, fpY, -conversationRectWidth, -pos.rectHeight)
        this.drawQuad3D(pos.selTimelineXPos, pos.rectWidth, pos.rectHeight, fpX, fpY)
      } else {
        // Hover detection for both views
        if (this.sk.overRect(fpX, fpY, conversationRectWidth, pos.rectHeight) ||
            this.sk.overRect(pos.selTimelineXPos, pos.adjustYPos, pos.rectWidth, pos.rectHeight)) {
          this.sk.stroke(0)
          this.sk.strokeWeight(4)
          setHoveredConversation(
            [{ time: point.time, speaker: this.speaker, text: point.speech, color: this.color }],
            this.sk.mouseX, this.sk.mouseY
          )
        }
        // Floor plan: jittered position
        this.sk.rect(fpX, fpY, conversationRectWidth, pos.rectHeight)
        // Space-time: no jitter (time separates them)
        this.sk.rect(pos.selTimelineXPos, pos.adjustYPos, pos.rectWidth, pos.rectHeight)
      }
    }
  }

  drawAggregated(dataTrail) {
    for (const points of this.clusterPoints(dataTrail)) {
      const first = points[0], last = points[points.length - 1]
      const pos = this.drawUtils.getScaledConversationPos(first)
      if (!this.drawUtils.isVisible(first, pos, first.stopLength)) continue

      const endPos = this.drawUtils.getScaledConversationPos(last)
      const totalTextLength = points.reduce((sum, p) => sum + p.speech.length, 0)

      // Both views use same size scaling based on total text volume
      const size = Math.min(80, this.sk.map(totalTextLength, 0, 1000, 15, 80))
      // Space-time width = time span
      const width = Math.max(10, Math.abs(endPos.selTimelineXPos - pos.selTimelineXPos))

      const fpX = pos.floorPlanXPos - size / 2
      const fpY = alignToggle ? 0 : pos.floorPlanYPos - size - RECT_GAP
      const color = isPathColorMode ? this.drawUtils.setCodeColor(first.codes) : this.color

      this.sk.noStroke()
      this.sk.fill(this.sk.red(color), this.sk.green(color), this.sk.blue(color), 180)

      if (this.is3D) {
        const yPos = alignToggle ? this.sk.gui.fpContainer.getContainer().height : pos.floorPlanYPos - RECT_GAP
        // 3D draws with negative dimensions (leftward/upward), so adjust x to center
        const fpX3D = pos.floorPlanXPos + size / 2
        // Floor plan rect + tail pointing down toward movement path
        this.sk.rect(fpX3D, yPos, -size, -size)
        this.sk.triangle(
          pos.floorPlanXPos - TAIL_WIDTH / 2, yPos,
          pos.floorPlanXPos + TAIL_WIDTH / 2, yPos,
          pos.floorPlanXPos, yPos + TAIL_HEIGHT
        )
        // Space-time quad + tail
        const stFpX = pos.floorPlanXPos + TAIL_WIDTH / 2
        this.drawQuad3D(pos.selTimelineXPos, width, size, stFpX, pos.floorPlanYPos)
        this.drawTail3D(pos.selTimelineXPos, stFpX, pos.floorPlanYPos)
      } else {
        if (this.sk.overRect(fpX, fpY, size, size) || this.sk.overRect(pos.selTimelineXPos, fpY, width, size)) {
          this.sk.stroke(0)
          this.sk.strokeWeight(3)
          setHoveredConversation(
            points.map(p => ({ time: p.time, speaker: this.speaker, text: p.speech, color: this.color })),
            this.sk.mouseX, this.sk.mouseY
          )
        }
        // Floor plan rect + tail
        this.sk.rect(fpX, fpY, size, size)
        this.sk.triangle(
          fpX + size / 2 - TAIL_WIDTH / 2, fpY + size,
          fpX + size / 2 + TAIL_WIDTH / 2, fpY + size,
          fpX + size / 2, fpY + size + TAIL_HEIGHT
        )
        // Space-time rect + tail
        this.sk.rect(pos.selTimelineXPos, fpY, width, size)
        this.sk.triangle(
          pos.selTimelineXPos, fpY + size,
          pos.selTimelineXPos + TAIL_WIDTH, fpY + size,
          pos.selTimelineXPos, fpY + size + TAIL_HEIGHT
        )
      }
    }
  }

  clusterPoints(dataTrail) {
    const clusters = []
    let current = []
    let lastPoint = null
    const spaceThresholdSq = clusterSpaceThreshold * clusterSpaceThreshold

    for (const point of dataTrail) {
      if (!point.speech || (searchRegex && !searchRegex.test(point.speech))) continue

      if (!current.length) {
        current.push(point)
      } else {
        const timeDiff = point.time - lastPoint.time
        const dx = point.x - lastPoint.x
        const dy = point.y - lastPoint.y
        const distanceSq = dx * dx + dy * dy

        if (timeDiff > clusterTimeThreshold || distanceSq > spaceThresholdSq) {
          clusters.push(current)
          current = [point]
        } else {
          current.push(point)
        }
      }
      lastPoint = point
    }
    if (current.length) clusters.push(current)
    return clusters
  }

  drawQuad3D(xPos, width, height, fpX, fpY) {
    const z = this.translateZoom
    if (alignToggle) {
      this.sk.quad(0, z, xPos, height, z, xPos, height, z, xPos + width, 0, z, xPos + width)
    } else {
      this.sk.quad(fpX, fpY, xPos, fpX + height, fpY, xPos, fpX + height, fpY, xPos + width, fpX, fpY, xPos + width)
    }
  }

  drawTail3D(xPos, fpX, fpY) {
    const z = this.translateZoom
    // Tail extends down (negative x) from bottom-left of quad
    this.sk.beginShape()
    if (alignToggle) {
      this.sk.vertex(0, z, xPos)
      this.sk.vertex(0, z, xPos + TAIL_WIDTH)
      this.sk.vertex(-TAIL_HEIGHT, z, xPos)
    } else {
      this.sk.vertex(fpX, fpY, xPos)
      this.sk.vertex(fpX, fpY, xPos + TAIL_WIDTH)
      this.sk.vertex(fpX - TAIL_HEIGHT, fpY, xPos)
    }
    this.sk.endShape(this.sk.CLOSE)
  }
}
