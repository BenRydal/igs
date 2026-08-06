import { timelineV2Store } from '../timeline/store'
import { drawState } from './draw-state'
import { setHoveredConversation, clearHoveredConversation } from '../../stores/interactionStore'
import { MIN_RECT_SIZE, MAX_RECT_SIZE } from './draw-utils'

/**
 * Draws conversation rectangles with level-of-detail:
 * - Aggregated clusters when zoomed out (>30% timeline visible)
 * - Individual rectangles when zoomed in
 *
 * Supports two modes for aggregated clusters:
 * - Striped: Multiple speakers shown as proportional vertical stripes
 * - Single color: Each speaker's clusters drawn separately
 */

const TAIL_HEIGHT = 8
const TAIL_WIDTH = 10
const RECT_GAP = 12
const RECT_ALPHA = 180
const JITTER_AMOUNT = 8
const MIN_TEXT_FOR_SCALING = 100 // Prevents tiny clusters from appearing huge

/** @typedef {import('../p5/igs-p5').IgsP5} IgsP5 */
/** @typedef {import('./draw-utils').DrawUtils} DrawUtils */
/** @typedef {import('./draw-utils').ConversationPos} ConversationPos */
/** @typedef {import('../../models/dataPoint').DataPoint} DataPoint */
/**
 * A conversation point merged across users, time-sorted (see SetPathData).
 * @typedef {{ point: DataPoint, speaker: string, color: string }} MergedPoint
 */
/** @typedef {MergedPoint[]} Cluster */
/** @typedef {{ speaker: string, color: string, textLength: number, proportion: number }} SpeakerProportion */

export class DrawConversation {
  /**
   * @param {IgsP5} sketch
   * @param {DrawUtils} drawUtils
   */
  constructor(sketch, drawUtils) {
    this.sk = sketch
    this.drawUtils = drawUtils
    this.is3D = false
    this.translateZoom = 0
  }

  static clearHoverState() {
    clearHoveredConversation()
  }

  // --- Core drawing entry point ---

  /** @param {MergedPoint[]} mergedPoints */
  drawAllConversations(mergedPoints) {
    if (!drawState.config.showConversationRects) return

    this.is3D = this.sk.handle3D.getIs3DMode()
    if (this.is3D) {
      this.translateZoom = Math.abs(this.sk.handle3D.getCurTranslatePos().zoom)
    }

    const state = timelineV2Store.getState()
    const dataRange = state.dataEnd - state.dataStart
    const viewRange = state.viewEnd - state.viewStart
    const zoomLevel = dataRange > 0 ? viewRange / dataRange : 1
    zoomLevel > 0.3 ? this.drawAggregated(mergedPoints) : this.drawDetailed(mergedPoints)
  }

  // --- Detailed view (zoomed in) ---

  /** @param {MergedPoint[]} mergedPoints */
  drawDetailed(mergedPoints) {
    for (const { point, speaker, color } of mergedPoints) {
      if (!this.isValidPoint(point)) continue

      const pos = this.drawUtils.getScaledConversationPos(point)
      if (!this.drawUtils.isVisible(point, pos, point.stopLength)) continue

      const time = point.time ?? 0
      const jitterX = ((time * 7) % JITTER_AMOUNT) - JITTER_AMOUNT / 2
      const jitterY = ((time * 13) % JITTER_AMOUNT) - JITTER_AMOUNT / 2
      const fpX = pos.floorPlanXPos + jitterX
      const fpY = pos.adjustYPos + jitterY
      const fillColor = drawState.config.isPathColorMode
        ? this.drawUtils.setCodeColor(point.codes)
        : color

      this.setFill(fillColor)

      if (this.is3D) {
        this.sk.rect(fpX, fpY, -drawState.config.conversationRectWidth, -pos.rectHeight)
        this.drawQuad3D(pos.selTimelineXPos, pos.rectWidth, pos.rectHeight, fpX, fpY)
      } else {
        const isHovered =
          this.sk.overRect(fpX, fpY, drawState.config.conversationRectWidth, pos.rectHeight) ||
          this.sk.overRect(pos.selTimelineXPos, pos.adjustYPos, pos.rectWidth, pos.rectHeight)
        if (isHovered) {
          this.setHoverStroke()
          setHoveredConversation(
            [{ time, speaker, text: point.speech, color }],
            this.sk.winMouseX,
            this.sk.winMouseY
          )
        }
        this.sk.rect(fpX, fpY, drawState.config.conversationRectWidth, pos.rectHeight)
        this.sk.rect(pos.selTimelineXPos, pos.adjustYPos, pos.rectWidth, pos.rectHeight)
      }
    }
  }

