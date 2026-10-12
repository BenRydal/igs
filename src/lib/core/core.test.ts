import { beforeEach, describe, expect, it } from 'vitest'
import { get } from 'svelte/store'
import { Core } from './core'
import type { MovementRow } from './types.js'
import { DataPoint } from '../../models/dataPoint.js'
import UserStore from '../../stores/userStore'
import ConfigStore, { initialConfig } from '../../stores/configStore'
import type { IgsP5 } from '../p5/igs-p5'

// Tests for movement import and stop detection.
//
// Import keeps every valid row whatever the file's size or sample rate, and stop
// detection therefore measures runs at full resolution. These pin both halves:
// the trail a file produces, and the stop lengths that follow from an unthinned
// trail.
//
// Neither updateUsersForMovement nor updateStopValues touches the sketch, so a
// null one is sufficient.

const core = () => new Core(null as unknown as IgsP5)

/** Rows at a fixed sample period, walking diagonally so no two points match. */
const ramp = (count: number, period: number): MovementRow[] =>
  Array.from({ length: count }, (_, i) => ({ time: i * period, x: i, y: i }))

const trailOf = (name: string) => get(UserStore).find((u) => u.name === name)?.dataTrail ?? []

const point = (time: number, x: number, y: number) => new DataPoint('', time, x, y)

beforeEach(() => {
  UserStore.set([])
  ConfigStore.set({ ...initialConfig })
})

describe('Core.updateUsersForMovement', () => {
  it('keeps every valid row for a small file', () => {
    core().updateUsersForMovement(ramp(10, 0.02), 'ana')
    expect(trailOf('ana')).toHaveLength(10)
  })

  // File size does not gate import, so a large file keeps every row at any
  // sample rate. Reduction is a rendering concern; see lib/draw/path-lod.ts.
  it('keeps every valid row for a large file too, at any sample rate', () => {
    core().updateUsersForMovement(ramp(5000, 0.02), 'ana')
    expect(trailOf('ana')).toHaveLength(5000)
  })

  it('has no size cliff', () => {
    const c = core()
    c.updateUsersForMovement(ramp(3000, 0.1), 'ana')
    expect(trailOf('ana')).toHaveLength(3000)
    UserStore.set([])
    c.updateUsersForMovement(ramp(3001, 0.1), 'cam')
    expect(trailOf('cam')).toHaveLength(3001)
  })

  // The trail starts where the file does, so a t = 0 first row is never dropped.
  it('keeps the very first row, including t = 0, at every file size', () => {
    const c = core()
    c.updateUsersForMovement(ramp(5, 0.02), 'small')
    expect(trailOf('small')[0].time).toBe(0)
    c.updateUsersForMovement(ramp(5000, 0.02), 'large')
    expect(trailOf('large')[0].time).toBe(0)
  })

  // A junk first row is dropped on its own terms; it does not take the rest of
  // the file with it.
  it('keeps the remaining rows when the first row has a non-numeric time', () => {
    const badFirst = [{ time: 'nope', x: 0, y: 0 }, ...ramp(9, 1)] as unknown as MovementRow[]
    core().updateUsersForMovement(badFirst, 'ana')
    expect(trailOf('ana')).toHaveLength(9)
    expect(trailOf('ana')[0].time).toBe(0)
  })

  it('drops rows with a non-numeric time, x, or y', () => {
    const withJunk = [
      { time: 0, x: 1, y: 1 },
      { time: 'oops', x: 2, y: 2 },
      { time: 2, x: null, y: 3 },
      { time: 3, x: 4, y: 4 },
    ] as unknown as MovementRow[]
    core().updateUsersForMovement(withJunk, 'ana')
    expect(trailOf('ana').map((p) => p.time)).toEqual([0, 3])
  })

  it('creates a user with a trail and marks movement as loaded', () => {
    core().updateUsersForMovement(ramp(3, 1), 'ana')
    const user = get(UserStore).find((u) => u.name === 'ana')
    expect(user?.movementIsLoaded).toBe(true)
    expect(user?.enabled).toBe(true)
  })

  it('replaces rather than appends when the same user is loaded twice', () => {
    const c = core()
    c.updateUsersForMovement(ramp(5, 1), 'ana')
    c.updateUsersForMovement(ramp(3, 1), 'ana')
    expect(trailOf('ana')).toHaveLength(3)
    expect(get(UserStore)).toHaveLength(1)
  })
})

