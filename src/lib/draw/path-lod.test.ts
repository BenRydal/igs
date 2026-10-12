import { describe, expect, it } from 'vitest'
import {
  buildPathLod,
  getPathLod,
  clearPathLodCache,
  lowerBound,
  quantizeScales,
  type ViewScales,
} from './path-lod'
import { DataPoint } from '../../models/dataPoint'
import { User, nextRevision } from '../../models/user'

const pt = (time: number, x: number, y: number) => new DataPoint('', time, x, y)

/** Unit scales keep the fixtures readable: one source unit is one pixel. */
const UNIT: ViewScales = { sx: 1, sy: 1, st: 1 }

/**
 * A point reduced to the coordinates one view actually draws.
 *
 * The three below are the projections the reduction has to hold up under. Each
 * drops one axis of the scaled space RDP works in, which is exactly why a bound
 * there is a bound here: a coordinate projection never increases a distance.
 */
type Projection = (p: DataPoint) => number[]

const planView =
  (s: ViewScales): Projection =>
  (p) => [(p.x ?? 0) * s.sx, (p.y ?? 0) * s.sy]

const spacetimeView =
  (s: ViewScales): Projection =>
  (p) => [(p.time ?? 0) * s.st, (p.y ?? 0) * s.sy]

const scaledSpace =
  (s: ViewScales): Projection =>
  (p) => [(p.x ?? 0) * s.sx, (p.y ?? 0) * s.sy, (p.time ?? 0) * s.st]

/** Distance from p to the segment a-b, clamped to the segment, in any dimension. */
const distanceToSegment = (p: number[], a: number[], b: number[]) => {
  let lengthSq = 0
  for (let d = 0; d < a.length; d++) lengthSq += (b[d] - a[d]) ** 2
  let dot = 0
  for (let d = 0; d < a.length; d++) dot += (p[d] - a[d]) * (b[d] - a[d])
  let t = lengthSq < 1e-12 ? 0 : dot / lengthSq
  t = Math.max(0, Math.min(1, t))
  let sum = 0
  for (let d = 0; d < a.length; d++) sum += (p[d] - (a[d] + t * (b[d] - a[d]))) ** 2
  return Math.sqrt(sum)
}

/**
 * Worst distance from any original point to the kept polyline, as `project`
 * sees both of them.
 */
const worstError = (trail: DataPoint[], indices: Int32Array, project: Projection) => {
  const kept = Array.from(indices).map((i) => project(trail[i]))
  let worst = 0
  for (let i = 0; i < trail.length; i++) {
    const p = project(trail[i])
    let best = Infinity
    for (let k = 0; k < kept.length - 1; k++) {
      best = Math.min(best, distanceToSegment(p, kept[k], kept[k + 1]))
    }
    if (kept.length === 1) best = distanceToSegment(p, kept[0], kept[0])
    worst = Math.max(worst, best)
  }
  return worst
}

/** Stop runs as Core.updateStopValues defines them: consecutive identical x/y. */
const stopRuns = (trail: DataPoint[]) => {
  const runs: { start: number; end: number; duration: number }[] = []
  for (let i = 0; i < trail.length; i++) {
    let end = i
    while (
      end < trail.length &&
      (trail[end].x ?? 0) === (trail[i].x ?? 0) &&
      (trail[end].y ?? 0) === (trail[i].y ?? 0)
    )
      end++
    if (end - i > 1) {
      runs.push({
        start: i,
        end: end - 1,
        duration: (trail[end - 1].time ?? 0) - (trail[i].time ?? 0),
      })
    }
    i = end - 1
  }
  return runs
}