  // --- Aggregated view (zoomed out) ---

  /** @param {MergedPoint[]} mergedPoints */
  drawAggregated(mergedPoints) {
    // Compute combined clusters with text lengths (used for max calculation and possibly drawing)
    const combinedStats = this.clusterPoints(mergedPoints, true).map((cluster) => ({
      cluster,
      textLength: cluster.reduce((sum, p) => sum + p.point.speech.length, 0),
    }))
    const maxTextLength = Math.max(...combinedStats.map((c) => c.textLength), MIN_TEXT_FOR_SCALING)

    // Use combined clusters if stripes enabled, otherwise re-cluster with speaker breaks
    const clusterStats = drawState.config.showSpeakerStripes
      ? combinedStats
      : this.clusterPoints(mergedPoints, false).map((cluster) => ({
          cluster,
          textLength: cluster.reduce((sum, p) => sum + p.point.speech.length, 0),
        }))

    for (const { cluster, textLength } of clusterStats) {
      const first = cluster[0],
        last = cluster[cluster.length - 1]
      const pos = this.drawUtils.getScaledConversationPos(first.point)
      if (!this.drawUtils.isVisible(first.point, pos, first.point.stopLength)) continue

      const endPos = this.drawUtils.getScaledConversationPos(last.point)
      const size = this.sk.map(textLength, 0, maxTextLength, MIN_RECT_SIZE, MAX_RECT_SIZE)
      const width = Math.max(10, Math.abs(endPos.selTimelineXPos - pos.selTimelineXPos))

      const fpX = pos.floorPlanXPos - size / 2
      const fpY = drawState.config.alignToggle ? 0 : pos.floorPlanYPos - size - RECT_GAP
      const speakerProportions =
        drawState.config.showSpeakerStripes && !drawState.config.isPathColorMode
          ? this.getSpeakerProportions(cluster)
          : null
      const primaryColor = this.getPrimaryColor(first, speakerProportions)

      this.sk.noStroke()

      if (this.is3D) {
        this.drawAggregated3D(pos, size, width, speakerProportions, primaryColor)
      } else {
        this.drawAggregated2D(cluster, pos, fpX, fpY, size, width, speakerProportions, primaryColor)
      }
    }
  }

  /**
   * @param {ConversationPos} pos
   * @param {number} size
   * @param {number} width
   * @param {SpeakerProportion[] | null} speakerProportions
   * @param {string} primaryColor
   */
  drawAggregated3D(pos, size, width, speakerProportions, primaryColor) {
    const yPos = drawState.config.alignToggle
      ? this.sk.gui.fpContainer.getContainer().height
      : pos.floorPlanYPos - RECT_GAP
    const fpX3D = pos.floorPlanXPos + size / 2
    const stFpX = pos.floorPlanXPos + TAIL_WIDTH / 2

    if (speakerProportions) {
      this.drawStripedRect3D(fpX3D, yPos, size, size, speakerProportions)
      this.drawStripedQuad3D(
        pos.selTimelineXPos,
        width,
        size,
        stFpX,
        pos.floorPlanYPos,
        speakerProportions
      )
    } else {
      this.setFill(primaryColor)
      this.sk.rect(fpX3D, yPos, -size, -size)
      this.drawQuad3D(pos.selTimelineXPos, width, size, stFpX, pos.floorPlanYPos)
    }

    // Tails
    this.setFill(primaryColor)
    this.sk.triangle(
      pos.floorPlanXPos - TAIL_WIDTH / 2,
      yPos,
      pos.floorPlanXPos + TAIL_WIDTH / 2,
      yPos,
      pos.floorPlanXPos,
      yPos + TAIL_HEIGHT
    )
    this.drawTail3D(pos.selTimelineXPos, stFpX, pos.floorPlanYPos)
  }