describe('Core.updateStopValues', () => {
  it('stamps a stop duration on every point of a run at identical coordinates', () => {
    const trail = [point(0, 10, 10), point(1, 10, 10), point(5, 10, 10), point(6, 99, 99)]
    core().updateStopValues(trail)
    // The run spans t=0..5, so all three of its points carry 5.
    expect(trail.map((p) => p.stopLength)).toEqual([5, 5, 5, 0])
  })

  it('gives a moving point a stop length of 0', () => {
    const trail = [point(0, 1, 1), point(1, 2, 2), point(2, 3, 3)]
    core().updateStopValues(trail)
    expect(trail.map((p) => p.stopLength)).toEqual([0, 0, 0])
  })

  it('only groups consecutive points, not revisits of the same place', () => {
    const trail = [point(0, 5, 5), point(1, 9, 9), point(2, 5, 5)]
    core().updateStopValues(trail)
    expect(trail.map((p) => p.stopLength)).toEqual([0, 0, 0])
  })

  it('raises maxStopLength to the longest stop found', () => {
    const trail = [point(0, 1, 1), point(4, 1, 1), point(5, 2, 2), point(20, 2, 2)]
    core().updateStopValues(trail)
    expect(get(ConfigStore).maxStopLength).toBe(15)
  })

  it('never lowers maxStopLength once raised', () => {
    const c = core()
    c.updateStopValues([point(0, 1, 1), point(30, 1, 1)])
    expect(get(ConfigStore).maxStopLength).toBe(30)
    c.updateStopValues([point(0, 2, 2), point(2, 2, 2)])
    expect(get(ConfigStore).maxStopLength).toBe(30)
  })

  // Stop length is measured from the points it is handed, so an input missing
  // the interior of a run reports a shorter stop or none at all. This is why
  // import keeps every row.
  it('measures stops only from the points it is given', () => {
    const full = [
      point(0.0, 7, 7),
      point(0.1, 7, 7),
      point(0.2, 7, 7),
      point(0.3, 7, 7),
      point(0.4, 8, 8),
    ]
    core().updateStopValues(full)
    expect(full[0].stopLength).toBeCloseTo(0.3, 10)

    // The same stop thinned to a single point: the run is length 1, so there is
    // no stop left to report.
    const sampled = [point(0.3, 7, 7), point(0.9, 8, 8)]
    core().updateStopValues(sampled)
    expect(sampled[0].stopLength).toBe(0)
  })

  it('detects no stops at all in float coordinates that never repeat exactly', () => {
    // Stands in for GPS data: toPixels emits unrounded Mercator floats, so the
    // exact-equality test in updateStopValues never fires.
    const jittery = Array.from({ length: 20 }, (_, i) => point(i, 100 + i * 1e-9, 200 + i * 1e-9))
    core().updateStopValues(jittery)
    expect(jittery.every((p) => p.stopLength === 0)).toBe(true)
  })

  it('groups null coordinates together as a spurious stop', () => {
    // Latent issue: `?? 0` collapses null x/y to (0, 0), so coordinate-less
    // points (e.g. speech before movement loads) form one run.
    const trail = [new DataPoint('hello', 0), new DataPoint('there', 4)]
    core().updateStopValues(trail)
    expect(trail.map((p) => p.stopLength)).toEqual([4, 4])
  })
})

describe('Core.updateStopValues at full resolution', () => {
  it('finds every stop in a trail of brief holds', () => {
    // A subject alternating between two spots, holding each for 0.4s while the
    // tracker emits at 0.1s. Each hold is a run of five identical points, and
    // all ten register — holds this brief only survive because the interior
    // points of each run are kept. static/data/example-2/adhir.csv holds 199
    // such stops, which collapse to 9 if a trail is thinned to one point per
    // half second.
    const held: MovementRow[] = []
    for (let block = 0; block < 10; block++) {
      const x = block % 2 === 0 ? 10 : 20
      for (let k = 0; k < 5; k++) {
        held.push({ time: block * 0.5 + k * 0.1, x, y: x })
      }
    }

    const c = core()
    c.updateUsersForMovement(held, 'ana')
    const trail = trailOf('ana')
    c.updateStopValues(trail)

    expect(trail).toHaveLength(50)
    expect(trail.every((p) => (p.stopLength ?? 0) > 0)).toBe(true)
  })

  it('reports exact stop boundaries rather than ones quantized to a sample gate', () => {
    const held: MovementRow[] = [
      { time: 0, x: 7, y: 7 },
      { time: 0.1, x: 7, y: 7 },
      { time: 0.2, x: 7, y: 7 },
      { time: 0.3, x: 7, y: 7 },
      { time: 0.4, x: 8, y: 8 },
    ]
    const c = core()
    c.updateUsersForMovement(held, 'ana')
    const trail = trailOf('ana')
    c.updateStopValues(trail)
    expect(trail[0].stopLength).toBeCloseTo(0.3, 10)
  })
})

