import { afterEach, beforeEach, describe, it, expect } from 'vitest'
import { DrawMovement } from './draw-movement.js'
import { DataPoint } from '../../models/dataPoint.js'
import { readFileSync } from 'node:fs'
import { buildPathLod, quantizeScales, type ViewScales } from './path-lod'
import ConfigStore, { initialConfig } from '../../stores/configStore'
import { resetGPS, setGPSMode } from '../../stores/gpsStore'
import { timelineV2Store } from '../timeline/store'
import { FloorPlan } from '../floorplan/floorplan'
import { GPS_NORMALIZED_SIZE } from '../gps/gps-transformer'
import type { DrawUtils } from './draw-utils.js'
import type { IgsP5 } from '../p5/igs-p5'

// Tests for the index/segment math in DrawMovement. Everything exercised here
// is reachable without a p5 instance — findTimeIndex and codesEqual touch no
// state at all, and computeSegmentsInRange needs only drawUtils.isStopped,
// which is stubbed so the partition is pinned independently of
// ConfigStore.stopSliderValue.

/** DrawMovement with no sketch; only the isStopped predicate is supplied. */
const makeDrawMovement = (isStopped: (stopLength: number) => boolean) =>
  new DrawMovement(null as unknown as IgsP5, { isStopped } as unknown as DrawUtils)

/** A stopLength of 3+ counts as stopped in these tests. */
const STOP_THRESHOLD = 3
const drawMovement = () => makeDrawMovement((len) => len >= STOP_THRESHOLD)

const pt = (time: number, stopLength = 0, codes: string[] = []) => {
  const point = new DataPoint('', time, 0, 0)
  point.stopLength = stopLength
  point.codes = codes
  return point
}

describe('DrawMovement.findTimeIndex', () => {
  const dm = drawMovement()
  // times: 0, 10, 20, 30, 40
  const trail = [pt(0), pt(10), pt(20), pt(30), pt(40)]

  describe('findFirst = true (first index with time >= target)', () => {
    it('returns an exact match', () => {
      expect(dm.findTimeIndex(trail, 20, true)).toBe(2)
    })

    it('rounds up to the next point when the target falls between samples', () => {
      expect(dm.findTimeIndex(trail, 15, true)).toBe(2)
    })

    it('returns 0 for a target at or before the first point', () => {
      expect(dm.findTimeIndex(trail, 0, true)).toBe(0)
      expect(dm.findTimeIndex(trail, -5, true)).toBe(0)
    })

    it('returns trail.length as the not-found sentinel past the end', () => {
      expect(dm.findTimeIndex(trail, 41, true)).toBe(trail.length)
    })

    it('defaults findFirst to true', () => {
      expect(dm.findTimeIndex(trail, 15)).toBe(2)
    })
  })

  describe('findFirst = false (last index with time <= target)', () => {
    it('returns an exact match', () => {
      expect(dm.findTimeIndex(trail, 20, false)).toBe(2)
    })

    it('rounds down to the previous point when the target falls between samples', () => {
      expect(dm.findTimeIndex(trail, 15, false)).toBe(1)
    })

    it('returns the last index for a target at or after the final point', () => {
      expect(dm.findTimeIndex(trail, 40, false)).toBe(4)
      expect(dm.findTimeIndex(trail, 99, false)).toBe(4)
    })

    it('returns -1 as the not-found sentinel before the start', () => {
      expect(dm.findTimeIndex(trail, -1, false)).toBe(-1)
    })
  })

  it('treats a null time as 0', () => {
    const withNull = [pt(0), new DataPoint('', null), pt(20)]
    // The null-time point compares as 0, so a target of 0 still lands at index 0.
    expect(dm.findTimeIndex(withNull, 0, true)).toBe(0)
  })

  it('handles a single-point trail', () => {
    expect(dm.findTimeIndex([pt(5)], 5, true)).toBe(0)
    expect(dm.findTimeIndex([pt(5)], 6, true)).toBe(1)
    expect(dm.findTimeIndex([pt(5)], 4, false)).toBe(-1)
  })
})

describe('DrawMovement.codesEqual', () => {
  const dm = drawMovement()

  it('is true for identical contents in the same order', () => {
    expect(dm.codesEqual(['a', 'b'], ['a', 'b'])).toBe(true)
  })

  it('is true for two empty arrays', () => {
    expect(dm.codesEqual([], [])).toBe(true)
  })

  it('is order-sensitive', () => {
    expect(dm.codesEqual(['a', 'b'], ['b', 'a'])).toBe(false)
  })

  it('is false on a length mismatch', () => {
    expect(dm.codesEqual(['a'], ['a', 'b'])).toBe(false)
  })

  // Pins the falsy guard: `if (!codes1 || !codes2) return codes1 === codes2`
  it('treats two nullish inputs of the same kind as equal', () => {
    const nullish = null as unknown as string[]
    expect(dm.codesEqual(nullish, nullish)).toBe(true)
  })

  it('treats one nullish input as unequal to a real array', () => {
    const nullish = null as unknown as string[]
    expect(dm.codesEqual(nullish, [])).toBe(false)
    expect(dm.codesEqual([], nullish)).toBe(false)
  })
})

