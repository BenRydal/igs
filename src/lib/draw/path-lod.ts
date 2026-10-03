/**
 * Render-time level of detail for movement paths.
 *
 * Reduction here is derived, never destructive: this returns indices into a
 * user's trail and the trail keeps every point, so selection, stop durations,
 * hover, the data table and export all read full-resolution truth. Only vertex
 * emission reads the result.
 *
 * **The bound.** RDP runs on the trail mapped into screen pixels along all three
 * axes it is ever drawn against — floor-plan x, floor-plan y, timeline time —
 * and bounds the 3D distance from each original point to the kept polyline by
 * `epsilon`. A coordinate projection never increases a distance, so every view
 * inherits that bound rather than needing its own: the floor plan drops the time
 * axis, the 2D space-time view drops floor-plan x, the 3D cube uses all three.
 *
 * The time axis is what makes the bound survive timeline zoom. It is nearly
 * collapsed at full view — about 0.18 px/s on example-10/teacher.csv — and
 * stretches as the window narrows, so measuring only (x, y) drifts an order of
 * magnitude past the budget in the space-time view and the 3D cube once zoomed
 * in. Scales are per axis because the floor plan can be stretched independently
 * on each.
 *
 * **What reaches the screen** is this reduction and the per-view gap rule in
 * DrawMovement.emitVertexAt, which reads the same budget. Each stage is allowed
 * epsilon, so the pair can exceed it: a point can sit a budget from a chord
 * whose endpoints the gap rule then moves. Measured between about 1x and 1.7x
 * of the budget, and asserted in draw-movement.test.ts under "the drawn path against a
 * bundled dataset", which is where the current figures are.
 *
 * Deliberately not bounded: the vertical gap between true and drawn paths read
 * at equal time, which runs to ~20px. For a near-vertical space-time segment — a
 * fast traverse — that gap is the perpendicular distance over the cosine of the
 * slope, so it diverges for any distance-to-path reduction. Reading an exact
 * height at an instant is the hover dot's job, and that reads the full trail.
 *
 * **A vertex at every pause.** Each stop run's first and last index is pinned,
 * so the drawn polyline visits every place the subject stopped. Insurance, not a
 * dependency: stop detection reads the full trail, and the effect is bounded by
 * epsilon anyway, since RDP would keep a stop sitting further than epsilon from
 * the chord.
 *
 * **Caching** keys on the view scales as well as the trail revision, since the
 * reduction depends on both. The time scale is quantized upward in steps of
 * sqrt(2), so a zoom drag crosses a couple of dozen buckets rather than
 * rebuilding every frame; upward keeps the quantized scale at or above the real
 * one, which keeps the bound conservative rather than loose.
 *
 * Builds in ~7ms on the largest bundled dataset (example-10/teacher.csv, 60,680
 * points).
 */

import type { DataPoint } from '../../models/dataPoint'
import type { User } from '../../models/user'

/** Points below this count are never worth reducing. */
const MIN_POINTS_TO_REDUCE = 64

/**
 * Screen pixels per unit of each axis the trail is drawn against.
 *
 * `sx` and `sy` are per source coordinate unit and already account for floor
 * plan rotation, which swaps which data axis drives which screen axis. `st` is
 * per second along whichever time axis is currently projected — the 2D timeline
 * or the 3D cube's depth.
 */
export interface ViewScales {
  sx: number
  sy: number
  st: number
}

interface CachedLod {
  revision: number
  epsilon: number
  /** Already quantized, so comparing against a fresh quantizeScales is exact. */
  scales: ViewScales
  indices: Int32Array
}

/**
 * Keyed on the User object so a cleared or reimported dataset drops its entry
 * without bookkeeping. `revision` catches trail edits that leave the length
 * unchanged, which is why it exists on User at all.
 */
const lodCache = new WeakMap<User, CachedLod>()

/**
 * A non-finite scale treated as a collapsed one.
 *
 * Insurance for the cache rather than for the arithmetic. NaN !== NaN, so a NaN
 * in the key would miss the cache every frame and rebuild a six-figure trail
 * each time — a far worse failure than losing the axis. Infinity is no better:
 * it would carry straight into the projected coordinates.
 */
