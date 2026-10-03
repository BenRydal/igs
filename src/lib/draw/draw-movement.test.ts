import { afterEach, describe, it, expect } from 'vitest'
import { DrawMovement } from './draw-movement.js'
import { DataPoint } from '../../models/dataPoint.js'
import ConfigStore, { initialConfig } from '../../stores/configStore'
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
const SPACING = 100 // comfortably past MIN_PIXEL_DISTANCE_SQ (8px)

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
  // The reduction bounds deviation in source units; MIN_PIXEL_DISTANCE_SQ bounds
  // the gap between vertices in screen pixels after zoom. Both apply.
  const tightTrail = (count: number) =>
    Array.from({ length: count }, (_, i) => new DataPoint('', i, i, 0))

  it('drops interior points closer together than the pixel threshold', () => {
    const { dm, vertices } = makeEmitter()
    dm.lod = null
    // 1px apart, well under the 8px threshold.
    dm.drawSegmentVerticesAsLines(1, tightTrail(6), 0, 5)
    // Only the two forced endpoints survive.
    expect(vertices).toEqual([0, 5])
  })

  it('exempts the segment endpoints from the threshold', () => {
    const { dm, vertices } = makeEmitter()
    dm.lod = new Int32Array([0, 1, 2, 3])
    dm.drawSegmentVerticesAsLines(1, tightTrail(4), 0, 3)
    expect(vertices).toEqual([0, 3])
  })

  it('keeps points once they clear the threshold', () => {
    const { dm, vertices } = makeEmitter()
    dm.lod = null
    const trail = [0, 20, 40].map((x, i) => new DataPoint('', i, x, 0))
    dm.drawSegmentVerticesAsLines(1, trail, 0, 2)
    expect(vertices).toEqual([0, 20, 20, 40])
  })
})
