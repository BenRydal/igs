import ConfigStore from '../../stores/configStore'
import { timelineV2Store } from '../timeline/store'
import VideoStore from '../../stores/videoStore'
import PlaybackStore from '../../stores/playbackStore'

let maxStopLength, isPathColorMode, movementStrokeWeight, stopStrokeWeight
let circleToggle, sliceToggle, movementToggle, stopsToggle, highlightToggle

ConfigStore.subscribe((data) => {
  maxStopLength = data.maxStopLength
  isPathColorMode = data.isPathColorMode
  movementStrokeWeight = data.movementStrokeWeight
  stopStrokeWeight = data.stopStrokeWeight
  circleToggle = data.circleToggle
  sliceToggle = data.sliceToggle
  movementToggle = data.movementToggle
  stopsToggle = data.stopsToggle
  highlightToggle = data.highlightToggle
})

let videoCurrentTime = 0
let playbackMode = 'stopped'

VideoStore.subscribe((data) => {
  videoCurrentTime = data.currentTime
})

PlaybackStore.subscribe((data) => {
  playbackMode = data.mode
})

export class DrawMovement {
  // Static constants
  static LARGEST_STOP_PIXEL_SIZE = 50
  // Minimum pixel distance between rendered vertices (skip closer points)
  // Higher values = fewer vertices = better performance, but less detail when zoomed in
  // 8 pixels provides good balance - visually indistinguishable from full detail at typical zoom
  static MIN_PIXEL_DISTANCE = 8

  constructor(sketch, drawUtils) {
    this.sk = sketch
    this.drawUtils = drawUtils
    this.dot = null
    this.shade = null
  }

  setData(user) {
    this.dot = null
    this.sk.noFill()
    this.shade = user.color
    this.setDraw(user.dataTrail)
    if (this.dot !== null) this.drawDot(this.dot)
  }

  // Check if we can use fast path (skip ALL visibility checks)
  canUseFastPath(state) {
    const isFullTimeline = state.viewStart <= state.dataStart && state.viewEnd >= state.dataEnd
    const notAnimating = playbackMode === 'stopped'
    const noSpecialModes = !circleToggle && !sliceToggle && !highlightToggle && !movementToggle && !stopsToggle
    return isFullTimeline && notAnimating && noSpecialModes
  }

  // Check if we can use medium path (time-based filtering only, still batched)
  canUseMediumPath() {
    // Medium path works when only time-based filtering is needed (no spatial checks)
    const noSpatialModes = !circleToggle && !sliceToggle && !highlightToggle
    const noTypeFilters = !movementToggle && !stopsToggle
    return noSpatialModes && noTypeFilters
  }

  // Binary search to find first index where time >= targetTime
  findTimeIndex(dataTrail, targetTime, findFirst = true) {
    let low = 0
    let high = dataTrail.length - 1
    let result = findFirst ? dataTrail.length : -1

    while (low <= high) {
      const mid = (low + high) >>> 1
      const midTime = dataTrail[mid].time

      if (findFirst) {
        if (midTime >= targetTime) {
          result = mid
          high = mid - 1
        } else {
          low = mid + 1
        }
      } else {
        // Find last index where time <= targetTime
        if (midTime <= targetTime) {
          result = mid
          low = mid + 1
        } else {
          high = mid - 1
        }
      }
    }
    return result
  }

  // Get visible time range based on current state
  getVisibleTimeRange(state) {
    let startTime = state.viewStart
    let endTime = state.viewEnd

    // If animating, cap at current playback time
    if (playbackMode !== 'stopped') {
      endTime = Math.min(endTime, state.currentTime)
    }

    return { startTime, endTime }
  }