describe('DrawMovement.computeSegmentsInRange', () => {
  const dm = drawMovement()

  it('returns a single segment for a uniform trail', () => {
    const trail = [pt(0), pt(1), pt(2)]
    expect(dm.computeSegmentsInRange(trail, 0, 2)).toEqual([
      { start: 0, end: 2, isStopped: false, codes: [] },
    ])
  })

  it('returns an empty array when startIdx > endIdx', () => {
    expect(dm.computeSegmentsInRange([pt(0), pt(1)], 1, 0)).toEqual([])
  })

  it('returns one segment for a single-point range', () => {
    const trail = [pt(0), pt(1), pt(2)]
    expect(dm.computeSegmentsInRange(trail, 1, 1)).toEqual([
      { start: 1, end: 1, isStopped: false, codes: [] },
    ])
  })

  it('splits on a change of stopped state', () => {
    // moving, moving, stopped, stopped
    const trail = [pt(0), pt(1), pt(2, 5), pt(3, 5)]
    expect(dm.computeSegmentsInRange(trail, 0, 3)).toEqual([
      { start: 0, end: 1, isStopped: false, codes: [] },
      { start: 2, end: 3, isStopped: true, codes: [] },
    ])
  })

  it('splits on a change of codes', () => {
    const trail = [pt(0, 0, ['a']), pt(1, 0, ['a']), pt(2, 0, ['b'])]
    expect(dm.computeSegmentsInRange(trail, 0, 2)).toEqual([
      { start: 0, end: 1, isStopped: false, codes: ['a'] },
      { start: 2, end: 2, isStopped: false, codes: ['b'] },
    ])
  })

  it('splits on every alternation, one segment per point', () => {
    const trail = [pt(0), pt(1, 5), pt(2), pt(3, 5)]
    expect(dm.computeSegmentsInRange(trail, 0, 3)).toEqual([
      { start: 0, end: 0, isStopped: false, codes: [] },
      { start: 1, end: 1, isStopped: true, codes: [] },
      { start: 2, end: 2, isStopped: false, codes: [] },
      { start: 3, end: 3, isStopped: true, codes: [] },
    ])
  })

  it('honours startIdx/endIdx and ignores points outside the range', () => {
    // Index 0 and 4 are stopped but fall outside the requested range.
    const trail = [pt(0, 5), pt(1), pt(2), pt(3), pt(4, 5)]
    expect(dm.computeSegmentsInRange(trail, 1, 3)).toEqual([
      { start: 1, end: 3, isStopped: false, codes: [] },
    ])
  })

  it('produces segments whose indices are contiguous and gap-free', () => {
    // This contiguity is what areSegmentsAdjacent (seg.end + 1 === seg.start)
    // relies on to draw connecting lines between segments.
    const trail = [pt(0), pt(1, 5), pt(2, 5), pt(3, 0, ['a']), pt(4, 0, ['a'])]
    const segments = dm.computeSegmentsInRange(trail, 0, 4)

    expect(segments[0].start).toBe(0)
    expect(segments[segments.length - 1].end).toBe(4)
    for (let i = 0; i < segments.length - 1; i++) {
      expect(segments[i].end + 1).toBe(segments[i + 1].start)
    }
  })

  it('reports the final segment from the last point, not the previous one', () => {
    // The loop pushes intermediate segments using prevPoint, but the trailing
    // segment is built from dataTrail[endIdx]. For a trailing run of one point
    // that distinction is observable.
    const trail = [pt(0), pt(1), pt(2, 5)]
    const segments = dm.computeSegmentsInRange(trail, 0, 2)
    expect(segments[segments.length - 1]).toEqual({
      start: 2,
      end: 2,
      isStopped: true,
      codes: [],
    })
  })

  it('uses the supplied isStopped threshold', () => {
    const strict = makeDrawMovement((len) => len >= 10)
    const trail = [pt(0, 5), pt(1, 5)]
    // stopLength 5 is "stopped" at threshold 3 but not at threshold 10.
    expect(drawMovement().computeSegmentsInRange(trail, 0, 1)[0].isStopped).toBe(true)
    expect(strict.computeSegmentsInRange(trail, 0, 1)[0].isStopped).toBe(false)
  })
})

describe('DrawMovement.nearestIndexInSegment', () => {
  const dm = drawMovement()
  // times 0, 10, 20, 30, 40 at indices 0..4
  const trail = [pt(0), pt(10), pt(20), pt(30), pt(40)]
  const seg = (start: number, end: number) => ({ start, end, isStopped: false, codes: [] })

  it('finds an exact match', () => {
    expect(dm.nearestIndexInSegment(trail, seg(0, 4), 20)).toBe(2)
  })

  it('snaps to the closer neighbour below the midpoint', () => {
    expect(dm.nearestIndexInSegment(trail, seg(0, 4), 14)).toBe(1)
  })

  it('snaps to the closer neighbour above the midpoint', () => {
    expect(dm.nearestIndexInSegment(trail, seg(0, 4), 16)).toBe(2)
  })

  it('breaks an exact tie towards the later index', () => {
    // 15 is equidistant from times 10 and 20, so the tie-break decides: a
    // candidate is accepted when its distance merely equals the best so far, and
    // the later point is examined last.
    expect(dm.nearestIndexInSegment(trail, seg(0, 4), 15)).toBe(2)
  })

  it('clamps to the segment bounds rather than leaving them', () => {
    // Target sits far outside the segment on each side.
    expect(dm.nearestIndexInSegment(trail, seg(1, 3), -100)).toBe(1)
    expect(dm.nearestIndexInSegment(trail, seg(1, 3), 100)).toBe(3)
  })

  it('handles a single-point segment', () => {
    expect(dm.nearestIndexInSegment(trail, seg(2, 2), 0)).toBe(2)
    expect(dm.nearestIndexInSegment(trail, seg(2, 2), 999)).toBe(2)
  })
})

describe('DrawMovement.findNearestDrawnIndex', () => {
  const dm = drawMovement()
  const seg = (start: number, end: number) => ({ start, end, isStopped: false, codes: [] })

  it('returns -1 when nothing was drawn', () => {
    expect(dm.findNearestDrawnIndex([pt(0)], [], 0)).toBe(-1)
  })

  it('searches within a single segment covering the whole trail', () => {
    const trail = [pt(0), pt(10), pt(20), pt(30)]
    expect(dm.findNearestDrawnIndex(trail, [seg(0, 3)], 21)).toBe(2)
  })

  // Code filtering removes segments, so the drawn set can have gaps. A target
  // landing in a gap must snap to whichever side is nearer, which is why the
  // search checks the segment window either side of the one it locates.
  it('snaps into the nearer segment when the target falls in a filtered-out gap', () => {
    const trail = [pt(0), pt(10), pt(20), pt(30), pt(40), pt(50)]
    const drawn = [seg(0, 1), seg(4, 5)] // indices 2 and 3 were filtered out
    expect(dm.findNearestDrawnIndex(trail, drawn, 12)).toBe(1) // nearer to time 10
    expect(dm.findNearestDrawnIndex(trail, drawn, 38)).toBe(4) // nearer to time 40
  })

  it('never returns an index outside the drawn segments', () => {
    const trail = [pt(0), pt(10), pt(20), pt(30), pt(40), pt(50)]
    const drawn = [seg(0, 1), seg(4, 5)]
    for (const target of [-50, 0, 15, 20, 25, 30, 45, 500]) {
      const index = dm.findNearestDrawnIndex(trail, drawn, target)
      const inside = drawn.some((d) => index >= d.start && index <= d.end)
      expect(inside).toBe(true)
    }
  })

  it('finds the target before the first drawn segment', () => {
    const trail = [pt(0), pt(10), pt(20), pt(30)]
    expect(dm.findNearestDrawnIndex(trail, [seg(2, 3)], -100)).toBe(2)
  })

  it('finds the target after the last drawn segment', () => {
    const trail = [pt(0), pt(10), pt(20), pt(30)]
    expect(dm.findNearestDrawnIndex(trail, [seg(0, 1)], 100)).toBe(1)
  })

  it('agrees with a brute-force scan over many segment layouts', () => {
    // The binary search only examines a three-segment window, so this pins the
    // claim that the window is always wide enough.
    const trail = Array.from({ length: 60 }, (_, i) => pt(i * 3))
    const drawn = [seg(0, 4), seg(10, 12), seg(13, 25), seg(40, 40), seg(50, 59)]
    const bruteForce = (target: number) => {
      let best = -1
      let bestDistance = Infinity
      for (const d of drawn) {
        for (let i = d.start; i <= d.end; i++) {
          const distance = Math.abs((trail[i].time ?? 0) - target)
          if (distance <= bestDistance) {
            bestDistance = distance
            best = i
          }
        }
      }
      return best
    }
    for (let target = -20; target <= 200; target += 1) {
      expect(dm.findNearestDrawnIndex(trail, drawn, target)).toBe(bruteForce(target))
    }
  })
})

// ============================================================
// The unified render path
// ============================================================