function finite(value: number): number {
  return Number.isFinite(value) ? value : 0
}

/**
 * Rounds a scale up to the next power of sqrt(2).
 *
 * Upward, not nearest: a quantized scale below the real one would stretch the
 * error budget along that axis and break the bound this module exists to
 * guarantee. Above it only costs a few extra vertices.
 */
function quantizeScale(value: number): number {
  // `!(value > 0)` catches zero, negatives and NaN; Infinity passes it and
  // would come back out of the exponent as Infinity, so it needs finite() too.
  if (!(value > 0)) return 0
  return finite(2 ** (Math.ceil(Math.log2(value) * 2) / 2))
}

/**
 * The cache-key form of a scale set. Exported so the renderer and the tests
 * agree on what counts as the same view without duplicating the rule.
 */
export function quantizeScales(scales: ViewScales): ViewScales {
  return {
    // Spatial scales change only on resize or rotation, so plain rounding is
    // enough to stop sub-pixel container jitter invalidating the cache.
    sx: finite(Math.round(scales.sx * 1e4) / 1e4),
    sy: finite(Math.round(scales.sy * 1e4) / 1e4),
    st: quantizeScale(scales.st),
  }
}

/**
 * Indices this user's path should emit vertices for, or null to emit every point.
 *
 * @param user the user whose trail to reduce
 * @param epsilon error budget in screen pixels; <= 0 disables
 * @param scales screen pixels per unit of each drawn axis, or null if unknown
 */
export function getPathLod(
  user: User,
  epsilon: number,
  scales: ViewScales | null
): Int32Array | null {
  const trail = user.dataTrail
  if (epsilon <= 0 || scales === null || trail.length < MIN_POINTS_TO_REDUCE) return null

  const q = quantizeScales(scales)
  // A zero scale collapses its axis; with all three collapsed there is no
  // projection left to measure an error in. Spelt `!(x > 0)` rather than
  // `x <= 0` so a non-finite value reads as collapsed even if it reached here
  // without passing through quantizeScales.
  if (!(q.sx > 0) && !(q.sy > 0) && !(q.st > 0)) return null

  const cached = lodCache.get(user)
  if (
    cached !== undefined &&
    cached.revision === user.revision &&
    cached.epsilon === epsilon &&
    sameScales(cached.scales, q)
  ) {
    return cached.indices
  }

  const indices = buildPathLod(trail, epsilon, q)
  lodCache.set(user, { revision: user.revision, epsilon, scales: q, indices })
  return indices
}

/** Whether two quantized scale sets describe the same view. */
function sameScales(a: ViewScales, b: ViewScales): boolean {
  return a.sx === b.sx && a.sy === b.sy && a.st === b.st
}

/** Drops every cached reduction. Exposed for tests. */
export function clearPathLodCache(user: User): void {
  lodCache.delete(user)
}

/**
 * Stop-anchored Ramer-Douglas-Peucker over a trail, returning kept indices.
 *
 * Exported separately from the cache so it can be tested as a pure function.
 * `scales` is used as given — callers that want the cache's quantization should
 * pass the result of quantizeScales.
 */
export function buildPathLod(trail: DataPoint[], epsilon: number, scales: ViewScales): Int32Array {
  const keep = new Uint8Array(trail.length)
  if (trail.length === 0) return new Int32Array(0)

  keep[0] = 1
  keep[trail.length - 1] = 1
  markStopBoundaries(trail, keep)

  // One pass into screen pixels up front, so the inner loop reads a flat array
  // of the values the error is actually measured in rather than re-scaling each
  // candidate on every visit.
  const projected = projectToPixels(trail, scales)

  // RDP runs between consecutive anchors so an anchor is never simplified away.
  const anchors: number[] = []
  for (let i = 0; i < trail.length; i++) if (keep[i] === 1) anchors.push(i)

  for (let a = 0; a < anchors.length - 1; a++) {
    simplifyBetween(projected, keep, anchors[a], anchors[a + 1], epsilon)
  }

  let kept = 0
  for (let i = 0; i < trail.length; i++) kept += keep[i]
  const indices = new Int32Array(kept)
  let next = 0
  for (let i = 0; i < trail.length; i++) if (keep[i] === 1) indices[next++] = i
  return indices
}