  setDraw(dataTrail) {
    if (dataTrail.length === 0) return

    this.sk.strokeCap(this.sk.SQUARE)

    // Get visible time range from timeline store
    const state = timelineV2Store.getState()

    if (this.canUseFastPath(state)) {
      // FAST PATH: Draw everything, no visibility checks
      this.drawBatched(dataTrail, 0, dataTrail.length - 1)
    } else if (this.canUseMediumPath()) {
      // MEDIUM PATH: Use binary search to find visible range, then batch
      const { startTime, endTime } = this.getVisibleTimeRange(state)
      const startIdx = this.findTimeIndex(dataTrail, startTime, true)
      const endIdx = this.findTimeIndex(dataTrail, endTime, false)

      if (startIdx <= endIdx && startIdx < dataTrail.length && endIdx >= 0) {
        this.drawBatched(dataTrail, startIdx, endIdx)
      }
    } else {
      // SLOW PATH: Per-point visibility checks (spatial modes active)
      for (let i = 0; i < dataTrail.length; i++) {
        const point = dataTrail[i]
        const aug = this.getAugmentedPoint(this.sk.PLAN, point)

        if (this.drawUtils.isVisible(aug.point, aug.pos, aug.point.stopLength)) {
          const segmentEnd = this.findSegmentEnd(dataTrail, i)
          this.setLineStyles(point.stopLength, point.codes)
          this.drawSegment(this.sk.SPACETIME, dataTrail, i, segmentEnd)
          if (this.drawUtils.isStopped(point.stopLength)) {
            this.drawStopCircle(aug)
          } else {
            this.drawSegment(this.sk.PLAN, dataTrail, i, segmentEnd)
          }
          i = segmentEnd
        }
      }
    }
  }

  // Batched drawing for fast and medium paths
  drawBatched(dataTrail, startIdx, endIdx) {
    const segments = this.computeSegmentsInRange(dataTrail, startIdx, endIdx)

    if (!isPathColorMode) {
      // Single color mode: batch all segments by type
      this.sk.stroke(this.shade)

      // Draw moving segments to SPACETIME
      this.sk.strokeWeight(movementStrokeWeight)
      this.sk.beginShape(this.sk.LINES)
      for (const seg of segments) {
        if (!seg.isStopped) {
          this.drawSegmentVerticesAsLines(this.sk.SPACETIME, dataTrail, seg.start, seg.end)
        }
      }
      this.sk.endShape()

      // Draw stopped segments to SPACETIME
      this.sk.strokeWeight(stopStrokeWeight)
      this.sk.beginShape(this.sk.LINES)
      for (const seg of segments) {
        if (seg.isStopped) {
          this.drawSegmentVerticesAsLines(this.sk.SPACETIME, dataTrail, seg.start, seg.end)
        }
      }
      this.sk.endShape()

      // Draw moving segments to PLAN
      this.sk.strokeWeight(movementStrokeWeight)
      this.sk.beginShape(this.sk.LINES)
      for (const seg of segments) {
        if (!seg.isStopped) {
          this.drawSegmentVerticesAsLines(this.sk.PLAN, dataTrail, seg.start, seg.end)
        }
      }
      this.sk.endShape()

      // Draw stop circles on floor plan
      this.sk.strokeWeight(stopStrokeWeight)
      for (const seg of segments) {
        if (seg.isStopped) {
          const aug = this.getAugmentedPoint(this.sk.PLAN, dataTrail[seg.start])
          this.drawStopCircle(aug)
        }
      }
    } else {
      // Path color mode: separate shapes per segment for different colors
      for (const seg of segments) {
        this.setLineStyles(dataTrail[seg.start].stopLength, seg.codes)
        this.drawSegment(this.sk.SPACETIME, dataTrail, seg.start, seg.end)

        if (seg.isStopped) {
          const aug = this.getAugmentedPoint(this.sk.PLAN, dataTrail[seg.start])
          this.drawStopCircle(aug)
        } else {
          this.drawSegment(this.sk.PLAN, dataTrail, seg.start, seg.end)
        }
      }
    }
  }

  // Compute segments within a specific index range
  computeSegmentsInRange(dataTrail, startIdx, endIdx) {
    if (startIdx > endIdx) return []

    const segments = []
    let segStart = startIdx

    for (let i = startIdx + 1; i <= endIdx; i++) {
      const prevPoint = dataTrail[i - 1]
      const currPoint = dataTrail[i]

      const prevStopped = this.drawUtils.isStopped(prevPoint.stopLength)
      const currStopped = this.drawUtils.isStopped(currPoint.stopLength)

      if (prevStopped !== currStopped || !this.codesEqual(prevPoint.codes, currPoint.codes)) {
        segments.push({
          start: segStart,
          end: i - 1,
          isStopped: prevStopped,
          codes: prevPoint.codes
        })
        segStart = i
      }
    }

    // Add final segment
    const lastPoint = dataTrail[endIdx]
    segments.push({
      start: segStart,
      end: endIdx,
      isStopped: this.drawUtils.isStopped(lastPoint.stopLength),
      codes: lastPoint.codes
    })

    return segments
  }