/**
 * DrawMovement wired for the segment-resolution functions: a sketch exposing
 * only PLAN, and a DrawUtils whose createAugmentPoint projects a point to its
 * own x/y so a mask can be written against known coordinates.
 */
const makeResolver = (isStopped: (stopLength: number) => boolean = (l) => l >= STOP_THRESHOLD) =>
  new DrawMovement(
    { PLAN: 0, SPACETIME: 1 } as unknown as IgsP5,
    {
      isStopped,
      createAugmentPoint: (_view: number, point: DataPoint) => ({
        point,
        pos: {
          floorPlanXPos: point.x ?? 0,
          floorPlanYPos: point.y ?? 0,
          timelineXPos: point.time ?? 0,
          selTimelineXPos: point.time ?? 0,
          viewXPos: point.x ?? 0,
          zPos: 0,
        },
      }),
    } as unknown as DrawUtils
  )

const xyPt = (time: number, x: number, y: number) => new DataPoint('', time, x, y)
const segOf = (start: number, end: number, isStopped = false, codes: string[] = []) => ({
  start,
  end,
  isStopped,
  codes,
})

describe('DrawMovement.resolveDrawRange', () => {
  const dm = makeResolver()
  const trail = [pt(0), pt(10), pt(20), pt(30), pt(40)]
  const state = (viewStart: number, viewEnd: number, currentTime = 0) =>
    ({
      viewStart,
      viewEnd,
      dataStart: 0,
      dataEnd: 40,
      currentTime,
    }) as unknown as Parameters<typeof dm.resolveDrawRange>[1]

  it('returns the whole trail for a full view with playback stopped', () => {
    // No binary search needed in the common case.
    expect(dm.resolveDrawRange(trail, state(0, 40))).toEqual({ startIdx: 0, endIdx: 4 })
  })

  it('treats a view wider than the data as full', () => {
    expect(dm.resolveDrawRange(trail, state(-10, 100))).toEqual({ startIdx: 0, endIdx: 4 })
  })

  it('narrows to the zoomed window', () => {
    expect(dm.resolveDrawRange(trail, state(10, 30))).toEqual({ startIdx: 1, endIdx: 3 })
  })

  it('includes only points inside the window, rounding inwards', () => {
    expect(dm.resolveDrawRange(trail, state(5, 35))).toEqual({ startIdx: 1, endIdx: 3 })
  })

  it('returns null when the window contains no points', () => {
    expect(dm.resolveDrawRange(trail, state(11, 19))).toBeNull()
  })

  it('returns null for an empty-ish window past the data', () => {
    expect(dm.resolveDrawRange(trail, state(41, 50))).toBeNull()
  })
})

describe('DrawMovement.isSegmentDrawn', () => {
  it('keeps a segment when no filters are active', () => {
    const dm = makeResolver()
    dm.noCodesEnabled = true
    expect(dm.isSegmentDrawn(segOf(0, 2))).toBe(true)
  })

  it('drops a segment whose codes are all disabled', () => {
    const dm = makeResolver()
    dm.enabledCodes = new Set(['a'])
    expect(dm.isSegmentDrawn(segOf(0, 2, false, ['b']))).toBe(false)
    expect(dm.isSegmentDrawn(segOf(0, 2, false, ['a']))).toBe(true)
  })

  it('drops uncoded segments when the "no codes" entry is disabled', () => {
    const dm = makeResolver()
    dm.noCodesEnabled = false
    expect(dm.isSegmentDrawn(segOf(0, 2, false, []))).toBe(false)
  })
})

describe('DrawMovement.subdivideByMask', () => {
  const dm = makeResolver()
  // Points laid out along x so a mask can select an x window.
  const trail = [
    xyPt(0, 0, 0),
    xyPt(1, 10, 0),
    xyPt(2, 20, 0),
    xyPt(3, 30, 0),
    xyPt(4, 40, 0),
    xyPt(5, 50, 0),
  ]
  const inX = (lo: number, hi: number) => (pos: { floorPlanXPos: number }) =>
    pos.floorPlanXPos >= lo && pos.floorPlanXPos <= hi

  it('returns the whole segment when every point passes', () => {
    expect(dm.subdivideByMask(trail, [segOf(0, 5)], inX(-1, 100))).toEqual([segOf(0, 5)])
  })

  it('returns nothing when no point passes', () => {
    expect(dm.subdivideByMask(trail, [segOf(0, 5)], inX(1000, 2000))).toEqual([])
  })

  it('trims a segment to the passing run', () => {
    expect(dm.subdivideByMask(trail, [segOf(0, 5)], inX(10, 30))).toEqual([segOf(1, 3)])
  })

  it('splits a segment into several runs around a gap', () => {
    const mask = (pos: { floorPlanXPos: number }) => pos.floorPlanXPos !== 20
    expect(dm.subdivideByMask(trail, [segOf(0, 5)], mask)).toEqual([segOf(0, 1), segOf(3, 5)])
  })

  it('emits single-point runs', () => {
    const mask = (pos: { floorPlanXPos: number }) => pos.floorPlanXPos % 20 === 0
    expect(dm.subdivideByMask(trail, [segOf(0, 5)], mask)).toEqual([
      segOf(0, 0),
      segOf(2, 2),
      segOf(4, 4),
    ])
  })

  it('carries isStopped and codes onto every run it produces', () => {
    const mask = (pos: { floorPlanXPos: number }) => pos.floorPlanXPos !== 20
    const runs = dm.subdivideByMask(trail, [segOf(0, 5, true, ['x'])], mask)
    expect(runs).toHaveLength(2)
    for (const run of runs) {
      expect(run.isStopped).toBe(true)
      expect(run.codes).toEqual(['x'])
    }
  })

  it('processes several input segments independently', () => {
    const runs = dm.subdivideByMask(trail, [segOf(0, 2), segOf(3, 5)], inX(10, 40))
    expect(runs).toEqual([segOf(1, 2), segOf(3, 4)])
  })

  it('keeps every emitted run index-contiguous', () => {
    // areSegmentsAdjacent (end + 1 === start) draws the connecting lines, so a
    // run must never be a sparse set of indices.
    const mask = (pos: { floorPlanXPos: number }) => pos.floorPlanXPos !== 20
    for (const run of dm.subdivideByMask(trail, [segOf(0, 5)], mask)) {
      expect(run.end).toBeGreaterThanOrEqual(run.start)
    }
  })

  it('does not join runs across two adjacent input segments', () => {
    // Segments 0-2 and 3-5 both pass fully, but they stay separate so their
    // differing style (stopped vs moving) is preserved.
    const runs = dm.subdivideByMask(trail, [segOf(0, 2, false), segOf(3, 5, true)], inX(-1, 100))
    expect(runs).toEqual([segOf(0, 2, false), segOf(3, 5, true)])
  })

  it('returns an empty array for no input segments', () => {
    expect(dm.subdivideByMask(trail, [], inX(0, 100))).toEqual([])
  })
})

