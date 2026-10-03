import { drawState } from './draw-state'
import { timelineV2Store } from '../timeline/store'
import { getPathLod, lowerBound } from './path-lod'

/** @typedef {import('../p5/igs-p5').IgsP5} IgsP5 */
/** @typedef {import('./draw-utils').DrawUtils} DrawUtils */
/** @typedef {import('./draw-utils').MovementPos} MovementPos */
/** @typedef {import('../../models/dataPoint').DataPoint} DataPoint */
/** @typedef {import('../../models/user').User} User */
/**
 * A run of consecutive points sharing stopped-state and codes.
 * @typedef {{ start: number, end: number, isStopped: boolean, codes: string[] }} Segment
 */
/** @typedef {{ point: DataPoint, pos: MovementPos }} AugPoint */
/**
 * Hover/playback indicator on the path.
 * @typedef {{ xPos: number, yPos: number, zPos: number, timePos: number, color: string }} Dot
 */
/** @typedef {import('../timeline/types').TimelineState} TimelineState */

export class DrawMovement {
  // Static constants
  static LARGEST_STOP_PIXEL_SIZE = 50
  // Minimum pixel distance between rendered vertices (skip closer points)
  // Higher values = fewer vertices = better performance, but less detail when zoomed in
  // 8 pixels provides good balance - visually indistinguishable from full detail at typical zoom
  static MIN_PIXEL_DISTANCE_SQ = 8 * 8 // Minimum pixel distance squared for decimation

  /**
   * @param {IgsP5} sketch
   * @param {DrawUtils} drawUtils
   */
  constructor(sketch, drawUtils) {
    this.sk = sketch
    this.drawUtils = drawUtils
    /** @type {Dot | null} */
    this.dot = null
    /** @type {string} */
    this.shade = ''
    // Cached code visibility state (updated once per frame in setData)
    this.enabledCodes = new Set()
    this.noCodesEnabled = true
    /**
     * Indices of this user's trail worth emitting vertices for, or null for all
     * of them. Set once per user per frame in setData.
     * @type {Int32Array | null}
     */
    this.lod = null
    // Running state for the screen-space decimator in emitVertexAt.
    this.runLastX = -Infinity
    this.runLastY = -Infinity
    this.runLastZ = -Infinity
    this.runPrevX = 0
    this.runPrevY = 0
    this.runPrevZ = 0
    this.runHasPrev = false
  }

  /** @param {User} user */
  setData(user) {
    this.dot = null
    this.sk.noFill()
    this.shade = user.color
    this.cacheEnabledCodes()
    this.lod = getPathLod(user, this.sourceEpsilon())
    this.setDraw(user.dataTrail)
    if (this.dot !== null) this.drawDot(this.dot)
  }

  /**
   * Converts the pathSimplification screen-pixel budget into the trail's own
   * coordinate units, which is what the reduction works in.
   *
   * Scaling can be anisotropic — with "preserve aspect ratio" off, x and y are
   * stretched independently — so dividing by the larger of the two factors keeps
   * the screen-space bound conservative on both axes.
   */
  sourceEpsilon() {
    const budget = drawState.config.pathSimplification
    if (budget <= 0) return 0

    const source = this.sk.floorPlan.getSourceDimensions()
    if (source === null) return 0

    const effective = this.sk.floorPlan.getEffectiveDimensions(
      this.sk.gui.fpContainer.getContainer()
    )
    const scale = Math.max(effective.width / source.width, effective.height / source.height)
    if (scale <= 0) return 0

    // Quantized so that pixel-level container changes cannot invalidate the
    // cached reduction, which is keyed on this value.
    return Math.round((budget / scale) * 100) / 100
  }

  // Cache enabled codes once per frame for O(1) lookups during segment filtering
  cacheEnabledCodes() {
    const codes = drawState.codes
    this.enabledCodes = new Set(codes.filter((c) => c.enabled).map((c) => c.code))
    // With no "no codes" entry present, segments carrying no codes are shown
    const noCodesEntry = codes.find((c) => c.code === 'no codes')
    this.noCodesEnabled = noCodesEntry ? noCodesEntry.enabled : true
  }