  // Fast array comparison - avoids JSON.stringify overhead
  codesEqual(codes1, codes2) {
    if (!codes1 || !codes2) return codes1 === codes2
    if (codes1.length !== codes2.length) return false
    for (let i = 0; i < codes1.length; i++) {
      if (codes1[i] !== codes2[i]) return false
    }
    return true
  }

  // Find the end of the segment where stopLength, codes, or visibility changes
  findSegmentEnd(dataTrail, start) {
    const startPoint = dataTrail[start]
    const startStopped = this.drawUtils.isStopped(startPoint.stopLength)

    for (let i = start + 1; i < dataTrail.length; i++) {
      const currentPoint = dataTrail[i]
      const augmentedPoint = this.getAugmentedPoint(this.sk.PLAN, currentPoint)

      const stoppedChanged = this.drawUtils.isStopped(currentPoint.stopLength) !== startStopped
      const codesChanged = !this.codesEqual(currentPoint.codes, startPoint.codes)
      const notVisible = !this.drawUtils.isVisible(
        augmentedPoint.point,
        augmentedPoint.pos,
        augmentedPoint.point.stopLength
      )

      if (stoppedChanged || codesChanged || notVisible) {
        return i - 1
      }
    }
    return dataTrail.length - 1
  }

  // Draw segment vertices as LINES pairs (for batched drawing)
  // LINES mode draws separate line segments between each pair of vertices
  drawSegmentVerticesAsLines(view, dataTrail, start, end) {
    const minDistSq = DrawMovement.MIN_PIXEL_DISTANCE * DrawMovement.MIN_PIXEL_DISTANCE
    let lastX = -Infinity, lastY = -Infinity, lastZ = -Infinity
    let prevX, prevY, prevZ
    let hasPrev = false

    for (let i = start; i <= end; i++) {
      const point = dataTrail[i]
      const aug = this.getAugmentedPoint(view, point)
      const x = aug.pos.viewXPos
      const y = aug.pos.floorPlanYPos
      const z = aug.pos.zPos

      if (view === this.sk.SPACETIME) this.recordDot(aug)

      // Apply decimation
      const dx = x - lastX
      const dy = y - lastY
      const dz = z - lastZ
      const distSq = dx * dx + dy * dy + dz * dz

      const isFirstOrLast = i === start || i === end
      if (isFirstOrLast || distSq >= minDistSq) {
        if (hasPrev) {
          // Output line segment from prev to current
          this.sk.vertex(prevX, prevY, prevZ)
          this.sk.vertex(x, y, z)
        }
        prevX = x
        prevY = y
        prevZ = z
        hasPrev = true
        lastX = x
        lastY = y
        lastZ = z
      }
    }
  }

  drawSegment(view, dataTrail, start, end) {
    this.sk.beginShape(this.sk.LINES)
    this.drawSegmentVerticesAsLines(view, dataTrail, start, end)
    this.sk.endShape()
  }

  getAugmentedPoint(view, point) {
    return this.drawUtils.createAugmentPoint(view, point, point.time)
  }

  drawStopCircle(augmentedPoint) {
    this.sk.noStroke()
    this.setFill(this.drawUtils.setCodeColor(augmentedPoint.point.codes))
    const stopSize = this.sk.map(
      augmentedPoint.point.stopLength,
      0,
      maxStopLength,
      5,
      DrawMovement.LARGEST_STOP_PIXEL_SIZE
    )
    this.sk.circle(augmentedPoint.pos.viewXPos, augmentedPoint.pos.floorPlanYPos, stopSize)
    this.sk.noFill()
  }