describe('DrawMovement.isSegmentDrawn — movement-only and stops-only', () => {
  // Both toggles depend only on stopped-state, which is constant within a
  // segment, so they are applied once per segment rather than per point and the
  // batched path handles them.
  afterEach(() => {
    ConfigStore.set({ ...initialConfig })
  })

  it('keeps only moving segments under movementToggle', () => {
    ConfigStore.set({ ...initialConfig, movementToggle: true })
    const dm = makeResolver()
    expect(dm.isSegmentDrawn(segOf(0, 2, false))).toBe(true)
    expect(dm.isSegmentDrawn(segOf(0, 2, true))).toBe(false)
  })

  it('keeps only stopped segments under stopsToggle', () => {
    ConfigStore.set({ ...initialConfig, stopsToggle: true })
    const dm = makeResolver()
    expect(dm.isSegmentDrawn(segOf(0, 2, true))).toBe(true)
    expect(dm.isSegmentDrawn(segOf(0, 2, false))).toBe(false)
  })

  it('still applies the code filter alongside movementToggle', () => {
    ConfigStore.set({ ...initialConfig, movementToggle: true })
    const dm = makeResolver()
    dm.enabledCodes = new Set(['a'])
    // Moving, but its code is disabled.
    expect(dm.isSegmentDrawn(segOf(0, 2, false, ['b']))).toBe(false)
    expect(dm.isSegmentDrawn(segOf(0, 2, false, ['a']))).toBe(true)
  })
})

describe('DrawMovement.activeMask', () => {
  const withSketch = (is3D: boolean) =>
    new DrawMovement(
      {
        PLAN: 0,
        SPACETIME: 1,
        handle3D: { getIs3DModeOrTransitioning: () => is3D },
        gui: {
          fpContainer: { overCursor: () => true, overSlicer: () => true },
          highlight: { overHighlightArray: () => true },
        },
      } as unknown as IgsP5,
      {} as unknown as DrawUtils
    )

  afterEach(() => {
    ConfigStore.set({ ...initialConfig })
  })

  it('is null when no spatial mode is active', () => {
    expect(withSketch(false).activeMask()).toBeNull()
  })

  it('returns a predicate for the circle selector in 2D', () => {
    ConfigStore.set({ ...initialConfig, circleToggle: true })
    expect(withSketch(false).activeMask()).toBeTypeOf('function')
  })

  // selectMode returns true for every point when the circle or slice selector
  // is active in 3D, so there is no per-point work to do.
  it('is null for the circle selector in 3D', () => {
    ConfigStore.set({ ...initialConfig, circleToggle: true })
    expect(withSketch(true).activeMask()).toBeNull()
  })

  it('is null for the slice selector in 3D', () => {
    ConfigStore.set({ ...initialConfig, sliceToggle: true })
    expect(withSketch(true).activeMask()).toBeNull()
  })

  // Highlight rectangles handle 3D themselves inside overHighlightArray, so the
  // predicate stays active in both modes.
  it('returns a predicate for highlight in 2D and in 3D', () => {
    ConfigStore.set({ ...initialConfig, highlightToggle: true })
    expect(withSketch(false).activeMask()).toBeTypeOf('function')
    expect(withSketch(true).activeMask()).toBeTypeOf('function')
  })
})

// ============================================================
// Vertex emission against the render-time reduction
// ============================================================

/**
 * DrawMovement whose sketch records every vertex() call. Points are projected to
 * x = index * SPACING so a recorded x identifies which trail index was emitted.
 */
const SPACING = 100 // comfortably past the gap threshold at any slider setting

const makeEmitter = () => {
  const vertices: number[] = []
  const dm = new DrawMovement(
    {
      PLAN: 0,
      SPACETIME: 1,
      vertex: (x: number) => vertices.push(x),
    } as unknown as IgsP5,
    {
      createAugmentPoint: (_view: number, point: DataPoint) => ({
        point,
        pos: { viewXPos: point.x ?? 0, floorPlanYPos: 0, zPos: 0 },
      }),
    } as unknown as DrawUtils
  )
  return { dm, vertices }
}

/** Recovers the emitted index sequence from LINES vertex pairs. */
const emitted = (vertices: number[]) => {
  const indices: number[] = []
  for (const x of vertices) {
    const index = x / SPACING
    if (indices.length === 0 || indices[indices.length - 1] !== index) indices.push(index)
  }
  return indices
}

const spacedTrail = (count: number) =>
  Array.from({ length: count }, (_, i) => new DataPoint('', i, i * SPACING, 0))

describe('DrawMovement.drawSegmentVerticesAsLines without a reduction', () => {
  it('emits every index in the range', () => {
    const { dm, vertices } = makeEmitter()
    dm.lod = null
    dm.drawSegmentVerticesAsLines(1, spacedTrail(6), 0, 5)
    expect(emitted(vertices)).toEqual([0, 1, 2, 3, 4, 5])
  })

  it('honours the requested sub-range', () => {
    const { dm, vertices } = makeEmitter()
    dm.lod = null
    dm.drawSegmentVerticesAsLines(1, spacedTrail(6), 2, 4)
    expect(emitted(vertices)).toEqual([2, 3, 4])
  })

  it('emits nothing for a single-point segment, there being no line to draw', () => {
    const { dm, vertices } = makeEmitter()
    dm.lod = null
    dm.drawSegmentVerticesAsLines(1, spacedTrail(6), 3, 3)
    expect(vertices).toEqual([])
  })
})

describe('DrawMovement.drawSegmentVerticesAsLines with a reduction', () => {
  it('emits the segment endpoints plus the reduction indices between them', () => {
    const { dm, vertices } = makeEmitter()
    dm.lod = new Int32Array([0, 3, 6, 9])
    dm.drawSegmentVerticesAsLines(1, spacedTrail(10), 0, 9)
    expect(emitted(vertices)).toEqual([0, 3, 6, 9])
  })

  it('always emits a segment endpoint even when the reduction omits it', () => {
    // Endpoints must be emitted so neighbouring segments still meet and
    // drawSegmentConnections has something to join.
    const { dm, vertices } = makeEmitter()
    dm.lod = new Int32Array([0, 5, 9])
    dm.drawSegmentVerticesAsLines(1, spacedTrail(10), 2, 7)
    expect(emitted(vertices)).toEqual([2, 5, 7])
  })

  it('does not emit an endpoint twice when the reduction also contains it', () => {
    const { dm, vertices } = makeEmitter()
    dm.lod = new Int32Array([2, 4, 6])
    dm.drawSegmentVerticesAsLines(1, spacedTrail(10), 2, 6)
    expect(emitted(vertices)).toEqual([2, 4, 6])
  })

  it('emits only the endpoints when the reduction keeps nothing inside', () => {
    const { dm, vertices } = makeEmitter()
    dm.lod = new Int32Array([0, 20])
    dm.drawSegmentVerticesAsLines(1, spacedTrail(10), 3, 8)
    expect(emitted(vertices)).toEqual([3, 8])
  })

  it('ignores reduction indices outside the segment', () => {
    const { dm, vertices } = makeEmitter()
    dm.lod = new Int32Array([0, 1, 2, 7, 8, 9])
    dm.drawSegmentVerticesAsLines(1, spacedTrail(10), 4, 6)
    expect(emitted(vertices)).toEqual([4, 6])
  })

  it('emits nothing for a single-point segment', () => {
    const { dm, vertices } = makeEmitter()
    dm.lod = new Int32Array([0, 3, 6])
    dm.drawSegmentVerticesAsLines(1, spacedTrail(10), 3, 3)
    expect(vertices).toEqual([])
  })

  it('keeps emitted indices in ascending order', () => {
    const { dm, vertices } = makeEmitter()
    dm.lod = new Int32Array([1, 2, 5, 8, 11, 14])
    dm.drawSegmentVerticesAsLines(1, spacedTrail(16), 0, 15)
    const indices = emitted(vertices)
    for (let i = 1; i < indices.length; i++) {
      expect(indices[i]).toBeGreaterThan(indices[i - 1])
    }
  })
})