  /**
   * @param {Cluster} cluster
   * @param {ConversationPos} pos
   * @param {number} fpX
   * @param {number} fpY
   * @param {number} size
   * @param {number} width
   * @param {SpeakerProportion[] | null} speakerProportions
   * @param {string} primaryColor
   */
  drawAggregated2D(cluster, pos, fpX, fpY, size, width, speakerProportions, primaryColor) {
    const isHovered =
      this.sk.overRect(fpX, fpY, size, size) ||
      this.sk.overRect(pos.selTimelineXPos, fpY, width, size)

    if (isHovered) {
      setHoveredConversation(
        cluster.map((p) => ({
          time: p.point.time ?? 0,
          speaker: p.speaker,
          text: p.point.speech,
          color: p.color,
        })),
        this.sk.winMouseX,
        this.sk.winMouseY
      )
    }

    if (speakerProportions) {
      this.drawStripedRect(fpX, fpY, size, size, speakerProportions, isHovered)
      this.drawStripedRect(pos.selTimelineXPos, fpY, width, size, speakerProportions, isHovered)
    } else {
      this.setFill(primaryColor)
      if (isHovered) this.setHoverStroke()
      this.sk.rect(fpX, fpY, size, size)
      this.sk.rect(pos.selTimelineXPos, fpY, width, size)
    }

    // Tails
    if (isHovered) {
      this.setHoverStroke()
    } else {
      this.sk.noStroke()
    }
    this.setFill(primaryColor, false)
    const tailY = fpY + size
    const tailCenterX = fpX + size / 2
    this.sk.triangle(
      tailCenterX - TAIL_WIDTH / 2,
      tailY,
      tailCenterX + TAIL_WIDTH / 2,
      tailY,
      tailCenterX,
      tailY + TAIL_HEIGHT
    )
    this.sk.triangle(
      pos.selTimelineXPos,
      tailY,
      pos.selTimelineXPos + TAIL_WIDTH,
      tailY,
      pos.selTimelineXPos,
      tailY + TAIL_HEIGHT
    )
  }

