import { describe, expect, it } from 'vitest'
import { buildPathLod, getPathLod, clearPathLodCache, lowerBound } from './path-lod'
import { DataPoint } from '../../models/dataPoint'
import { User, nextRevision } from '../../models/user'

const pt = (time: number, x: number, y: number) => new DataPoint('', time, x, y)

/** Perpendicular distance from p to the segment a-b, clamped to the segment. */
const distanceToSegment = (p: DataPoint, a: DataPoint, b: DataPoint) => {
  const ax = a.x ?? 0
  const ay = a.y ?? 0
  const dx = (b.x ?? 0) - ax
  const dy = (b.y ?? 0) - ay
  const lengthSq = dx * dx + dy * dy
  let t = lengthSq < 1e-12 ? 0 : (((p.x ?? 0) - ax) * dx + ((p.y ?? 0) - ay) * dy) / lengthSq
  t = Math.max(0, Math.min(1, t))
  return Math.hypot((p.x ?? 0) - (ax + t * dx), (p.y ?? 0) - (ay + t * dy))
}

/** Worst distance from any original point to the kept polyline. */
const worstError = (trail: DataPoint[], indices: Int32Array) => {
  let worst = 0
  for (let i = 0; i < trail.length; i++) {
    let best = Infinity
    for (let k = 0; k < indices.length - 1; k++) {
      best = Math.min(best, distanceToSegment(trail[i], trail[indices[k]], trail[indices[k + 1]]))
    }
    if (indices.length === 1)
      best = distanceToSegment(trail[i], trail[indices[0]], trail[indices[0]])
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
    expect(Array.from(buildPathLod([], 1))).toEqual([])
  })

  it('keeps both endpoints', () => {
    const trail = [pt(0, 0, 0), pt(1, 1, 0), pt(2, 2, 0)]
    const indices = Array.from(buildPathLod(trail, 1))
    expect(indices[0]).toBe(0)
    expect(indices[indices.length - 1]).toBe(trail.length - 1)
  })

  it('reduces a straight line to its endpoints', () => {
    const trail = Array.from({ length: 50 }, (_, i) => pt(i, i, 0))
    expect(Array.from(buildPathLod(trail, 0.5))).toEqual([0, 49])
  })

  it('keeps a corner that exceeds the budget', () => {
    // A spike of height 10 at the midpoint.
    const trail = [pt(0, 0, 0), pt(1, 10, 10), pt(2, 20, 0)]
    expect(Array.from(buildPathLod(trail, 1))).toEqual([0, 1, 2])
  })

  it('drops a deviation inside the budget', () => {
    const trail = [pt(0, 0, 0), pt(1, 10, 0.5), pt(2, 20, 0)]
    expect(Array.from(buildPathLod(trail, 1))).toEqual([0, 2])
  })

  it('returns indices in ascending order with no duplicates', () => {
    const trail = Array.from({ length: 200 }, (_, i) => pt(i, i, Math.sin(i / 5) * 20))
    const indices = Array.from(buildPathLod(trail, 1))
    for (let i = 1; i < indices.length; i++) expect(indices[i]).toBeGreaterThan(indices[i - 1])
  })

  it('honours the error budget on a wiggly path', () => {
    const trail = Array.from({ length: 400 }, (_, i) => pt(i, i, Math.sin(i / 3) * 30))
    for (const epsilon of [0.5, 1, 2, 4]) {
      expect(worstError(trail, buildPathLod(trail, epsilon))).toBeLessThanOrEqual(epsilon + 1e-9)
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
    expect(Array.from(buildPathLod(trail, 1))).toEqual([0, 1, 2])
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
      expect(worstError(trail, buildPathLod(trail, epsilon))).toBeLessThanOrEqual(epsilon + 1e-9)
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
      expect(worstError(trail, buildPathLod(trail, epsilon))).toBeLessThanOrEqual(epsilon + 1e-9)
    }
  })

  it('keeps fewer points as the budget grows', () => {
    const trail = Array.from({ length: 400 }, (_, i) => pt(i, i, Math.sin(i / 3) * 30))
    const counts = [0.5, 1, 2, 4, 8].map((e) => buildPathLod(trail, e).length)
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i]).toBeLessThanOrEqual(counts[i - 1])
    }
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

    const indices = buildPathLod(trail, 1)
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
    const indices = Array.from(buildPathLod(trail, 1))
    for (const run of stopRuns(trail)) {
      expect(indices).toContain(run.start)
      expect(indices).toContain(run.end)
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
    const indices = Array.from(buildPathLod(trail, 1))
    expect(indices).toContain(0)
    expect(indices).toContain(1)
    expect(indices).toContain(4)
    expect(indices).toContain(5)
  })

  it('does not treat a single isolated point as a stop', () => {
    const trail = Array.from({ length: 80 }, (_, i) => pt(i, i, 0))
    expect(Array.from(buildPathLod(trail, 1))).toEqual([0, 79])
  })
})

describe('getPathLod caching', () => {
  const makeUser = (pointCount: number) => {
    const trail = Array.from({ length: pointCount }, (_, i) => pt(i, i, Math.sin(i / 3) * 30))
    return new User(trail, '#000', true, 'ana')
  }

  it('returns null when reduction is disabled', () => {
    expect(getPathLod(makeUser(500), 0)).toBeNull()
    expect(getPathLod(makeUser(500), -1)).toBeNull()
  })

  it('returns null for a trail too short to be worth reducing', () => {
    expect(getPathLod(makeUser(10), 1)).toBeNull()
  })

  it('returns the same array on a repeated call', () => {
    const user = makeUser(500)
    expect(getPathLod(user, 1)).toBe(getPathLod(user, 1))
  })

  it('rebuilds when epsilon changes', () => {
    const user = makeUser(500)
    const coarse = getPathLod(user, 4)
    const fine = getPathLod(user, 0.5)
    expect(fine).not.toBe(coarse)
    expect((fine as Int32Array).length).toBeGreaterThan((coarse as Int32Array).length)
  })

  it('rebuilds when the trail revision changes', () => {
    const user = makeUser(500)
    const first = getPathLod(user, 1)
    user.revision = nextRevision()
    expect(getPathLod(user, 1)).not.toBe(first)
  })

  // A transcript edit changes a point in place without changing dataTrail.length,
  // which is exactly why the cache keys on revision rather than on length.
  it('reflects an in-place trail edit once revision is bumped', () => {
    const user = makeUser(200)
    const before = getPathLod(user, 1) as Int32Array
    for (let i = 50; i < 150; i++) {
      user.dataTrail[i].x = 0
      user.dataTrail[i].y = 1000
    }
    user.revision = nextRevision()
    const after = getPathLod(user, 1) as Int32Array
    expect(Array.from(after)).not.toEqual(Array.from(before))
  })

  it('rebuilds after the cache entry is dropped', () => {
    const user = makeUser(500)
    const first = getPathLod(user, 1)
    clearPathLodCache(user)
    expect(getPathLod(user, 1)).not.toBe(first)
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
