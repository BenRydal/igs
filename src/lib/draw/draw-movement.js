import { get } from 'svelte/store'
import ConfigStore from '../../stores/configStore'
import CodeStore from '../../stores/codeStore'
import { timelineV2Store } from '../timeline/store'
import VideoStore from '../../stores/videoStore'
import PlaybackStore from '../../stores/playbackStore'

// ============================================================
// MODULE STATE (subscribed from stores)
// ============================================================

// Config: rendering settings
let maxStopLength, isPathColorMode, movementStrokeWeight, stopStrokeWeight
// Config: spatial mode toggles
let circleToggle, sliceToggle, movementToggle, stopsToggle, highlightToggle
// Playback state
let videoCurrentTime = 0
let playbackMode = 'stopped'

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
  static MIN_PIXEL_DISTANCE_SQ = 8 * 8 // Minimum pixel distance squared for decimation

  constructor(sketch, drawUtils) {
    this.sk = sketch
    this.drawUtils = drawUtils
    this.dot = null
    this.shade = null
    // Cached code visibility state (updated once per frame in setData)
    this.enabledCodes = new Set()
    this.noCodesEnabled = true
  }

  setData(user) {
    this.dot = null
    this.sk.noFill()
    this.shade = user.color
    this.cacheEnabledCodes()
    this.setDraw(user.dataTrail)
    if (this.dot !== null) this.drawDot(this.dot)
  }

  // Cache enabled codes once per frame for O(1) lookups during segment filtering
  cacheEnabledCodes() {
    const codes = get(CodeStore)
    this.enabledCodes = new Set(codes.filter((c) => c.enabled).map((c) => c.code))
    // Match original behavior: if no "no codes" entry exists, default to showing segments without codes
    const noCodesEntry = codes.find((c) => c.code === 'no codes')
    this.noCodesEnabled = noCodesEntry ? noCodesEntry.enabled : true
  }

  // Check if a segment should be visible based on its codes
  isSegmentVisible(segmentCodes) {
    if (segmentCodes.length === 0) {
      return this.noCodesEnabled
    }
    return segmentCodes.some((code) => this.enabledCodes.has(code))
  }

  // ============================================================
  // PATH SELECTION
  // Determines which rendering path to use based on current state.
  // Fast path: no checks, Medium path: time filtering, Slow path: per-point visibility
  // ============================================================

  // Check if no spatial/type filters are active (allows batched drawing)
  // Note: code filtering is handled at segment level in drawBatched(), not here
  hasNoSpecialModes() {
    return !circleToggle && !sliceToggle && !highlightToggle && !movementToggle && !stopsToggle
  }

  // Check if we can use fast path (skip ALL visibility checks)
  canUseFastPath(state) {
    const isFullTimeline = state.viewStart <= state.dataStart && state.viewEnd >= state.dataEnd
    const notAnimating = playbackMode === 'stopped'
    return isFullTimeline && notAnimating && this.hasNoSpecialModes()
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
    const startTime = state.viewStart
    // If animating, cap at current playback time
    const endTime = playbackMode !== 'stopped'
      ? Math.min(state.viewEnd, state.currentTime)
      : state.viewEnd
    return { startTime, endTime }
  }

  // ============================================================
  // MAIN DRAW FLOW
  // Entry point that routes to fast/medium/slow rendering paths.
  // ============================================================

  setDraw(dataTrail) {
    if (dataTrail.length === 0) return

    this.sk.strokeCap(this.sk.SQUARE)

    // Get visible time range from timeline store
    const state = timelineV2Store.getState()

    if (this.canUseFastPath(state)) {
      // FAST PATH: Draw everything, no visibility checks
      this.drawBatched(dataTrail, 0, dataTrail.length - 1)
    } else if (this.hasNoSpecialModes()) {
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
          this.applySegmentStyle(point.stopLength, point.codes)
          this.drawSegment(this.sk.SPACETIME, dataTrail, i, segmentEnd)
          if (this.drawUtils.isStopped(point.stopLength)) {
            const segDuration = this.getSegmentDuration(dataTrail, i, segmentEnd)
            this.drawStopCircle(aug, segDuration)
          } else {
            this.drawSegment(this.sk.PLAN, dataTrail, i, segmentEnd)
          }

          // Draw connecting line to next segment if next point is visible
          this.drawConnectionIfVisible(this.sk.SPACETIME, dataTrail, segmentEnd, point.codes)
          this.drawConnectionIfVisible(this.sk.PLAN, dataTrail, segmentEnd, point.codes)

          i = segmentEnd
        }
      }
    }
  }

  // ============================================================
  // BATCHED DRAWING
  // High-performance rendering for fast/medium paths.
  // Minimizes draw calls by batching segments of the same type.
  // ============================================================

  // Batched drawing for fast and medium paths
  drawBatched(dataTrail, startIdx, endIdx) {
    const allSegments = this.computeSegmentsInRange(dataTrail, startIdx, endIdx)
    // Filter segments by code visibility (O(1) check per segment using cached enabled codes)
    const segments = allSegments.filter((seg) => this.isSegmentVisible(seg.codes))

    if (!isPathColorMode) {
      // Single color mode: batch all segments by type
      this.sk.stroke(this.shade)

      // Draw to SPACETIME: moving segments, then stopped segments
      this.drawBatchedSegments(this.sk.SPACETIME, dataTrail, segments, false, movementStrokeWeight)
      this.drawBatchedSegments(this.sk.SPACETIME, dataTrail, segments, true, stopStrokeWeight)

      // Draw to PLAN: moving segments as lines, stopped segments as circles
      this.drawBatchedSegments(this.sk.PLAN, dataTrail, segments, false, movementStrokeWeight)
      this.drawAllStopCircles(dataTrail, segments)
    } else {
      // Path color mode: separate shapes per segment for different colors
      // Pass 1: draw all spacetime segments + plan movement segments
      for (const seg of segments) {
        this.applySegmentStyle(dataTrail[seg.start].stopLength, seg.codes)
        this.drawSegment(this.sk.SPACETIME, dataTrail, seg.start, seg.end)

        if (!seg.isStopped) {
          this.drawSegment(this.sk.PLAN, dataTrail, seg.start, seg.end)
        }
      }
      // Pass 2: draw stop circles sorted largest-first for bullseye effect
      for (const seg of this.getStoppedSegmentsByDuration(dataTrail, segments)) {
        const aug = this.getAugmentedPoint(this.sk.PLAN, dataTrail[seg.start])
        this.drawStopCircle(aug, this.getSegmentDuration(dataTrail, seg.start, seg.end))
      }
    }

    // Draw connections to both views (shared by both modes)
    // Re-set stroke since drawStopCircle calls noStroke()
    if (!isPathColorMode) this.sk.stroke(this.shade)
    this.sk.strokeWeight(movementStrokeWeight)
    this.drawSegmentConnections(this.sk.SPACETIME, dataTrail, segments)
    this.drawSegmentConnections(this.sk.PLAN, dataTrail, segments)
  }

  // Draw all segments matching isStopped in a single batched draw call
  drawBatchedSegments(view, dataTrail, segments, isStopped, weight) {
    this.sk.strokeWeight(weight)
    this.sk.beginShape(this.sk.LINES)
    for (const seg of segments) {
      if (seg.isStopped === isStopped) {
        this.drawSegmentVerticesAsLines(view, dataTrail, seg.start, seg.end)
      }
    }
    this.sk.endShape()
  }

  // Get stopped segments sorted largest-first so overlapping stops
  // (code-split or same-location) render as bullseye pattern (big behind small)
  getStoppedSegmentsByDuration(dataTrail, segments) {
    const stopped = segments.filter((seg) => seg.isStopped)
    stopped.sort(
      (a, b) =>
        this.getSegmentDuration(dataTrail, b.start, b.end) -
        this.getSegmentDuration(dataTrail, a.start, a.end)
    )
    return stopped
  }

  // Draw stop circles for all stopped segments (single-color mode)
  drawAllStopCircles(dataTrail, segments) {
    for (const seg of this.getStoppedSegmentsByDuration(dataTrail, segments)) {
      const aug = this.getAugmentedPoint(this.sk.PLAN, dataTrail[seg.start])
      this.drawStopCircle(aug, this.getSegmentDuration(dataTrail, seg.start, seg.end))
    }
  }

  // Check if two segments are adjacent in the original data
  areSegmentsAdjacent(seg1, seg2) {
    return seg1.end + 1 === seg2.start
  }

  // Draw connecting lines between adjacent segments (prevents gaps at segment transitions)
  drawSegmentConnections(view, dataTrail, segments) {
    if (segments.length < 2) return

    if (!isPathColorMode) {
      // Single color mode: batch all connections in one draw call
      this.sk.beginShape(this.sk.LINES)
      for (let i = 0; i < segments.length - 1; i++) {
        if (this.areSegmentsAdjacent(segments[i], segments[i + 1])) {
          this.emitConnectionVertices(view, dataTrail, segments[i].end, segments[i + 1].start)
        }
      }
      this.sk.endShape()
    } else {
      // Path color mode: separate draw call per connection for different colors
      for (let i = 0; i < segments.length - 1; i++) {
        if (this.areSegmentsAdjacent(segments[i], segments[i + 1])) {
          this.setStroke(this.drawUtils.setCodeColor(segments[i].codes))
          this.sk.beginShape(this.sk.LINES)
          this.emitConnectionVertices(view, dataTrail, segments[i].end, segments[i + 1].start)
          this.sk.endShape()
        }
      }
    }
  }

  // Emit vertex pair for a connection line (used within beginShape/endShape)
  emitConnectionVertices(view, dataTrail, fromIdx, toIdx) {
    const fromAug = this.getAugmentedPoint(view, dataTrail[fromIdx])
    const toAug = this.getAugmentedPoint(view, dataTrail[toIdx])
    this.sk.vertex(fromAug.pos.viewXPos, fromAug.pos.floorPlanYPos, fromAug.pos.zPos)
    this.sk.vertex(toAug.pos.viewXPos, toAug.pos.floorPlanYPos, toAug.pos.zPos)
  }

  // Draw connection to next point if it exists and is visible (for slow path)
  drawConnectionIfVisible(view, dataTrail, segmentEnd, codes) {
    if (segmentEnd + 1 >= dataTrail.length) return

    const nextPoint = dataTrail[segmentEnd + 1]
    const nextAug = this.getAugmentedPoint(this.sk.PLAN, nextPoint)
    if (!this.drawUtils.isVisible(nextAug.point, nextAug.pos, nextAug.point.stopLength)) return

    this.sk.strokeWeight(movementStrokeWeight)
    this.setStroke(this.drawUtils.setCodeColor(codes))
    this.sk.beginShape(this.sk.LINES)
    this.emitConnectionVertices(view, dataTrail, segmentEnd, segmentEnd + 1)
    this.sk.endShape()
  }

  // ============================================================
  // SEGMENT COMPUTATION
  // Breaks data trail into segments based on stopped state and codes.
  // ============================================================

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

  // Get the time duration of a segment (for sizing stop circles by segment, not total stop)
  getSegmentDuration(dataTrail, startIdx, endIdx) {
    return (dataTrail[endIdx].time ?? 0) - (dataTrail[startIdx].time ?? 0)
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

  // ============================================================
  // PRIMITIVE DRAWING
  // Low-level drawing operations for segments, vertices, and shapes.
  // ============================================================

  // Draw segment vertices as LINES pairs (for batched drawing)
  // LINES mode draws separate line segments between each pair of vertices
  drawSegmentVerticesAsLines(view, dataTrail, start, end) {
    let lastX = -Infinity, lastY = -Infinity, lastZ = -Infinity
    let prevX, prevY, prevZ
    let hasPrev = false

    for (let i = start; i <= end; i++) {
      const point = dataTrail[i]
      const aug = this.getAugmentedPoint(view, point)
      const x = aug.pos.viewXPos
      const y = aug.pos.floorPlanYPos
      const z = aug.pos.zPos

      // Side effect: record dot position for hover/playback indicator
      if (view === this.sk.SPACETIME) this.recordDot(aug)

      // Apply decimation
      const dx = x - lastX
      const dy = y - lastY
      const dz = z - lastZ
      const distSq = dx * dx + dy * dy + dz * dz

      const isFirstOrLast = i === start || i === end
      if (isFirstOrLast || distSq >= DrawMovement.MIN_PIXEL_DISTANCE_SQ) {
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

  drawStopCircle(augmentedPoint, duration = null) {
    this.sk.noStroke()
    this.setFill(this.drawUtils.setCodeColor(augmentedPoint.point.codes))
    const stopSize = this.sk.map(
      duration ?? augmentedPoint.point.stopLength,
      0, maxStopLength, 5, DrawMovement.LARGEST_STOP_PIXEL_SIZE
    )
    this.sk.circle(augmentedPoint.pos.viewXPos, augmentedPoint.pos.floorPlanYPos, stopSize)
    this.sk.noFill()
  }

  // ============================================================
  // STYLING
  // Stroke and fill management for path color mode.
  // ============================================================

  applySegmentStyle(stopLength, codes) {
    this.setStroke(this.drawUtils.setCodeColor(codes))
    this.sk.strokeWeight(this.drawUtils.isStopped(stopLength) ? stopStrokeWeight : movementStrokeWeight)
  }

  setFill(color) {
    if (!isPathColorMode) this.sk.fill(this.shade)
    else this.sk.fill(color)
  }

  setStroke(color) {
    if (!isPathColorMode) this.sk.stroke(this.shade)
    else this.sk.stroke(color)
  }

  // ============================================================
  // DOT RENDERING
  // Shows a dot on the path at the current playback position or mouse hover.
  // Note: recordDot() is called as a side effect from drawSegmentVerticesAsLines()
  // ============================================================

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
    const isOverTimeline = this.sk.isMouseOverTimeline() && this.compareToCurDot(map3DMouse, timePos, curDot)
    if (isOverTimeline) {
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

  getVideoSelectTime() {
    const videoPixelTime = timelineV2Store.timeToPixel(videoCurrentTime)
    return this.sk.mapSelectTimeToPixelTime(videoPixelTime)
  }

  compareToCurDot(pixelStart, pixelEnd, curDot) {
    const range = curDot !== null ? curDot.lengthToCompare : this.sk.width
    return pixelStart >= pixelEnd - range && pixelStart <= pixelEnd + range
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
      // During animation, only update if this point is at or after current dot's time
      // (needed because segments are drawn by type, not time order)
      if (playbackMode === 'playing-animation' && this.dot !== null && newDot.timePos < this.dot.timePos) {
        return
      }
      this.dot = newDot
    }
  }
}