  // Check if a segment should be visible based on its codes
  /** @param {string[]} segmentCodes */
  isSegmentVisible(segmentCodes) {
    if (segmentCodes.length === 0) {
      return this.noCodesEnabled
    }
    return segmentCodes.some((code) => this.enabledCodes.has(code))
  }

  // Binary search to find first index where time >= targetTime
  /**
   * @param {DataPoint[]} dataTrail
   * @param {number} targetTime
   * @param {boolean} [findFirst]
   */
  findTimeIndex(dataTrail, targetTime, findFirst = true) {
    let low = 0
    let high = dataTrail.length - 1
    let result = findFirst ? dataTrail.length : -1

    while (low <= high) {
      const mid = (low + high) >>> 1
      const midTime = dataTrail[mid].time ?? 0

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
  /** @param {TimelineState} state */
  getVisibleTimeRange(state) {
    const startTime = state.viewStart
    // If animating, cap at current playback time
    const endTime =
      drawState.playbackMode !== 'stopped'
        ? Math.min(state.viewEnd, state.currentTime)
        : state.viewEnd
    return { startTime, endTime }
  }

  // ============================================================
  // MAIN DRAW FLOW
  // Entry point that resolves the active filters into a segment list and draws it.
  // ============================================================

  /**
   * One render path for every combination of filters.
   *
   * The three predicates in DrawUtils.isVisible have different *shapes*, and
   * exploiting that is what lets a single path serve all of them:
   *
   *  - Range: overAxis and isShowingInAnimation are both monotonic in time, so
   *    they reduce to two binary searches for an index range. (overAxis(t) holds
   *    exactly when t is inside [viewStart, viewEnd], because timeToPixel is
   *    monotonic.)
   *  - Segment: the code filter and movementToggle / stopsToggle depend only on
   *    codes and stopped-state, and computeSegmentsInRange already splits on a
   *    change in either, so one test per segment suffices.
   *  - Mask: only circleToggle, sliceToggle and highlightToggle genuinely need
   *    per-point geometry. These three are mutually exclusive with each other —
   *    they share selectToggleOptions, so toggleSelection clears the other two —
   *    but NOT with movementToggle / stopsToggle, which live in a separate
   *    filterToggleOptions group and can be on at the same time.
   *
   * A segment filter and a selector compose: switching on both movement-only and
   * the circle selector applies both, rather than one silently winning.
   *
   * The result is as cheap as the active filters allow, and a new interaction
   * has to declare which kind it is.
   *
   * @param {DataPoint[]} dataTrail
   */
  setDraw(dataTrail) {
    if (dataTrail.length === 0) return

    this.sk.strokeCap(this.sk.SQUARE)

    const range = this.resolveDrawRange(dataTrail, timelineV2Store.getState())
    if (range === null) return

    let segments = this.computeSegmentsInRange(dataTrail, range.startIdx, range.endIdx).filter(
      (segment) => this.isSegmentDrawn(segment)
    )

    const mask = this.activeMask()
    if (mask !== null) segments = this.subdivideByMask(dataTrail, segments, mask)

    if (segments.length === 0) return
    this.drawSegments(dataTrail, segments)
  }

  /**
   * Resolves the range predicates to an index range, or null if nothing is
   * drawn. A full view with playback stopped needs no search at all.
   *
   * @param {DataPoint[]} dataTrail
   * @param {TimelineState} state
   * @returns {{ startIdx: number, endIdx: number } | null}
   */
  resolveDrawRange(dataTrail, state) {
    const isFullView = state.viewStart <= state.dataStart && state.viewEnd >= state.dataEnd
    if (isFullView && drawState.playbackMode === 'stopped') {
      return { startIdx: 0, endIdx: dataTrail.length - 1 }
    }

    const { startTime, endTime } = this.getVisibleTimeRange(state)
    const startIdx = this.findTimeIndex(dataTrail, startTime, true)
    const endIdx = this.findTimeIndex(dataTrail, endTime, false)
    if (startIdx > endIdx || startIdx >= dataTrail.length || endIdx < 0) return null
    return { startIdx, endIdx }
  }

  /**
   * Segment-level filters: the code list, plus movement-only / stops-only.
   * Constant across a segment, because segments split wherever codes or
   * stopped-state change.
   *
   * @param {Segment} segment
   */
  isSegmentDrawn(segment) {
    if (!this.isSegmentVisible(segment.codes)) return false
    if (drawState.config.movementToggle) return !segment.isStopped
    if (drawState.config.stopsToggle) return segment.isStopped
    return true
  }

  /**
   * The active per-point spatial predicate, or null when none is.
   *
   * Mirrors DrawUtils.selectMode's geometry, including its 3D behaviour: the
   * circle and slice selectors are cursor-driven on the 2D floor plan and select
   * everything in 3D, while the highlight rectangles handle 3D themselves. It
   * deliberately does not reproduce selectMode's first-match-wins precedence
   * over the segment filters; see setDraw.
   *
   * @returns {((pos: MovementPos) => boolean) | null}
   */
  activeMask() {
    const is3D = this.sk.handle3D.getIs3DModeOrTransitioning()

    if (drawState.config.circleToggle) {
      if (is3D) return null
      return (pos) =>
        this.sk.gui.fpContainer.overCursor(
          pos.floorPlanXPos,
          pos.floorPlanYPos,
          pos.selTimelineXPos
        )
    }

    if (drawState.config.sliceToggle) {
      if (is3D) return null
      return (pos) => this.sk.gui.fpContainer.overSlicer(pos.floorPlanXPos, pos.selTimelineXPos)
    }

    if (drawState.config.highlightToggle) {
      return (pos) =>
        this.sk.gui.highlight.overHighlightArray(
          pos.floorPlanXPos,
          pos.floorPlanYPos,
          pos.timelineXPos
        )
    }

    return null
  }

  /**
   * Splits each segment into the runs of consecutive points passing the mask.
   *
   * Index contiguity within a run is what lets areSegmentsAdjacent draw the
   * connecting lines, and it is also why a run is emitted rather than a sparse
   * list of indices.
   *
   * @param {DataPoint[]} dataTrail
   * @param {Segment[]} segments
   * @param {(pos: MovementPos) => boolean} mask
   * @returns {Segment[]}
   */
  subdivideByMask(dataTrail, segments, mask) {
    /** @type {Segment[]} */
    const runs = []

    for (const segment of segments) {
      let runStart = -1
      for (let i = segment.start; i <= segment.end; i++) {
        // The mask only reads view-independent fields, so PLAN is arbitrary.
        if (mask(this.getAugmentedPoint(this.sk.PLAN, dataTrail[i]).pos)) {
          if (runStart === -1) runStart = i
        } else if (runStart !== -1) {
          runs.push({
            start: runStart,
            end: i - 1,
            isStopped: segment.isStopped,
            codes: segment.codes,
          })
          runStart = -1
        }
      }
      if (runStart !== -1) {
        runs.push({
          start: runStart,
          end: segment.end,
          isStopped: segment.isStopped,
          codes: segment.codes,
        })
      }
    }

    return runs
  }

  // ============================================================
  // BATCHED DRAWING
  // Minimizes draw calls by batching segments of the same type.
  // ============================================================

  /**
   * Draws an already-resolved, already-filtered segment list.
   *
   * Stop circles go through drawAllStopCircles for every filter combination, so
   * they are sorted largest-first and overlapping stops render as a bullseye
   * rather than a small stop hiding behind a larger one. Because every filter
   * combination reaches here, the selection views match the normal view.
   *
   * @param {DataPoint[]} dataTrail
   * @param {Segment[]} segments
   */
  drawSegments(dataTrail, segments) {
    if (!drawState.config.isPathColorMode) {
      // Single color mode: batch all segments by type
      this.sk.stroke(this.shade)

      // Draw to SPACETIME: moving segments, then stopped segments
      this.drawBatchedSegments(
        this.sk.SPACETIME,
        dataTrail,
        segments,
        false,
        drawState.config.movementStrokeWeight
      )
      this.drawBatchedSegments(
        this.sk.SPACETIME,
        dataTrail,
        segments,
        true,
        drawState.config.stopStrokeWeight
      )

      // Draw to PLAN: moving segments as lines, stopped segments as circles
      this.drawBatchedSegments(
        this.sk.PLAN,
        dataTrail,
        segments,
        false,
        drawState.config.movementStrokeWeight
      )
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
    if (!drawState.config.isPathColorMode) this.sk.stroke(this.shade)
    this.sk.strokeWeight(drawState.config.movementStrokeWeight)
    this.drawSegmentConnections(this.sk.SPACETIME, dataTrail, segments)
    this.drawSegmentConnections(this.sk.PLAN, dataTrail, segments)

    this.selectDot(dataTrail, segments)
  }

  // Draw all segments matching isStopped in a single batched draw call
  /**
   * @param {number} view
   * @param {DataPoint[]} dataTrail
   * @param {Segment[]} segments
   * @param {boolean} isStopped
   * @param {number} weight
   */
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
  /**
   * @param {DataPoint[]} dataTrail
   * @param {Segment[]} segments
   */
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
  /**
   * @param {DataPoint[]} dataTrail
   * @param {Segment[]} segments
   */
  drawAllStopCircles(dataTrail, segments) {
    for (const seg of this.getStoppedSegmentsByDuration(dataTrail, segments)) {
      const aug = this.getAugmentedPoint(this.sk.PLAN, dataTrail[seg.start])
      this.drawStopCircle(aug, this.getSegmentDuration(dataTrail, seg.start, seg.end))
    }
  }

  // Check if two segments are adjacent in the original data
  /**
   * @param {Segment} seg1
   * @param {Segment} seg2
   */
  areSegmentsAdjacent(seg1, seg2) {
    return seg1.end + 1 === seg2.start
  }

  // Draw connecting lines between adjacent segments (prevents gaps at segment transitions)
  /**
   * @param {number} view
   * @param {DataPoint[]} dataTrail
   * @param {Segment[]} segments
   */
  drawSegmentConnections(view, dataTrail, segments) {
    if (segments.length < 2) return

    if (!drawState.config.isPathColorMode) {
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
  /**
   * @param {number} view
   * @param {DataPoint[]} dataTrail
   * @param {number} fromIdx
   * @param {number} toIdx
   */
  emitConnectionVertices(view, dataTrail, fromIdx, toIdx) {
    const fromAug = this.getAugmentedPoint(view, dataTrail[fromIdx])
    const toAug = this.getAugmentedPoint(view, dataTrail[toIdx])
    this.sk.vertex(fromAug.pos.viewXPos, fromAug.pos.floorPlanYPos, fromAug.pos.zPos)
    this.sk.vertex(toAug.pos.viewXPos, toAug.pos.floorPlanYPos, toAug.pos.zPos)
  }

  // ============================================================
  // SEGMENT COMPUTATION
  // Breaks data trail into segments based on stopped state and codes.
  // ============================================================

  // Compute segments within a specific index range
  /**
   * @param {DataPoint[]} dataTrail
   * @param {number} startIdx
   * @param {number} endIdx
   * @returns {Segment[]}
   */
  computeSegmentsInRange(dataTrail, startIdx, endIdx) {
    if (startIdx > endIdx) return []

    /** @type {Segment[]} */
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
          codes: prevPoint.codes,
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
      codes: lastPoint.codes,
    })

    return segments
  }

  // Get the time duration of a segment (for sizing stop circles by segment, not total stop)
  /**
   * @param {DataPoint[]} dataTrail
   * @param {number} startIdx
   * @param {number} endIdx
   */
  getSegmentDuration(dataTrail, startIdx, endIdx) {
    return (dataTrail[endIdx].time ?? 0) - (dataTrail[startIdx].time ?? 0)
  }

  // Fast array comparison - avoids JSON.stringify overhead
  /**
   * @param {string[]} codes1
   * @param {string[]} codes2
   */
  codesEqual(codes1, codes2) {
    if (!codes1 || !codes2) return codes1 === codes2
    if (codes1.length !== codes2.length) return false
    for (let i = 0; i < codes1.length; i++) {
      if (codes1[i] !== codes2[i]) return false
    }
    return true
  }

  // ============================================================
  // PRIMITIVE DRAWING
  // Low-level drawing operations for segments, vertices, and shapes.
  // ============================================================

  // Draw segment vertices as LINES pairs (for batched drawing)
  // LINES mode draws separate line segments between each pair of vertices
  /**
   * @param {number} view
   * @param {DataPoint[]} dataTrail
   * @param {number} start
   * @param {number} end
   */
  drawSegmentVerticesAsLines(view, dataTrail, start, end) {
    this.resetVertexRun()

    // Without a reduction every point in the range is a candidate.
    if (this.lod === null) {
      for (let i = start; i <= end; i++) {
        this.emitVertexAt(view, dataTrail, i, i === start || i === end)
      }
      return
    }

    // A segment's own endpoints are always emitted, reduction or not, so
    // neighbouring segments still meet and drawSegmentConnections has something
    // to join. Between them only the reduction's indices are visited.
    this.emitVertexAt(view, dataTrail, start, true)
    for (let k = lowerBound(this.lod, start + 1); k < this.lod.length; k++) {
      const index = this.lod[k]
      if (index >= end) break
      this.emitVertexAt(view, dataTrail, index, false)
    }
    if (end > start) this.emitVertexAt(view, dataTrail, end, true)
  }

  /** Clears the decimator state before a run of vertices. */
  resetVertexRun() {
    this.runLastX = -Infinity
    this.runLastY = -Infinity
    this.runLastZ = -Infinity
    this.runPrevX = 0
    this.runPrevY = 0
    this.runPrevZ = 0
    this.runHasPrev = false
  }

  /**
   * Emits one point of a LINES run, applying screen-space decimation.
   *
   * This composes with the index reduction rather than duplicating it:
   * MIN_PIXEL_DISTANCE_SQ bounds the gap between vertices in *screen* pixels
   * after zoom, while the reduction bounds the path's deviation in *source*
   * units. Zooming out discards more; zooming in gets detail back.
   *
   * @param {number} view
   * @param {DataPoint[]} dataTrail
   * @param {number} index
   * @param {boolean} force emit regardless of the decimation threshold
   */
  emitVertexAt(view, dataTrail, index, force) {
    const aug = this.getAugmentedPoint(view, dataTrail[index])
    const x = aug.pos.viewXPos
    const y = aug.pos.floorPlanYPos
    const z = aug.pos.zPos

    if (!force) {
      const dx = x - this.runLastX
      const dy = y - this.runLastY
      const dz = z - this.runLastZ
      if (dx * dx + dy * dy + dz * dz < DrawMovement.MIN_PIXEL_DISTANCE_SQ) return
    }

    if (this.runHasPrev) {
      this.sk.vertex(this.runPrevX, this.runPrevY, this.runPrevZ)
      this.sk.vertex(x, y, z)
    }
    this.runPrevX = x
    this.runPrevY = y
    this.runPrevZ = z
    this.runHasPrev = true
    this.runLastX = x
    this.runLastY = y
    this.runLastZ = z
  }

  /**
   * @param {number} view
   * @param {DataPoint[]} dataTrail
   * @param {number} start
   * @param {number} end
   */
  drawSegment(view, dataTrail, start, end) {
    this.sk.beginShape(this.sk.LINES)
    this.drawSegmentVerticesAsLines(view, dataTrail, start, end)
    this.sk.endShape()
  }

  /**
   * @param {number} view
   * @param {DataPoint} point
   * @returns {AugPoint}
   */
  getAugmentedPoint(view, point) {
    return this.drawUtils.createAugmentPoint(view, point, point.time ?? 0)
  }

  /**
   * @param {AugPoint} augmentedPoint
   * @param {number | null} [duration]
   */
  drawStopCircle(augmentedPoint, duration = null) {
    this.sk.noStroke()
    this.setFill(this.drawUtils.setCodeColor(augmentedPoint.point.codes))
    const stopSize = this.sk.map(
      duration ?? augmentedPoint.point.stopLength,
      0,
      drawState.config.maxStopLength,
      5,
      DrawMovement.LARGEST_STOP_PIXEL_SIZE
    )
    this.sk.circle(augmentedPoint.pos.viewXPos, augmentedPoint.pos.floorPlanYPos, stopSize)
    this.sk.noFill()
  }

  // ============================================================
  // STYLING
  // Stroke and fill management for path color mode.
  // ============================================================

  /**
   * @param {number} stopLength
   * @param {string[]} codes
   */
  applySegmentStyle(stopLength, codes) {
    this.setStroke(this.drawUtils.setCodeColor(codes))
    this.sk.strokeWeight(
      this.drawUtils.isStopped(stopLength)
        ? drawState.config.stopStrokeWeight
        : drawState.config.movementStrokeWeight
    )
  }

  /** @param {string} color */
  setFill(color) {
    if (!drawState.config.isPathColorMode) this.sk.fill(this.shade)
    else this.sk.fill(color)
  }

  /** @param {string} color */
  setStroke(color) {
    if (!drawState.config.isPathColorMode) this.sk.stroke(this.shade)
    else this.sk.stroke(color)
  }

  // ============================================================
  // DOT RENDERING
  // Shows a dot on the path at the current playback position or mouse hover.
  // selectDot() is called once per user per frame, at the end of drawSegments,
  // with the segments that were drawn to SPACETIME.
  // ============================================================

  /**
   * Picks the hover/playback dot from the segments that were just drawn, in two
   * binary searches rather than a scan.
   *
   * Searching on times rather than projected pixels is exact because
   * `selTimelineXPos` is an affine,
   * monotonically increasing function of time (a chain of mapRange calls, minus
   * canvasLeft). Affine and increasing means order is preserved, so "latest in
   * pixels" is "latest in time", and |f(a) - f(t)| = s * |a - t| for a positive
   * slope s, so "nearest in pixels" is "nearest in time". That lets the search
   * run on times, which are already sorted, instead of on projected pixels.
   *
   * @param {DataPoint[]} dataTrail
   * @param {Segment[]} segments the segments actually drawn to SPACETIME
   */
  selectDot(dataTrail, segments) {
    if (segments.length === 0) return

    // While animating the dot sits at the playhead, which is the final point of
    // the final drawn segment: resolveDrawRange already caps the range at
    // currentTime.
    if (drawState.playbackMode === 'playing-animation') {
      const aug = this.getAugmentedPoint(
        this.sk.SPACETIME,
        dataTrail[segments[segments.length - 1].end]
      )
      const [xPos, yPos, zPos, timePos, , codeColor] = this.getDotValues(aug)
      this.dot = this.createDot(xPos, yPos, zPos, timePos, codeColor)
      return
    }

    // Both remaining modes snap to the drawn point nearest a target time.
    // Inverting the projection analytically avoids any pixel round-trip:
    // for video, timePos === target reduces to point.time === videoCurrentTime;
    // for hover it reduces to pixelToTime(pixelToViewPixel(winMouseX)).
    const isVideo = drawState.playbackMode === 'playing-video'
    if (!isVideo && !this.sk.isMouseOverTimeline()) return
    const targetTime = isVideo
      ? drawState.videoCurrentTime
      : timelineV2Store.pixelToTime(timelineV2Store.pixelToViewPixel(this.sk.winMouseX))

    const index = this.findNearestDrawnIndex(dataTrail, segments, targetTime)
    if (index === -1) return

    const aug = this.getAugmentedPoint(this.sk.SPACETIME, dataTrail[index])
    const [xPos, yPos, zPos, timePos, map3DMouse, codeColor] = this.getDotValues(aug)
    const target = isVideo ? this.getVideoSelectTime() : map3DMouse
    const distance = Math.abs(target - timePos)

    // No dot at all when even the nearest drawn point is more than sk.width
    // pixels from the target.
    if (distance > this.sk.width) return

    // Video mode marks the point's own position; hover mode tracks the cursor.
    this.dot = this.createDot(xPos, yPos, zPos, isVideo ? timePos : map3DMouse, codeColor)
  }

  /**
   * Index of the drawn point nearest `targetTime`, or -1 if nothing is drawn.
   *
   * Segments are ordered by index and each one's points are sorted by time, but
   * code filtering can leave gaps between them, so the nearest point may sit at
   * the edge of an adjacent segment. Locating the segment is one binary search
   * and the three-segment window around it covers every case.
   *
   * Ties go to the later index.
   *
   * @param {DataPoint[]} dataTrail
   * @param {Segment[]} segments
   * @param {number} targetTime
   */
  findNearestDrawnIndex(dataTrail, segments, targetTime) {
    let low = 0
    let high = segments.length - 1
    let segIndex = 0
    while (low <= high) {
      const mid = (low + high) >>> 1
      if ((dataTrail[segments[mid].start].time ?? 0) <= targetTime) {
        segIndex = mid
        low = mid + 1
      } else {
        high = mid - 1
      }
    }

    let best = -1
    let bestDistance = Infinity
    const from = Math.max(0, segIndex - 1)
    const to = Math.min(segments.length - 1, segIndex + 1)
    for (let s = from; s <= to; s++) {
      const candidate = this.nearestIndexInSegment(dataTrail, segments[s], targetTime)
      const distance = Math.abs((dataTrail[candidate].time ?? 0) - targetTime)
      if (distance <= bestDistance) {
        bestDistance = distance
        best = candidate
      }
    }
    return best
  }

  /**
   * Index within one segment whose time is nearest `targetTime`.
   * @param {DataPoint[]} dataTrail
   * @param {Segment} segment
   * @param {number} targetTime
   */
  nearestIndexInSegment(dataTrail, segment, targetTime) {
    let low = segment.start
    let high = segment.end
    while (low < high) {
      const mid = (low + high) >>> 1
      if ((dataTrail[mid].time ?? 0) < targetTime) low = mid + 1
      else high = mid
    }
    // `low` is the first index at or after targetTime; its predecessor may be
    // closer. A strict `<` keeps ties on the later index.
    if (low > segment.start) {
      const previous = low - 1
      const previousDistance = Math.abs((dataTrail[previous].time ?? 0) - targetTime)
      const lowDistance = Math.abs((dataTrail[low].time ?? 0) - targetTime)
      if (previousDistance < lowDistance) return previous
    }
    return low
  }

  /**
   * @param {AugPoint} augmentedPoint
   * @returns {[number, number, number, number, number, string]}
   */
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
    const videoPixelTime = timelineV2Store.timeToPixel(drawState.videoCurrentTime)
    return this.sk.mapSelectTimeToPixelTime(videoPixelTime)
  }

  /**
   * @param {number} xPos
   * @param {number} yPos
   * @param {number} zPos
   * @param {number} timePos
   * @param {string} color
   * @returns {Dot}
   */
  createDot(xPos, yPos, zPos, timePos, color) {
    return { xPos, yPos, zPos, timePos, color }
  }

  /** @param {Dot} curDot */
  drawDot(curDot) {
    const dotSize = this.sk.width / 50
    this.drawFloorPlanDot(curDot, dotSize)
    if (this.sk.handle3D.getIs3DMode()) this.draw3DSpaceTimeDot(curDot)
    else this.sk.circle(curDot.timePos, curDot.yPos, dotSize)
  }

  /**
   * @param {Dot} curDot
   * @param {number} dotSize
   */
  drawFloorPlanDot(curDot, dotSize) {
    this.sk.stroke(0)
    this.sk.strokeWeight(5)
    this.setFill(curDot.color)
    this.sk.circle(curDot.xPos, curDot.yPos, dotSize)
  }

  /** @param {Dot} curDot */
  draw3DSpaceTimeDot(curDot) {
    this.sk.strokeWeight(25)
    this.setStroke(curDot.color)
    this.sk.point(curDot.xPos, curDot.yPos, curDot.zPos)
    this.sk.strokeWeight(2)
    this.sk.line(curDot.xPos, curDot.yPos, 0, curDot.xPos, curDot.yPos, curDot.zPos)
  }
}