describe('buildPathLod', () => {
  it('returns an empty result for an empty trail', () => {
    expect(Array.from(buildPathLod([], 1, UNIT))).toEqual([])
  })

  it('keeps both endpoints', () => {
    const trail = [pt(0, 0, 0), pt(1, 1, 0), pt(2, 2, 0)]
    const indices = Array.from(buildPathLod(trail, 1, UNIT))
    expect(indices[0]).toBe(0)
    expect(indices[indices.length - 1]).toBe(trail.length - 1)
  })

  it('reduces a straight line to its endpoints', () => {
    const trail = Array.from({ length: 50 }, (_, i) => pt(i, i, 0))
    expect(Array.from(buildPathLod(trail, 0.5, UNIT))).toEqual([0, 49])
  })

  it('keeps a corner that exceeds the budget', () => {
    // A spike of height 10 at the midpoint.
    const trail = [pt(0, 0, 0), pt(1, 10, 10), pt(2, 20, 0)]
    expect(Array.from(buildPathLod(trail, 1, UNIT))).toEqual([0, 1, 2])
  })

  it('drops a deviation inside the budget', () => {
    const trail = [pt(0, 0, 0), pt(1, 10, 0.5), pt(2, 20, 0)]
    expect(Array.from(buildPathLod(trail, 1, UNIT))).toEqual([0, 2])
  })

  it('returns indices in ascending order with no duplicates', () => {
    const trail = Array.from({ length: 200 }, (_, i) => pt(i, i, Math.sin(i / 5) * 20))
    const indices = Array.from(buildPathLod(trail, 1, UNIT))
    for (let i = 1; i < indices.length; i++) expect(indices[i]).toBeGreaterThan(indices[i - 1])
  })

  it('honours the error budget on a wiggly path', () => {
    const trail = Array.from({ length: 400 }, (_, i) => pt(i, i, Math.sin(i / 3) * 30))
    for (const epsilon of [0.5, 1, 2, 4]) {
      const indices = buildPathLod(trail, epsilon, UNIT)
      expect(worstError(trail, indices, planView(UNIT))).toBeLessThanOrEqual(epsilon + 1e-9)
      expect(worstError(trail, indices, spacetimeView(UNIT))).toBeLessThanOrEqual(epsilon + 1e-9)
    }
  })

  // Minimal regression for the measure RDP uses internally. The path overshoots
  // to x=20 and comes back to x=10, so the interior point sits only 0.5 from the
  // *infinite line* through the chord (0,0)->(10,0) but ~10px from the chord
  // itself — and the chord is what gets drawn. The common infinite-line RDP
  // shorthand discards the point here and blows the budget twentyfold; measured
  // on static/data/example-5/teacher.csv it produced a 42.44px worst-case error
  // at epsilon=1.
  it('measures distance to the drawn segment, not the infinite line through it', () => {
    const trail = [pt(0, 0, 0), pt(1, 20, 0.5), pt(2, 10, 0)]
    expect(Array.from(buildPathLod(trail, 1, UNIT))).toEqual([0, 1, 2])
  })

  // Regression: the budget must hold against the *drawn segment*, not the
  // infinite line through it. A path that doubles back inside a span can leave a
  // point near that line while far from the piece actually drawn, and the common
  // infinite-line RDP shorthand silently understates the error there. The sine
  // path above never doubles back in x, so it could not catch this.
  it('honours the budget on a path that doubles back on itself', () => {
    const trail: DataPoint[] = []
    let t = 0
    for (let lap = 0; lap < 12; lap++) {
      // Out along x, then straight back over the same ground, offset slightly.
      for (let x = 0; x <= 200; x += 4) trail.push(pt(t++, x, lap * 3))
      for (let x = 200; x >= 0; x -= 4) trail.push(pt(t++, x, lap * 3 + 1.5))
    }
    for (const epsilon of [0.5, 1, 2, 4]) {
      const indices = buildPathLod(trail, epsilon, UNIT)
      expect(worstError(trail, indices, planView(UNIT))).toBeLessThanOrEqual(epsilon + 1e-9)
      expect(worstError(trail, indices, spacetimeView(UNIT))).toBeLessThanOrEqual(epsilon + 1e-9)
    }
  })

  it('honours the budget on a sharp spike that reverses direction', () => {
    // Straight run, one long excursion straight back along itself, straight run.
    const trail: DataPoint[] = []
    let t = 0
    for (let x = 0; x <= 100; x += 2) trail.push(pt(t++, x, 0))
    for (let x = 100; x >= 0; x -= 2) trail.push(pt(t++, x, 40))
    for (let x = 0; x <= 100; x += 2) trail.push(pt(t++, x, 80))
    for (const epsilon of [0.5, 1, 2]) {
      const indices = buildPathLod(trail, epsilon, UNIT)
      expect(worstError(trail, indices, planView(UNIT))).toBeLessThanOrEqual(epsilon + 1e-9)
      expect(worstError(trail, indices, spacetimeView(UNIT))).toBeLessThanOrEqual(epsilon + 1e-9)
    }
  })

  it('keeps fewer points as the budget grows', () => {
    const trail = Array.from({ length: 400 }, (_, i) => pt(i, i, Math.sin(i / 3) * 30))
    const counts = [0.5, 1, 2, 4, 8].map((e) => buildPathLod(trail, e, UNIT).length)
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i]).toBeLessThanOrEqual(counts[i - 1])
    }
  })
})