// ============================================================
// Binary searches, pinned against linear-scan oracles
// ============================================================
//
// The conversation insert position and the code-range boundaries are binary
// searches. Each is pinned against a plain linear scan of the same predicate,
// following the convention in src/lib/p5/hit-test.test.ts.

/** The insert position by scan: first point strictly later than newTime. */
const scanInsertIndex = (trail: DataPoint[], newTime: number) => {
  const found = trail.findIndex((p) => (p.time ?? 0) > newTime)
  return found === -1 ? trail.length : found
}

/** The code-range boundaries by scan. */
const scanStartIndex = (points: DataPoint[], startTime: number) =>
  points.findIndex((p) => p.time !== null && p.time >= startTime)
const scanEndIndex = (points: DataPoint[], endTime: number) =>
  points.findLastIndex((p) => p.time !== null && p.time <= endTime)

/** Reaches the private helpers without loosening their visibility. */
const asInternals = (instance: Core) =>
  instance as unknown as {
    findInsertIndex(trail: DataPoint[], time: number): number
    firstIndexAtOrAfter(points: DataPoint[], time: number): number
    lastIndexAtOrBefore(points: DataPoint[], time: number): number
  }

describe('Core conversation insert position', () => {
  const trail = [0, 10, 20, 30, 40].map((t) => point(t, 0, 0))

  it('agrees with a linear scan across and between every sample', () => {
    const internals = asInternals(core())
    for (let time = -5; time <= 45; time += 1) {
      expect(internals.findInsertIndex(trail, time)).toBe(scanInsertIndex(trail, time))
    }
  })

  it('returns the upper bound, so equal times keep their existing order', () => {
    expect(asInternals(core()).findInsertIndex(trail, 20)).toBe(3)
  })

  it('appends past the end', () => {
    expect(asInternals(core()).findInsertIndex(trail, 100)).toBe(trail.length)
  })

  it('handles an empty and a single-point trail', () => {
    const internals = asInternals(core())
    expect(internals.findInsertIndex([], 5)).toBe(0)
    expect(internals.findInsertIndex([point(5, 0, 0)], 1)).toBe(0)
    expect(internals.findInsertIndex([point(5, 0, 0)], 9)).toBe(1)
  })

  it('agrees with a linear scan on repeated times', () => {
    const repeated = [0, 10, 10, 10, 20].map((t) => point(t, 0, 0))
    const internals = asInternals(core())
    for (const time of [-1, 0, 5, 10, 15, 20, 25]) {
      expect(internals.findInsertIndex(repeated, time)).toBe(scanInsertIndex(repeated, time))
    }
  })

  it('keeps the trail sorted when inserting conversation points one by one', () => {
    const c = core()
    const built = [0, 10, 20, 30].map((t) => point(t, 1, 1))
    for (const time of [25, 5, 35, 0, 15]) {
      c.addDataPointClosestByTimeInSeconds(built, new DataPoint('talk', time), built)
    }
    const times = built.map((p) => p.time as number)
    expect([...times]).toEqual([...times].sort((a, b) => a - b))
  })
})