  // --- Striped drawing methods ---

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   * @param {SpeakerProportion[]} speakerProportions
   * @param {boolean} isHovered
   */
  drawStripedRect(x, y, width, height, speakerProportions, isHovered) {
    // Draw stripes without stroke
    let currentX = x
    for (const sp of speakerProportions) {
      const stripeWidth = width * sp.proportion
      this.setFill(sp.color)
      this.sk.rect(currentX, y, stripeWidth, height)
      currentX += stripeWidth
    }
    // Draw single outline around entire rect if hovered
    if (isHovered) {
      this.sk.noFill()
      this.setHoverStroke()
      this.sk.rect(x, y, width, height)
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   * @param {SpeakerProportion[]} speakerProportions
   */
  drawStripedRect3D(x, y, width, height, speakerProportions) {
    let currentX = x
    for (const sp of speakerProportions) {
      const stripeWidth = width * sp.proportion
      this.setFill(sp.color)
      this.sk.rect(currentX, y, -stripeWidth, -height)
      currentX -= stripeWidth
    }
  }

  /**
   * @param {number} xPos
   * @param {number} width
   * @param {number} height
   * @param {number} fpX
   * @param {number} fpY
   * @param {SpeakerProportion[]} speakerProportions
   */
  drawStripedQuad3D(xPos, width, height, fpX, fpY, speakerProportions) {
    const z = this.translateZoom
    let currentXPos = xPos

    for (const sp of speakerProportions) {
      const stripeWidth = width * sp.proportion
      this.setFill(sp.color)

      if (drawState.config.alignToggle) {
        this.sk.quad(
          0,
          z,
          currentXPos,
          height,
          z,
          currentXPos,
          height,
          z,
          currentXPos + stripeWidth,
          0,
          z,
          currentXPos + stripeWidth
        )
      } else {
        this.sk.quad(
          fpX,
          fpY,
          currentXPos,
          fpX + height,
          fpY,
          currentXPos,
          fpX + height,
          fpY,
          currentXPos + stripeWidth,
          fpX,
          fpY,
          currentXPos + stripeWidth
        )
      }
      currentXPos += stripeWidth
    }
  }

  // --- 3D primitives ---

  /**
   * @param {number} xPos
   * @param {number} width
   * @param {number} height
   * @param {number} fpX
   * @param {number} fpY
   */
  drawQuad3D(xPos, width, height, fpX, fpY) {
    const z = this.translateZoom
    if (drawState.config.alignToggle) {
      this.sk.quad(0, z, xPos, height, z, xPos, height, z, xPos + width, 0, z, xPos + width)
    } else {
      this.sk.quad(
        fpX,
        fpY,
        xPos,
        fpX + height,
        fpY,
        xPos,
        fpX + height,
        fpY,
        xPos + width,
        fpX,
        fpY,
        xPos + width
      )
    }
  }

  /**
   * @param {number} xPos
   * @param {number} fpX
   * @param {number} fpY
   */
  drawTail3D(xPos, fpX, fpY) {
    const z = this.translateZoom
    this.sk.beginShape()
    if (drawState.config.alignToggle) {
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

  // --- Clustering ---

  /**
   * @param {MergedPoint[]} mergedPoints
   * @param {boolean} [forceCombineMode]
   * @returns {Cluster[]}
   */
  clusterPoints(mergedPoints, forceCombineMode = drawState.config.showSpeakerStripes) {
    /** @type {Cluster[]} */
    const clusters = []
    /** @type {Cluster} */
    let current = []
    /** @type {DataPoint | null} */
    let lastPoint = null
    /** @type {string | null} */
    let lastSpeaker = null
    const spaceThresholdSq =
      drawState.config.clusterSpaceThreshold * drawState.config.clusterSpaceThreshold

    for (const item of mergedPoints) {
      if (!this.isValidPoint(item.point)) continue

      if (!current.length || !lastPoint) {
        current.push(item)
      } else {
        const dx = (item.point.x ?? 0) - (lastPoint.x ?? 0)
        const dy = (item.point.y ?? 0) - (lastPoint.y ?? 0)
        const shouldBreak =
          (!forceCombineMode && item.speaker !== lastSpeaker) ||
          (item.point.time ?? 0) - (lastPoint.time ?? 0) > drawState.config.clusterTimeThreshold ||
          dx * dx + dy * dy > spaceThresholdSq

        if (shouldBreak) {
          clusters.push(current)
          current = [item]
        } else {
          current.push(item)
        }
      }
      lastPoint = item.point
      lastSpeaker = item.speaker
    }
    if (current.length) clusters.push(current)
    return clusters
  }

  /**
   * @param {Cluster} cluster
   * @returns {SpeakerProportion[]}
   */
  getSpeakerProportions(cluster) {
    const stats = new Map()
    let total = 0

    for (const { point, speaker, color } of cluster) {
      const len = point.speech.length
      total += len
      const existing = stats.get(speaker)
      if (existing) {
        existing.textLength += len
      } else {
        stats.set(speaker, { speaker, color, textLength: len })
      }
    }

    return Array.from(stats.values())
      .map((s) => ({ ...s, proportion: s.textLength / total }))
      .sort((a, b) => b.textLength - a.textLength)
  }

  // --- Helpers ---

  /** @param {DataPoint} point */
  isValidPoint(point) {
    return point.speech && (!drawState.searchRegex || drawState.searchRegex.test(point.speech))
  }

  /**
   * @param {MergedPoint} first
   * @param {SpeakerProportion[] | null} speakerProportions
   */
  getPrimaryColor(first, speakerProportions) {
    if (drawState.config.isPathColorMode) return this.drawUtils.setCodeColor(first.point.codes)
    return speakerProportions ? speakerProportions[0].color : first.color
  }

  /**
   * @param {string} color
   * @param {boolean} [clearStroke]
   */
  setFill(color, clearStroke = true) {
    if (clearStroke) this.sk.noStroke()
    this.sk.fill(this.sk.red(color), this.sk.green(color), this.sk.blue(color), RECT_ALPHA)
  }

  setHoverStroke() {
    this.sk.stroke(0)
    this.sk.strokeWeight(3)
  }
}