describe('buildPathLod error bound across views', () => {
  /**
   * A fast traverse followed by a long near-stationary hold.
   *
   * Spatially the whole span is one straight line, so a reduction measuring
   * error in (x, y) alone keeps only its endpoints. That is harmless while the
   * time axis is nearly collapsed, and wrong once the timeline is zoomed, when
   * the same two kept points are drawn minutes apart across the space-time view
   * and the hold has to be inferred from a diagonal. The hold drifts by a fifth
   * of a pixel so it is not an exact stop and gets no anchoring help.
   */
  const rampThenHold = () => {
    const trail: DataPoint[] = []
    for (let k = 0; k <= 20; k++) trail.push(pt(k * 0.05, k * 5, k * 5))
    for (let k = 1; k <= 300; k++) trail.push(pt(1 + k * 0.1, 100 + (k % 2) * 0.2, 100))
    return trail
  }

  /**
   * The bound has to survive timeline zoom, which is what the time axis is for.
   *
   * Properties only, over a fixture built to exercise them. The figures for the
   * real renderer on a real dataset are asserted in draw-movement.test.ts, under
   * "the drawn path against a bundled dataset".
   */
  it('holds the budget in every view as the time scale grows', () => {
    const trail = rampThenHold()
    for (const st of [0.2, 2, 20, 200]) {
      const scales: ViewScales = { sx: 1, sy: 1, st }
      const indices = buildPathLod(trail, 1, scales)
      expect(worstError(trail, indices, planView(scales))).toBeLessThanOrEqual(1 + 1e-9)
      expect(worstError(trail, indices, spacetimeView(scales))).toBeLessThanOrEqual(1 + 1e-9)
      expect(worstError(trail, indices, scaledSpace(scales))).toBeLessThanOrEqual(1 + 1e-9)
    }
  })

  // Guards the test above from passing vacuously: the fixture has to be one the
  // time axis genuinely rescues, so assert that dropping the axis breaks it.
  it('would exceed the budget without the time axis, and does not', () => {
    const trail = rampThenHold()
    const zoomed: ViewScales = { sx: 1, sy: 1, st: 200 }
    const blindToTime = buildPathLod(trail, 1, { sx: 1, sy: 1, st: 0 })
    expect(worstError(trail, blindToTime, spacetimeView(zoomed))).toBeGreaterThan(10)
    expect(
      worstError(trail, buildPathLod(trail, 1, zoomed), spacetimeView(zoomed))
    ).toBeLessThanOrEqual(1 + 1e-9)
  })

  // The guarantee is stated on the scaled 3D space; each view is a coordinate
  // projection of it. Pinning the 3D bound is what makes the per-view bounds
  // follow rather than coincide.
  it('holds the budget in the scaled space the reduction works in', () => {
    const trail = rampThenHold()
    for (const epsilon of [0.5, 1, 2]) {
      const indices = buildPathLod(trail, epsilon, UNIT)
      expect(worstError(trail, indices, scaledSpace(UNIT))).toBeLessThanOrEqual(epsilon + 1e-9)
    }
  })

  it('holds the budget under anisotropic scales', () => {
    // Aspect ratio unpreserved and a zoomed-in timeline: all three axes differ.
    const scales: ViewScales = { sx: 0.4, sy: 1.7, st: 12 }
    const trail = Array.from({ length: 500 }, (_, i) =>
      pt(i * 0.3, i + Math.sin(i / 7) * 4, Math.cos(i / 11) * 60)
    )
    for (const epsilon of [1, 3]) {
      const indices = buildPathLod(trail, epsilon, scales)
      expect(worstError(trail, indices, planView(scales))).toBeLessThanOrEqual(epsilon + 1e-9)
      expect(worstError(trail, indices, spacetimeView(scales))).toBeLessThanOrEqual(epsilon + 1e-9)
      expect(worstError(trail, indices, scaledSpace(scales))).toBeLessThanOrEqual(epsilon + 1e-9)
    }
  })

  // A collapsed axis is a real state: before the floorplan loads, or with a
  // zero-length recording. The remaining axes must still be bounded.
  it('holds the budget when the time axis is collapsed', () => {
    const scales: ViewScales = { sx: 1, sy: 1, st: 0 }
    const trail = Array.from({ length: 300 }, (_, i) => pt(i, i, Math.sin(i / 4) * 25))
    const indices = buildPathLod(trail, 1, scales)
    expect(worstError(trail, indices, planView(scales))).toBeLessThanOrEqual(1 + 1e-9)
  })

  // Scales are per axis, so the budget means the same number of pixels on each
  // one however unevenly the floor plan is stretched to fit.
  it('spends the full budget on an axis compressed by the aspect ratio', () => {
    const scales: ViewScales = { sx: 1, sy: 0.1, st: 0 }
    // Deviations of 5 source units are 0.5px on the y axis, inside a 1px budget.
    const trail = Array.from({ length: 300 }, (_, i) => pt(i, i, (i % 2) * 5))
    expect(Array.from(buildPathLod(trail, 1, scales))).toEqual([0, 299])
  })
})