/**
 * The trail as interleaved (x, y, time) triples in screen pixels.
 *
 * The three axes are deliberately in the same space and the same units: that is
 * what makes a single Euclidean distance a meaningful bound for all of them at
 * once.
 */
function projectToPixels(trail: DataPoint[], scales: ViewScales): Float64Array {
  const projected = new Float64Array(trail.length * 3)
  for (let i = 0; i < trail.length; i++) {
    const point = trail[i]
    projected[i * 3] = (point.x ?? 0) * scales.sx
    projected[i * 3 + 1] = (point.y ?? 0) * scales.sy
    projected[i * 3 + 2] = (point.time ?? 0) * scales.st
  }
  return projected
}

/**
 * Marks the first and last index of every stop as an anchor.
 *
 * A stop is a run of consecutive points at identical coordinates — the same rule
 * Core.updateStopValues uses, exact float equality included, so the two agree on
 * what a stop is. Reads raw coordinates rather than projected ones because exact
 * equality is scale-invariant and scaling could only introduce rounding.
 */
function markStopBoundaries(trail: DataPoint[], keep: Uint8Array): void {
  for (let i = 0; i < trail.length; i++) {
    const x = trail[i].x ?? 0
    const y = trail[i].y ?? 0
    let end = i
    while (end < trail.length && (trail[end].x ?? 0) === x && (trail[end].y ?? 0) === y) end++
    if (end - i > 1) {
      keep[i] = 1
      keep[end - 1] = 1
    }
    i = end - 1
  }
}

/**
 * RDP over the open interval between two anchors, in 3D pixel space.
 *
 * Iterative with an explicit stack: a trail can run to six figures of points,
 * and recursion risks blowing the call stack on adversarial input.
 */
function simplifyBetween(
  projected: Float64Array,
  keep: Uint8Array,
  from: number,
  to: number,
  epsilon: number
): void {
  if (to <= from + 1) return

  const stack: number[] = [from, to]
  while (stack.length > 0) {
    const end = stack.pop() as number
    const start = stack.pop() as number
    if (end <= start + 1) continue

    const ax = projected[start * 3]
    const ay = projected[start * 3 + 1]
    const at = projected[start * 3 + 2]
    const dx = projected[end * 3] - ax
    const dy = projected[end * 3 + 1] - ay
    const dt = projected[end * 3 + 2] - at
    const spanLengthSq = dx * dx + dy * dy + dt * dt

    let worstDistance = -1
    let worstIndex = -1
    for (let i = start + 1; i < end; i++) {
      const px = projected[i * 3] - ax
      const py = projected[i * 3 + 1] - ay
      const pt = projected[i * 3 + 2] - at

      // Must be distance to the chord as a *segment*, clamped at both ends, not
      // to the infinite line through it. The infinite-line formula is the common
      // shorthand and is cheaper, but it understates the error wherever a path
      // doubles back inside a span: a point can sit near the line while being far
      // from the piece that actually gets drawn, which breaks the budget this
      // module exists to guarantee. A zero-length span degenerates to distance
      // from its endpoint.
      let t = spanLengthSq < 1e-12 ? 0 : (px * dx + py * dy + pt * dt) / spanLengthSq
      if (t < 0) t = 0
      else if (t > 1) t = 1
      const ex = px - t * dx
      const ey = py - t * dy
      const et = pt - t * dt
      const distance = Math.sqrt(ex * ex + ey * ey + et * et)

      if (distance > worstDistance) {
        worstDistance = distance
        worstIndex = i
      }
    }

    if (worstDistance > epsilon && worstIndex !== -1) {
      keep[worstIndex] = 1
      stack.push(start, worstIndex, worstIndex, end)
    }
  }
}

/**
 * First position in `indices` holding a value >= `target`.
 *
 * `indices` is sorted ascending, so the renderer can find a segment's slice of
 * the reduction without scanning.
 */
export function lowerBound(indices: Int32Array, target: number): number {
  let low = 0
  let high = indices.length
  while (low < high) {
    const mid = (low + high) >>> 1
    if (indices[mid] < target) low = mid + 1
    else high = mid
  }
  return low
}