describe('DrawMovement screen-space decimation', () => {
  // The decimator bounds the *gap* between emitted vertices, in screen pixels,
  // off the same pathSimplification budget the reduction measures *deviation*
  // with. Because the gap is measured from the last vertex emitted rather than
  // the last one considered, it is this step that fixes the drawn path's
  // distance from the trail.
  const tightTrail = (count: number, spacing = 1) =>
    Array.from({ length: count }, (_, i) => new DataPoint('', i, i * spacing, 0))

  afterEach(() => {
    ConfigStore.set({ ...initialConfig })
  })

  /**
   * An emitter whose decimator runs at the given pixel budget.
   *
   * The budget is set on the store *before* construction and never assigned to
   * the instance, so these tests cover the wiring from slider to threshold as
   * well as the threshold's effect.
   */
  const atBudget = (budget: number) => {
    ConfigStore.set({ ...initialConfig, pathSimplification: budget })
    return makeEmitter()
  }

  // The link the rest of this block relies on: the gap rule reads the same
  // budget the reduction does.
  it('takes its threshold from the simplification budget', () => {
    for (const budget of [0.5, 1, 4, 8]) {
      expect(atBudget(budget).dm.minGapSq).toBeCloseTo(budget ** 2, 9)
    }
  })

  it('drops interior points closer together than the budget', () => {
    const { dm, vertices } = atBudget(8)
    dm.lod = null
    dm.drawSegmentVerticesAsLines(1, tightTrail(6), 0, 5)
    // Only the two forced endpoints survive.
    expect(vertices).toEqual([0, 5])
  })

  it('exempts the segment endpoints from the threshold', () => {
    const { dm, vertices } = atBudget(8)
    dm.lod = new Int32Array([0, 1, 2, 3])
    dm.drawSegmentVerticesAsLines(1, tightTrail(4), 0, 3)
    expect(vertices).toEqual([0, 3])
  })

  it('keeps points once they clear the threshold', () => {
    const { dm, vertices } = atBudget(8)
    dm.lod = null
    const trail = [0, 20, 40].map((x, i) => new DataPoint('', i, x, 0))
    dm.drawSegmentVerticesAsLines(1, trail, 0, 2)
    expect(vertices).toEqual([0, 20, 20, 40])
  })

  // A tighter budget has to keep detail a looser one discards.
  it('keeps more detail at a tighter budget', () => {
    const trail = tightTrail(40, 2)
    const coarse = atBudget(8)
    coarse.dm.lod = null
    coarse.dm.drawSegmentVerticesAsLines(1, trail, 0, 39)

    const fine = atBudget(1)
    fine.dm.lod = null
    fine.dm.drawSegmentVerticesAsLines(1, trail, 0, 39)

    expect(fine.vertices.length).toBeGreaterThan(coarse.vertices.length)
  })

  // Every point dropped is within one budget of the last *emitted* vertex, not
  // of its own predecessor — which is what makes the drawn polyline stay inside
  // the budget rather than drifting a budget per dropped point.
  it('measures the gap from the last emitted vertex, not the last candidate', () => {
    const { dm, vertices } = atBudget(5)
    dm.lod = null
    // Steps of 3px: each is inside the budget on its own, but the second is 6px
    // from the vertex actually emitted, so it must be kept.
    const trail = [0, 3, 6, 9].map((x, i) => new DataPoint('', i, x, 0))
    dm.drawSegmentVerticesAsLines(1, trail, 0, 3)
    expect(vertices).toEqual([0, 6, 6, 9])
  })
})

// ============================================================
// Batched drawing: one shape per pass, whatever the colour mode
// ============================================================

/**
 * DrawMovement whose sketch records the shape calls in order, so a test can
 * assert that one shape wraps a whole pass and that the right colour was in
 * force at each vertex.
 *
 * Separate from makeEmitter because this needs the shape and style surface that
 * the vertex-level tests deliberately leave off the fake, and because it records
 * an event stream rather than a bare vertex list.
 *
 * @see drawBatchedSegments for why a colour can change inside one shape.
 */
type ShapeEvent =
  | { kind: 'begin' }
  | { kind: 'end' }
  | { kind: 'stroke'; color: string }
  | { kind: 'weight'; weight: number }
  | { kind: 'vertex'; index: number }

const makeBatchRecorder = () => {
  const events: ShapeEvent[] = []
  const dm = new DrawMovement(
    {
      PLAN: 0,
      SPACETIME: 1,
      LINES: 'LINES',
      beginShape: () => events.push({ kind: 'begin' }),
      endShape: () => events.push({ kind: 'end' }),
      stroke: (color: string) => events.push({ kind: 'stroke', color }),
      strokeWeight: (weight: number) => events.push({ kind: 'weight', weight }),
      strokeCap: () => {},
      vertex: (x: number) => events.push({ kind: 'vertex', index: x / SPACING }),
    } as unknown as IgsP5,
    {
      // One colour per code, so an asserted colour names the segment it came from.
      setCodeColor: (codes: string[]) => (codes.length ? `#${codes[0]}` : '#none'),
      createAugmentPoint: (_view: number, point: DataPoint) => ({
        point,
        pos: { viewXPos: point.x ?? 0, floorPlanYPos: 0, zPos: 0 },
      }),
    } as unknown as DrawUtils
  )
  dm.shade = '#shade'
  return { dm, events }
}

/** The colour in force at each emitted vertex, in emission order. */
const colorsAtVertices = (events: ShapeEvent[]) => {
  const colors: string[] = []
  let current = ''
  for (const event of events) {
    if (event.kind === 'stroke') current = event.color
    if (event.kind === 'vertex') colors.push(current)
  }
  return colors
}

const countOf = (events: ShapeEvent[], kind: ShapeEvent['kind']) =>
  events.filter((e) => e.kind === kind).length

/**
 * Both methods below read the colour mode from the store, as the draw layer does.
 *
 * pathSimplification goes to zero with it so the decimator passes everything
 * through: these tests are about which colour is in force at each vertex, not
 * about which vertices survive.
 */
const setPathColorMode = (on: boolean) =>
  ConfigStore.set({ ...initialConfig, isPathColorMode: on, pathSimplification: 0 })