describe('Core code-range boundaries', () => {
  const points = [0, 10, 20, 30, 40].map((t) => point(t, 0, 0))

  it('agrees with linear scans across the whole range', () => {
    const internals = asInternals(core())
    for (let time = -5; time <= 45; time += 1) {
      expect(internals.firstIndexAtOrAfter(points, time)).toBe(scanStartIndex(points, time))
      expect(internals.lastIndexAtOrBefore(points, time)).toBe(scanEndIndex(points, time))
    }
  })

  it('reports -1 when nothing qualifies, matching findIndex / findLastIndex', () => {
    const internals = asInternals(core())
    expect(internals.firstIndexAtOrAfter(points, 41)).toBe(-1)
    expect(internals.lastIndexAtOrBefore(points, -1)).toBe(-1)
  })

  it('is inclusive at both ends', () => {
    const internals = asInternals(core())
    expect(internals.firstIndexAtOrAfter(points, 20)).toBe(2)
    expect(internals.lastIndexAtOrBefore(points, 20)).toBe(2)
  })

  it('skips null-time points at the boundary, matching the scan predicates', () => {
    const withNulls = [new DataPoint('', null), new DataPoint('', null), point(10, 0, 0)]
    const internals = asInternals(core())
    expect(internals.firstIndexAtOrAfter(withNulls, 0)).toBe(scanStartIndex(withNulls, 0))
    expect(internals.lastIndexAtOrBefore(withNulls, 0)).toBe(scanEndIndex(withNulls, 0))
  })

  it('stamps exactly the covered points when applying a code', () => {
    const trail = [0, 10, 20, 30, 40].map((t) => point(t, 0, 0))
    core().updateDataTrailSegmentsWithCodes(trail, 'talk', 10, 30)
    expect(trail.map((p) => p.codes)).toEqual([[], ['talk'], ['talk'], ['talk'], []])
  })

  it('does not duplicate a code already present', () => {
    const trail = [0, 10].map((t) => point(t, 0, 0))
    const c = core()
    c.updateDataTrailSegmentsWithCodes(trail, 'talk', 0, 10)
    c.updateDataTrailSegmentsWithCodes(trail, 'talk', 0, 10)
    expect(trail[0].codes).toEqual(['talk'])
  })

  it('stamps nothing when the range falls outside the trail', () => {
    const trail = [0, 10].map((t) => point(t, 0, 0))
    core().updateDataTrailSegmentsWithCodes(trail, 'talk', 100, 200)
    expect(trail.every((p) => p.codes.length === 0)).toBe(true)
  })
})

describe('trail sort comparator', () => {
  // Every binary search over a trail — the draw range, the hover dot, the
  // code-range bounds, the conversation insert position — assumes it is sorted
  // by time, so the comparator has to be consistent. A subtraction is; the
  // shorthand `a > b ? 1 : -1` is not, because it never returns 0 and so claims
  // both orders for equal times, leaving ties unspecified.
  const sortLikeCore = (trail: DataPoint[]) =>
    [...trail].sort((a, b) => (a.time ?? 0) - (b.time ?? 0))

  const isSorted = (trail: DataPoint[]) =>
    trail.every((p, i) => i === 0 || (trail[i - 1].time ?? 0) <= (p.time ?? 0))

  it('sorts a shuffled trail', () => {
    const trail = [5, 1, 4, 2, 3].map((t) => point(t, t, t))
    expect(sortLikeCore(trail).map((p) => p.time)).toEqual([1, 2, 3, 4, 5])
  })

  it('leaves a trail sorted when many times are equal', () => {
    const trail = Array.from({ length: 200 }, (_, i) => point(i % 4, i, i))
    expect(isSorted(sortLikeCore(trail))).toBe(true)
  })

  it('is stable for equal times, so ties keep their original order', () => {
    const trail = [point(1, 10, 10), point(1, 20, 20), point(1, 30, 30)]
    expect(sortLikeCore(trail).map((p) => p.x)).toEqual([10, 20, 30])
  })

  it('treats a null time as 0 and sorts it to the front', () => {
    const trail = [point(5, 0, 0), new DataPoint('', null), point(1, 0, 0)]
    expect(sortLikeCore(trail).map((p) => p.time)).toEqual([null, 1, 5])
  })

  it('is idempotent, so repeated edits cannot degrade the order', () => {
    let trail = Array.from({ length: 300 }, (_, i) => point(i % 7, i, i))
    for (let pass = 0; pass < 5; pass++) {
      trail = sortLikeCore(trail)
      expect(isSorted(trail)).toBe(true)
    }
  })

  it('produces a trail the binary searches agree with', () => {
    const internals = asInternals(core())
    const trail = sortLikeCore([9, 3, 7, 1, 5, 3].map((t) => point(t, t, t)))
    for (let target = 0; target <= 10; target++) {
      const first = internals.firstIndexAtOrAfter(trail, target)
      if (first !== -1) {
        expect((trail[first].time ?? 0) >= target).toBe(true)
        if (first > 0) expect((trail[first - 1].time ?? 0) < target).toBe(true)
      }
      const last = internals.lastIndexAtOrBefore(trail, target)
      if (last !== -1) {
        expect((trail[last].time ?? 0) <= target).toBe(true)
        if (last < trail.length - 1) expect((trail[last + 1].time ?? 0) > target).toBe(true)
      }
    }
  })
})