describe('buildPathLod stop preservation', () => {
  /** Alternating holds: 5 identical points per spot, then a move. */
  const heldTrail = () => {
    const trail: DataPoint[] = []
    for (let block = 0; block < 20; block++) {
      const x = block % 2 === 0 ? 10 : 400
      for (let k = 0; k < 5; k++) trail.push(pt(block * 0.5 + k * 0.1, x, x))
    }
    return trail
  }

  it('preserves every stop run and its duration', () => {
    const trail = heldTrail()
    const truth = stopRuns(trail)
    expect(truth).toHaveLength(20)

    const indices = buildPathLod(trail, 1, UNIT)
    const reduced = indices.length > 0 ? Array.from(indices).map((i) => trail[i]) : []
    const afterReduction = stopRuns(reduced)

    expect(afterReduction).toHaveLength(truth.length)
    expect(afterReduction.map((r) => r.duration)).toEqual(truth.map((r) => r.duration))
  })

  // This is the failure mode the anchoring exists to prevent: a stationary run is
  // perfectly collinear, so unanchored RDP discards its whole interior and the
  // run's endpoints stop being adjacent, erasing the stop.
  it('would lose stops without anchoring, and does not', () => {
    const trail = heldTrail()
    const indices = Array.from(buildPathLod(trail, 1, UNIT))
    for (const run of stopRuns(trail)) {
      expect(indices).toContain(run.start)
      expect(indices).toContain(run.end)
    }
  })

  // Anchoring reads raw coordinates, so it must not depend on the view scales —
  // including a degenerate scale set that collapses the space entirely.
  it('anchors stops regardless of the view scales', () => {
    const trail = heldTrail()
    for (const scales of [UNIT, { sx: 0.01, sy: 0.01, st: 0.01 }, { sx: 9, sy: 0.2, st: 40 }]) {
      const indices = Array.from(buildPathLod(trail, 1, scales))
      for (const run of stopRuns(trail)) {
        expect(indices).toContain(run.start)
        expect(indices).toContain(run.end)
      }
    }
  })

  it('anchors a stop at the very start and the very end of a trail', () => {
    const trail = [
      pt(0, 5, 5),
      pt(1, 5, 5),
      pt(2, 100, 100),
      pt(3, 200, 200),
      pt(4, 9, 9),
      pt(5, 9, 9),
    ]
    const indices = Array.from(buildPathLod(trail, 1, UNIT))
    expect(indices).toContain(0)
    expect(indices).toContain(1)
    expect(indices).toContain(4)
    expect(indices).toContain(5)
  })

  it('does not treat a single isolated point as a stop', () => {
    const trail = Array.from({ length: 80 }, (_, i) => pt(i, i, 0))
    expect(Array.from(buildPathLod(trail, 1, UNIT))).toEqual([0, 79])
  })
})