describe('DrawMovement.drawBatchedSegments', () => {
  // Three one-link segments, each carrying its own code, laid out so a recorded
  // vertex index names the trail index it came from.
  const trail = spacedTrail(6)
  const segments = [
    { start: 0, end: 1, isStopped: false, codes: ['a'] },
    { start: 2, end: 3, isStopped: false, codes: ['b'] },
    { start: 4, end: 5, isStopped: false, codes: ['c'] },
  ]

  afterEach(() => {
    ConfigStore.set({ ...initialConfig })
  })

  it('wraps the whole pass in a single shape', () => {
    setPathColorMode(true)
    const { dm, events } = makeBatchRecorder()
    dm.lod = null
    dm.drawBatchedSegments(1, trail, segments, false, 1)
    expect(countOf(events, 'begin')).toBe(1)
    expect(countOf(events, 'end')).toBe(1)
  })

  // p5 keeps the stroke colour per vertex in immediate mode, so one shape can
  // carry a colour per segment — which is what lets a whole pass batch into a
  // single draw call instead of one per segment.
  it('gives each segment its own colour inside that one shape', () => {
    setPathColorMode(true)
    const { dm, events } = makeBatchRecorder()
    dm.lod = null
    dm.drawBatchedSegments(1, trail, segments, false, 1)
    expect(colorsAtVertices(events)).toEqual(['#a', '#a', '#b', '#b', '#c', '#c'])
  })

  // Both vertices of a LINES pair must share a colour, or p5 interpolates
  // between them and the segment comes out gradated rather than solid.
  it('emits both ends of a link under the same colour', () => {
    setPathColorMode(true)
    const { dm, events } = makeBatchRecorder()
    dm.lod = null
    dm.drawBatchedSegments(1, trail, segments, false, 1)
    const colors = colorsAtVertices(events)
    for (let i = 0; i < colors.length; i += 2) expect(colors[i]).toBe(colors[i + 1])
  })

  // Single colour mode must not pay for a stroke() per segment: sk.stroke parses
  // its argument, and a path can hold hundreds of segments.
  it('sets the stroke once for the batch in single colour mode', () => {
    setPathColorMode(false)
    const { dm, events } = makeBatchRecorder()
    dm.lod = null
    dm.drawBatchedSegments(1, trail, segments, false, 1)
    expect(events.filter((e) => e.kind === 'stroke')).toEqual([{ kind: 'stroke', color: '#shade' }])
    expect(colorsAtVertices(events).every((c) => c === '#shade')).toBe(true)
  })

  it('draws only the segments matching the pass', () => {
    setPathColorMode(true)
    const { dm, events } = makeBatchRecorder()
    dm.lod = null
    const mixed = [
      { start: 0, end: 1, isStopped: false, codes: ['a'] },
      { start: 2, end: 3, isStopped: true, codes: ['b'] },
    ]
    dm.drawBatchedSegments(1, trail, mixed, true, 9)
    expect(colorsAtVertices(events)).toEqual(['#b', '#b'])
    expect(events.filter((e) => e.kind === 'weight')).toEqual([{ kind: 'weight', weight: 9 }])
  })
})

describe('DrawMovement.drawSegmentConnections', () => {
  const trail = spacedTrail(6)
  // Adjacent in the trail, so each pair gets a connecting line; the third is
  // detached, so the gap is left alone.
  const segments = [
    { start: 0, end: 1, isStopped: false, codes: ['a'] },
    { start: 2, end: 3, isStopped: false, codes: ['b'] },
    { start: 5, end: 5, isStopped: false, codes: ['c'] },
  ]

  afterEach(() => {
    ConfigStore.set({ ...initialConfig })
  })

  it('batches every connection into one shape', () => {
    setPathColorMode(true)
    const { dm, events } = makeBatchRecorder()
    dm.drawSegmentConnections(1, trail, segments)
    expect(countOf(events, 'begin')).toBe(1)
    expect(countOf(events, 'end')).toBe(1)
  })

  // A connection is coloured by the segment it leaves.
  it('colours each connection by the segment it leaves', () => {
    setPathColorMode(true)
    const { dm, events } = makeBatchRecorder()
    dm.drawSegmentConnections(1, trail, segments)
    expect(colorsAtVertices(events)).toEqual(['#a', '#a'])
  })

  it('draws nothing between segments that are not adjacent', () => {
    setPathColorMode(true)
    const { dm, events } = makeBatchRecorder()
    dm.drawSegmentConnections(1, trail, [segments[0], segments[2]])
    expect(countOf(events, 'vertex')).toBe(0)
  })

  it('leaves the stroke alone in single colour mode', () => {
    setPathColorMode(false)
    const { dm, events } = makeBatchRecorder()
    dm.drawSegmentConnections(1, trail, segments)
    expect(countOf(events, 'stroke')).toBe(0)
  })
})

// ============================================================
// View scales: the input the reduction measures its budget in
// ============================================================

/**
 * DrawMovement wired for viewScales: a real FloorPlan over a fake image, the
 * real timeline store, and a sketch supplying only the time projection.
 *
 * The real FloorPlan is used rather than a stub because the rotation swap and
 * the GPS-versus-image source dimensions are exactly what needs checking, and a
 * stub would just restate the thing under test.
 */
const CANVAS_LEFT = 11
const makeScaler = (img: { width: number; height: number } | null, rotation: number) => {
  const floorPlan = new FloorPlan(null as unknown as IgsP5)
  floorPlan.img = img as unknown as import('p5').Image
  floorPlan.curFloorPlanRotation = rotation
  const box = { width: 800, height: 600 }
  const dm = new DrawMovement(
    {
      floorPlan,
      gui: { fpContainer: { getContainer: () => box } },
      // igsSketch's 2D branch: a timeline pixel through the view window, then
      // shifted into canvas coordinates.
      mapSelectTimeToPixelTime: (value: number) =>
        timelineV2Store.viewPixelToPixel(value) - CANVAS_LEFT,
    } as unknown as IgsP5,
    {} as unknown as DrawUtils
  )
  return { dm, floorPlan, box }
}