describe('Core.reProcessAllMovementData stop threshold', () => {
  // The threshold keys off recording length alone. Row count is sample rate
  // times duration, so it cannot tell a long recording from a densely sampled
  // one; these pin that sampling density has no say in the result.
  const thresholdForRows = (rowCount: number, durationSeconds: number) => {
    UserStore.set([])
    const c = core()
    c.movementData = [
      {
        fileName: `f${rowCount}`,
        csvData: Array.from({ length: rowCount }, (_, i) => ({
          time: (i * durationSeconds) / (rowCount - 1),
          x: i,
          y: i,
        })),
      },
    ]
    c.reProcessAllMovementData()
    return get(ConfigStore).stopSliderValue
  }

  it('does not depend on how densely the same span was sampled', () => {
    // 60 seconds at 1Hz, 10Hz and 100Hz: wildly different row counts, one
    // recording length, so one threshold.
    const thresholds = [60, 600, 6000].map((rows) => thresholdForRows(rows, 60))
    expect(new Set(thresholds).size).toBe(1)
  })

  it('does depend on the recording length at a fixed row count', () => {
    expect(thresholdForRows(1000, 30)).toBe(1)
    expect(thresholdForRows(1000, 600)).toBe(5)
  })

  it('crosses no threshold at 3,000 rows', () => {
    // A plausible place for a row-count cliff to hide. Same duration either
    // side of it means same threshold.
    expect(thresholdForRows(2999, 600)).toBe(thresholdForRows(3001, 600))
  })
})

describe('default stop threshold', () => {
  // Scales with the recording's length: a one-second pause is significant in a
  // one-minute clip and noise in a ninety-minute lesson. A flat 5s default
  // showed zero stop circles on the shortest bundled datasets.
  const thresholdFor = (durationSeconds: number) => {
    const c = core()
    const rows = Math.max(2, Math.round(durationSeconds) + 1)
    c.movementData = [
      {
        fileName: 'f',
        csvData: Array.from({ length: rows }, (_, i) => ({
          time: (i * durationSeconds) / (rows - 1),
          x: i,
          y: i,
        })),
      },
    ]
    c.reProcessAllMovementData()
    return get(ConfigStore).stopSliderValue
  }

  it('gives a short recording 1 second', () => {
    expect(thresholdFor(37)).toBe(1) // example-1, 37 seconds
    expect(thresholdFor(66)).toBe(1) // example-15, 66 seconds
  })

  it('gives everything longer 5 seconds', () => {
    expect(thresholdFor(420)).toBe(5) // example-4, 7 minutes
    expect(thresholdFor(5725)).toBe(5) // example-10, 95 minutes
    expect(thresholdFor(100000)).toBe(5)
  })

  it('switches at a minute and a half', () => {
    expect(thresholdFor(90)).toBe(1)
    expect(thresholdFor(91)).toBe(5)
  })

  it('has only the two outcomes', () => {
    const seen = new Set([10, 60, 90, 120, 300, 1800, 5725].map(thresholdFor))
    expect([...seen].sort((a, b) => a - b)).toEqual([1, 5])
  })

  it('never goes below 1, the slider minimum', () => {
    expect(thresholdFor(1)).toBe(1)
    expect(thresholdFor(5)).toBe(1)
  })

  it('is monotonic in duration', () => {
    const seen = [10, 60, 120, 180, 240, 600, 3600].map(thresholdFor)
    for (let i = 1; i < seen.length; i++) {
      expect(seen[i]).toBeGreaterThanOrEqual(seen[i - 1])
    }
  })

  it('falls back to the configured default when no duration is known', () => {
    const c = core()
    c.movementData = []
    ConfigStore.set({ ...initialConfig, stopSliderValue: 42 })
    c.reProcessAllMovementData()
    expect(get(ConfigStore).stopSliderValue).toBe(initialConfig.stopSliderValue)
  })

  it('uses the longest file when several are loaded', () => {
    const c = core()
    c.movementData = [
      { fileName: 'short', csvData: ramp(50, 0.5) }, // ~25s
      { fileName: 'long', csvData: ramp(400, 1) }, // ~399s
    ]
    c.reProcessAllMovementData()
    expect(get(ConfigStore).stopSliderValue).toBe(5)
  })

  it('keeps every point of every file it reprocesses', () => {
    const c = core()
    c.movementData = [
      { fileName: 'a', csvData: ramp(4000, 0.1) },
      { fileName: 'b', csvData: ramp(50, 0.1) },
    ]
    c.reProcessAllMovementData()
    expect(trailOf('a')).toHaveLength(4000)
    expect(trailOf('b')).toHaveLength(50)
  })
})