  setLineStyles(stopLength, codes) {
    this.setStroke(this.drawUtils.setCodeColor(codes))
    if (this.drawUtils.isStopped(stopLength)) {
      this.sk.strokeWeight(stopStrokeWeight)
    } else {
      this.sk.strokeWeight(movementStrokeWeight)
    }
  }

  setFill(color) {
    if (!isPathColorMode) this.sk.fill(this.shade)
    else this.sk.fill(color)
  }

  setStroke(color) {
    if (!isPathColorMode) this.sk.stroke(this.shade)
    else this.sk.stroke(color)
  }

  getNewDot(augmentedPoint, curDot) {
    const [xPos, yPos, zPos, timePos, map3DMouse, codeColor] = this.getDotValues(augmentedPoint)

    // When playing, always show dot at current playback position (not mouse position)
    if (playbackMode === 'playing-animation') {
      return this.createDot(xPos, yPos, zPos, timePos, codeColor, null)
    }
    if (playbackMode === 'playing-video') {
      const videoSelectTime = this.getVideoSelectTime()
      if (this.compareToCurDot(videoSelectTime, timePos, curDot)) {
        return this.createDot(
          xPos,
          yPos,
          zPos,
          timePos,
          codeColor,
          Math.abs(videoSelectTime - timePos)
        )
      }
      return null
    }
    // When stopped, show dot at mouse position if hovering over timeline
    if (this.isMouseOverTimelineAndValid(map3DMouse, timePos, curDot)) {
      return this.createDot(xPos, yPos, zPos, map3DMouse, codeColor, Math.abs(map3DMouse - timePos))
    }
    return null
  }

  getDotValues(augmentedPoint) {
    return [
      augmentedPoint.pos.floorPlanXPos,
      augmentedPoint.pos.floorPlanYPos,
      augmentedPoint.pos.zPos,
      augmentedPoint.pos.selTimelineXPos,
      this.sk.mapToSelectTimeThenPixelTime(this.sk.winMouseX),
      this.drawUtils.setCodeColor(augmentedPoint.point.codes),
    ]
  }

  isMouseOverTimelineAndValid(map3DMouse, timePos, curDot) {
    return this.sk.isMouseOverTimeline() && this.compareToCurDot(map3DMouse, timePos, curDot)
  }

  getVideoSelectTime() {
    const videoPixelTime = timelineV2Store.timeToPixel(videoCurrentTime)
    return this.sk.mapSelectTimeToPixelTime(videoPixelTime)
  }

  compareToCurDot(pixelStart, pixelEnd, curDot) {
    let pixelAmountToCompare = this.sk.width // if dot has not been set yet, compare to this width
    if (curDot !== null) pixelAmountToCompare = curDot.lengthToCompare
    return (
      pixelStart >= pixelEnd - pixelAmountToCompare && pixelStart <= pixelEnd + pixelAmountToCompare
    )
  }

  createDot(xPos, yPos, zPos, timePos, color, lengthToCompare) {
    return { xPos, yPos, zPos, timePos, color, lengthToCompare }
  }

  drawDot(curDot) {
    const dotSize = this.sk.width / 50
    this.drawFloorPlanDot(curDot, dotSize)
    if (this.sk.handle3D.getIs3DMode()) this.draw3DSpaceTimeDot(curDot)
    else this.sk.circle(curDot.timePos, curDot.yPos, dotSize)
  }

  drawFloorPlanDot(curDot, dotSize) {
    this.sk.stroke(0)
    this.sk.strokeWeight(5)
    this.setFill(curDot.color)
    this.sk.circle(curDot.xPos, curDot.yPos, dotSize)
  }

  draw3DSpaceTimeDot(curDot) {
    this.sk.strokeWeight(25)
    this.setStroke(curDot.color)
    this.sk.point(curDot.xPos, curDot.yPos, curDot.zPos)
    this.sk.strokeWeight(2)
    this.sk.line(curDot.xPos, curDot.yPos, 0, curDot.xPos, curDot.yPos, curDot.zPos)
  }

  recordDot(augmentPoint) {
    const newDot = this.getNewDot(augmentPoint, this.dot)
    if (newDot !== null) {
      this.dot = newDot
    }
  }
}