describe('DrawMovement.viewScales', () => {
  const img = { width: 1551, height: 1833 }

  beforeEach(() => {
    ConfigStore.set({ ...initialConfig })
    resetGPS()
    timelineV2Store.initialize(300, 0)
    timelineV2Store.updateXPositions(40, 840)
  })

  afterEach(() => {
    ConfigStore.set({ ...initialConfig })
    resetGPS()
  })

  // Oracle: a scale is the screen displacement produced by one unit of data, so
  // compare it against two evaluations of the projection the renderer uses.
  // This is what catches the rotation swap, where data x drives screen y.
  it('matches the projection it scales, at every rotation', () => {
    for (const rotation of [0, 1, 2, 3]) {
      const { dm, floorPlan, box } = makeScaler(img, rotation)
      const scales = dm.viewScales() as { sx: number; sy: number; st: number }
      const at = (x: number, y: number) => floorPlan.getScaledXYPos(x, y, box)
      const [bx, by] = at(500, 700)
      const [dxx, dxy] = at(501, 700)
      const [dyx, dyy] = at(500, 701)
      // One unit of data x moves the point by sx, along whichever screen axis
      // this rotation sends it down; same for data y and sy.
      expect(Math.hypot(dxx - bx, dxy - by)).toBeCloseTo(scales.sx, 9)
      expect(Math.hypot(dyx - bx, dyy - by)).toBeCloseTo(scales.sy, 9)
    }
  })

  // Quarter turns send data x down the screen's y axis, so the effective
  // dimensions that govern each data axis swap over. Pinned directly because
  // getting it backwards still produces plausible-looking numbers.
  it('swaps which effective dimension governs which data axis on a quarter turn', () => {
    const upright = makeScaler(img, 0).dm.viewScales() as { sx: number; sy: number }
    const turned = makeScaler(img, 1).dm.viewScales() as { sx: number; sy: number }
    expect(upright.sx).toBeCloseTo(800 / img.width, 9)
    expect(upright.sy).toBeCloseTo(600 / img.height, 9)
    expect(turned.sx).toBeCloseTo(600 / img.width, 9)
    expect(turned.sy).toBeCloseTo(800 / img.height, 9)
  })

  // GPS coordinates are normalized into a square of their own rather than the
  // image's pixel grid; getSourceDimensions hides that, and it must stay hidden.
  it('scales against the normalized square in GPS mode', () => {
    setGPSMode(true)
    const { dm } = makeScaler(img, 0)
    const scales = dm.viewScales() as { sx: number; sy: number }
    expect(scales.sx).toBeCloseTo(800 / GPS_NORMALIZED_SIZE, 9)
    expect(scales.sy).toBeCloseTo(600 / GPS_NORMALIZED_SIZE, 9)
  })

  // The time scale is fitted from two evaluations of the real projection rather
  // than rederived, so the thing to check is that the fit reproduces it.
  it('reports the true slope of the time projection, at every zoom', () => {
    const { dm } = makeScaler(img, 0)
    const project = (time: number) =>
      timelineV2Store.viewPixelToPixel(timelineV2Store.timeToPixel(time)) - CANVAS_LEFT
    for (const [start, end] of [
      [0, 300],
      [0, 60],
      [120, 180],
      [290, 300],
    ]) {
      timelineV2Store.setView(start, end)
      const { st } = dm.viewScales() as { st: number }
      expect(st).toBeCloseTo(Math.abs(project(10) - project(9)), 6)
    }
  })

  // Zooming in stretches the time axis, which is the whole reason the reduction
  // has to key on it.
  it('grows the time scale as the timeline zooms in', () => {
    const { dm } = makeScaler(img, 0)
    timelineV2Store.setView(0, 300)
    const full = (dm.viewScales() as { st: number }).st
    timelineV2Store.setView(140, 160)
    const zoomed = (dm.viewScales() as { st: number }).st
    expect(zoomed).toBeGreaterThan(full * 5)
  })

  // Nothing to scale against before a floor plan loads, which getPathLod reads
  // as "emit every point" rather than guessing a budget.
  it('returns null with no floor plan loaded', () => {
    expect(makeScaler(null, 0).dm.viewScales()).toBeNull()
  })

  // A zero-length recording leaves the time axis collapsed rather than dividing
  // by zero.
  it('collapses the time scale for a zero-length recording', () => {
    timelineV2Store.initialize(0, 0)
    timelineV2Store.updateXPositions(40, 840)
    const { dm } = makeScaler(img, 0)
    expect((dm.viewScales() as { st: number }).st).toBe(0)
  })

  // Every scale reaches a cache key, and NaN !== NaN would miss it every frame.
  it('never reports a non-finite scale', () => {
    for (const box of [
      { width: 0, height: 0 },
      { width: 800, height: 0 },
    ]) {
      for (const preserve of [false, true]) {
        ConfigStore.set({ ...initialConfig, preserveFloorplanAspectRatio: preserve })
        const floorPlan = new FloorPlan(null as unknown as IgsP5)
        floorPlan.img = img as unknown as import('p5').Image
        const dm = new DrawMovement(
          {
            floorPlan,
            gui: { fpContainer: { getContainer: () => box } },
            mapSelectTimeToPixelTime: (value: number) =>
              timelineV2Store.viewPixelToPixel(value) - CANVAS_LEFT,
          } as unknown as IgsP5,
          {} as unknown as DrawUtils
        )
        const scales = dm.viewScales() as { sx: number; sy: number; st: number }
        expect(Number.isFinite(scales.sx)).toBe(true)
        expect(Number.isFinite(scales.sy)).toBe(true)
        expect(Number.isFinite(scales.st)).toBe(true)
      }
    }
  })
})

// ============================================================
// The two reductions composed, on real data
// ============================================================

/**
 * What the renderer actually puts on screen, measured against a bundled dataset.
 *
 * The figures quoted in path-lod.ts's header come from here, so they cannot go
 * stale without this failing. It drives the real DrawMovement over a real
 * reduction rather than a reimplementation of either, because the composition is
 * the point: path-lod bounds deviation from the chord, emitVertexAt bounds the
 * gap between emitted vertices, and only the two together describe the drawing.
 */
const BUNDLED_TRAIL = 'static/data/example-10/teacher.csv'
/** example-10's floor plan is 1551x1833; 800x600 is a typical container. */
const SOURCE = { width: 1551, height: 1833 }
const SCREEN = { width: 800, height: 600 }

const loadBundledTrail = (file: string) => {
  const lines = readFileSync(file, 'utf8').trim().split(/\r?\n/)
  const head = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const ti = head.indexOf('time')
  const xi = head.indexOf('x')
  const yi = head.indexOf('y')
  const trail: DataPoint[] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',')
    const time = +cells[ti]
    const x = +cells[xi]
    const y = +cells[yi]
    if (Number.isFinite(time) && Number.isFinite(x) && Number.isFinite(y)) {
      trail.push(new DataPoint('', time, x, y))
    }
  }
  trail.sort((a, b) => (a.time ?? 0) - (b.time ?? 0))
  return trail
}

/** Distance from p to the segment a-b, clamped to the segment. */
const toSegment = (p: number[], a: number[], b: number[]) => {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const lengthSq = dx * dx + dy * dy
  let t = lengthSq < 1e-12 ? 0 : ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lengthSq
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy))
}

/**
 * The polyline the renderer actually draws for `view`, in screen pixels.
 *
 * Both measurements below read this, so they cannot drift apart over what counts
 * as a drawn vertex. Consecutive duplicates collapse because emitVertexAt emits
 * LINES pairs — each point arrives as the end of one pair and the start of the
 * next. Repeats of a position visited *elsewhere* in the trail are kept: they
 * are genuinely emitted vertices, and folding them together would understate
 * the floor plan, where the subject crosses its own path, while leaving the
 * space-time view untouched, where strictly increasing time makes a repeat
 * impossible.
 *
 * `project` stands in for the view: the floor plan reads (x, y), the space-time
 * view reads (time, y).
 */