describe('quantizeScales', () => {
  // Rounding the time scale *up* is what keeps the bound conservative: a
  // quantized scale below the real one would stretch the budget along that axis.
  it('rounds the time scale up to the next power of root two', () => {
    expect(quantizeScales({ sx: 1, sy: 1, st: 1 }).st).toBeCloseTo(1)
    expect(quantizeScales({ sx: 1, sy: 1, st: 1.5 }).st).toBeCloseTo(2)
    expect(quantizeScales({ sx: 1, sy: 1, st: 1.9 }).st).toBeCloseTo(2)
    expect(quantizeScales({ sx: 1, sy: 1, st: 3 }).st).toBeCloseTo(4)
  })

  it('never returns a time scale below the one given', () => {
    for (let v = 0.01; v < 500; v *= 1.07) {
      expect(quantizeScales({ sx: 1, sy: 1, st: v }).st).toBeGreaterThanOrEqual(v - 1e-12)
    }
  })

  it('leaves a collapsed time scale collapsed', () => {
    expect(quantizeScales({ sx: 1, sy: 1, st: 0 }).st).toBe(0)
  })

  // Every scale reaches a cache key, and NaN !== NaN would miss it on every
  // frame and rebuild a six-figure trail each time — far worse than losing the
  // axis. Infinity would poison the projected coordinates instead.
  it('folds a non-finite scale to zero', () => {
    for (const bad of [NaN, Infinity, -Infinity]) {
      const q = quantizeScales({ sx: bad, sy: bad, st: bad })
      expect(q.sx).toBe(0)
      expect(q.sy).toBe(0)
      expect(q.st).toBe(0)
    }
  })

  it('treats an all-non-finite scale set as nothing to reduce against', () => {
    const trail = Array.from({ length: 500 }, (_, i) => pt(i, i, Math.sin(i / 3) * 30))
    const user = new User(trail, '#000', true, 'ana')
    expect(getPathLod(user, 1, { sx: NaN, sy: NaN, st: NaN })).toBeNull()
  })

  it('rounds the spatial scales to four decimals', () => {
    const q = quantizeScales({ sx: 0.123456789, sy: 2.987654321, st: 1 })
    expect(q.sx).toBe(0.1235)
    expect(q.sy).toBe(2.9877)
  })
})