const drawnPolyline = (
  trail: DataPoint[],
  lod: Int32Array | null,
  budget: number,
  project: (point: DataPoint) => [number, number]
) => {
  const drawn: [number, number][] = []
  // Set before construction so the threshold comes from the budget by the same
  // route production uses, rather than being assigned onto the instance.
  ConfigStore.set({ ...initialConfig, pathSimplification: budget })
  const dm = new DrawMovement(
    {
      PLAN: 0,
      SPACETIME: 1,
      vertex: (x: number, y: number) => {
        const last = drawn[drawn.length - 1]
        if (last === undefined || last[0] !== x || last[1] !== y) drawn.push([x, y])
      },
    } as unknown as IgsP5,
    {
      createAugmentPoint: (_view: number, point: DataPoint) => {
        const [x, y] = project(point)
        return { point, pos: { viewXPos: x, floorPlanYPos: y, zPos: 0 } }
      },
    } as unknown as DrawUtils
  )
  dm.lod = lod
  dm.drawSegmentVerticesAsLines(1, trail, 0, trail.length - 1)
  return drawn
}

/**
 * Worst distance, in screen pixels, from any original point to the polyline the
 * renderer actually draws for `view`.
 *
 * The walk is single-pass. Every drawn vertex is the projection of some trail
 * point, produced by this same `project`, so an exact float comparison advances
 * the drawn-polyline cursor in step with the trail — which keeps this O(points)
 * rather than O(points x vertices) on a sixty-thousand-point trail. Measuring
 * against the cursor's segment rather than the whole polyline can only
 * overstate the distance, so the bound it reports is conservative.
 */
const renderedError = (
  trail: DataPoint[],
  lod: Int32Array | null,
  budget: number,
  project: (point: DataPoint) => [number, number]
) => {
  const drawn = drawnPolyline(trail, lod, budget, project)
  if (drawn.length < 2) return Infinity

  let worst = 0
  let cursor = 0
  for (const point of trail) {
    const p = project(point)
    const next = drawn[cursor + 1]
    if (next !== undefined && p[0] === next[0] && p[1] === next[1] && cursor + 2 < drawn.length) {
      cursor++
    }
    worst = Math.max(worst, toSegment(p, drawn[cursor], drawn[cursor + 1]))
  }
  return worst
}

/** How many vertices the renderer emits for `view`, after both reductions. */
const drawnVertexCount = (
  trail: DataPoint[],
  lod: Int32Array | null,
  budget: number,
  project: (point: DataPoint) => [number, number]
) => drawnPolyline(trail, lod, budget, project).length

describe('the drawn path against a bundled dataset', () => {
  const trail = loadBundledTrail(BUNDLED_TRAIL)

  afterEach(() => {
    ConfigStore.set({ ...initialConfig })
  })

  const sx = SCREEN.width / SOURCE.width
  const sy = SCREEN.height / SOURCE.height

  /** Screen scales for a given visible timeline window, in seconds. */
  const scalesFor = (windowSeconds: number) =>
    quantizeScales({ sx, sy, st: SCREEN.width / windowSeconds })

  const planOf =
    (s: ViewScales) =>
    (p: DataPoint): [number, number] => [(p.x ?? 0) * s.sx, (p.y ?? 0) * s.sy]
  const spacetimeOf =
    (s: ViewScales) =>
    (p: DataPoint): [number, number] => [(p.time ?? 0) * s.st, (p.y ?? 0) * s.sy]

  const fullSpan = (trail[trail.length - 1].time ?? 0) - (trail[0].time ?? 0)

  it('loaded the dataset the header quotes', () => {
    expect(trail.length).toBe(60680)
  })

  /**
   * The composed bound. Each stage is allowed the budget, so the pair can exceed
   * it: a point can sit a budget from a chord whose own endpoints the gap rule
   * then moved. Measured at about 1.7x across both views and both zoom levels,
   * so 2x is the claim, with the measured figures in the header.
   */
  const COMPOSED = 2

  it('keeps the drawn path within the composed bound, in both views, at both zooms', () => {
    for (const windowSeconds of [fullSpan, 30]) {
      const scales = scalesFor(windowSeconds)
      for (const budget of [1, 4]) {
        const lod = buildPathLod(trail, budget, scales)
        expect(renderedError(trail, lod, budget, planOf(scales))).toBeLessThanOrEqual(
          budget * COMPOSED
        )
        expect(renderedError(trail, lod, budget, spacetimeOf(scales))).toBeLessThanOrEqual(
          budget * COMPOSED
        )
      }
    }
  })

  // The time axis is what makes the bound survive timeline zoom, and this is the
  // measurement that justifies its cost. At full view it is nearly collapsed and
  // changes nothing; zoomed to thirty seconds, a reduction blind to it drifts an
  // order of magnitude past the budget.
  it('needs the time axis once the timeline is zoomed, and not before', () => {
    const budget = 1
    for (const [windowSeconds, timeBlindShouldExceed] of [
      [fullSpan, false],
      [30, true],
    ] as const) {
      const scales = scalesFor(windowSeconds)
      const spacetime = spacetimeOf(scales)
      const withTime = buildPathLod(trail, budget, scales)
      const blind = buildPathLod(trail, budget, { ...scales, st: 0 })

      expect(renderedError(trail, withTime, budget, spacetime)).toBeLessThanOrEqual(
        budget * COMPOSED
      )
      const blindError = renderedError(trail, blind, budget, spacetime)
      if (timeBlindShouldExceed) expect(blindError).toBeGreaterThan(10)
      else expect(blindError).toBeLessThanOrEqual(budget * COMPOSED)
    }
  })

  // The case for keeping a per-view gap rule at all: the shared reduction holds
  // points that only the space-time view needs, and the floor plan can drop
  // them. The effect grows with zoom, because that is when the reduction keeps
  // most for the time axis.
  // The case for a per-view gap rule at all. The shared reduction keeps points
  // for whichever view needs them; each view then drops the ones it has no use
  // for, and the two disagree sharply. Zoomed in, the time axis has spread the
  // reduction's points across the space-time view, so nearly all of them earn
  // their place there — while on the floor plan many sit on top of each other
  // and an eighth go. A reduction shared between views cannot make that call.
  it('prunes each view independently', () => {
    const budget = 1
    const scales = scalesFor(10)
    const lod = buildPathLod(trail, budget, scales)
    const planDropped = 1 - drawnVertexCount(trail, lod, budget, planOf(scales)) / lod.length
    const spacetimeDropped =
      1 - drawnVertexCount(trail, lod, budget, spacetimeOf(scales)) / lod.length
    expect(planDropped).toBeGreaterThan(0.08)
    expect(spacetimeDropped).toBeLessThan(0.02)
  })

  // The slider has to reach the output: a tighter budget must produce a
  // measurably tighter drawn path, not just a tighter intermediate list.
  it('narrows the drawn path as the budget narrows', () => {
    const scales = scalesFor(fullSpan)
    const plan = planOf(scales)
    const fine = renderedError(trail, buildPathLod(trail, 1, scales), 1, plan)
    const coarse = renderedError(trail, buildPathLod(trail, 4, scales), 4, plan)
    expect(fine).toBeLessThan(2)
    expect(coarse).toBeGreaterThan(4)
  })
})