describe('getPathLod caching', () => {
  const makeUser = (pointCount: number) => {
    const trail = Array.from({ length: pointCount }, (_, i) => pt(i, i, Math.sin(i / 3) * 30))
    return new User(trail, '#000', true, 'ana')
  }

  it('returns null when reduction is disabled', () => {
    expect(getPathLod(makeUser(500), 0, UNIT)).toBeNull()
    expect(getPathLod(makeUser(500), -1, UNIT)).toBeNull()
  })

  // Before a floorplan loads there is no scale to convert a pixel budget with,
  // so there is nothing to reduce against and every point is emitted.
  it('returns null when the view scales are unknown', () => {
    expect(getPathLod(makeUser(500), 1, null)).toBeNull()
  })

  it('returns null when every axis is collapsed', () => {
    expect(getPathLod(makeUser(500), 1, { sx: 0, sy: 0, st: 0 })).toBeNull()
  })

  it('returns null for a trail too short to be worth reducing', () => {
    expect(getPathLod(makeUser(10), 1, UNIT)).toBeNull()
  })

  it('returns the same array on a repeated call', () => {
    const user = makeUser(500)
    expect(getPathLod(user, 1, UNIT)).toBe(getPathLod(user, 1, UNIT))
  })

  it('rebuilds when epsilon changes', () => {
    const user = makeUser(500)
    const coarse = getPathLod(user, 4, UNIT)
    const fine = getPathLod(user, 0.5, UNIT)
    expect(fine).not.toBe(coarse)
    expect((fine as Int32Array).length).toBeGreaterThan((coarse as Int32Array).length)
  })

  // The reduction is measured in pixels, so a resize, a rotation or a timeline
  // zoom changes its result and has to change the key with it.
  it('rebuilds when a view scale changes', () => {
    const user = makeUser(500)
    const first = getPathLod(user, 1, UNIT)
    expect(getPathLod(user, 1, { ...UNIT, sx: 4 })).not.toBe(first)
    expect(getPathLod(user, 1, { ...UNIT, sy: 4 })).not.toBe(first)
    expect(getPathLod(user, 1, { ...UNIT, st: 16 })).not.toBe(first)
  })

  // The point of quantizing: a zoom drag emits a new scale every frame, and
  // rebuilding on each one would cost more than the reduction saves.
  it('reuses the reduction for a time-scale change inside one bucket', () => {
    const user = makeUser(500)
    const first = getPathLod(user, 1, { ...UNIT, st: 1.5 })
    expect(getPathLod(user, 1, { ...UNIT, st: 1.9 })).toBe(first)
  })

  it('rebuilds when the trail revision changes', () => {
    const user = makeUser(500)
    const first = getPathLod(user, 1, UNIT)
    user.revision = nextRevision()
    expect(getPathLod(user, 1, UNIT)).not.toBe(first)
  })

  // A transcript edit changes a point in place without changing dataTrail.length,
  // which is exactly why the cache keys on revision rather than on length.
  it('reflects an in-place trail edit once revision is bumped', () => {
    const user = makeUser(200)
    const before = getPathLod(user, 1, UNIT) as Int32Array
    for (let i = 50; i < 150; i++) {
      user.dataTrail[i].x = 0
      user.dataTrail[i].y = 1000
    }
    user.revision = nextRevision()
    const after = getPathLod(user, 1, UNIT) as Int32Array
    expect(Array.from(after)).not.toEqual(Array.from(before))
  })

  it('rebuilds after the cache entry is dropped', () => {
    const user = makeUser(500)
    const first = getPathLod(user, 1, UNIT)
    clearPathLodCache(user)
    expect(getPathLod(user, 1, UNIT)).not.toBe(first)
  })
})

describe('lowerBound', () => {
  const indices = new Int32Array([0, 5, 10, 15, 20])

  it('finds an exact match', () => {
    expect(lowerBound(indices, 10)).toBe(2)
  })

  it('rounds up between entries', () => {
    expect(lowerBound(indices, 11)).toBe(3)
  })

  it('returns 0 below the first entry', () => {
    expect(lowerBound(indices, -1)).toBe(0)
  })

  it('returns the length past the last entry', () => {
    expect(lowerBound(indices, 21)).toBe(indices.length)
  })

  it('agrees with a linear scan across the range', () => {
    for (let target = -2; target <= 23; target++) {
      let expected = indices.length
      for (let i = 0; i < indices.length; i++) {
        if (indices[i] >= target) {
          expected = i
          break
        }
      }
      expect(lowerBound(indices, target)).toBe(expected)
    }
  })
})
