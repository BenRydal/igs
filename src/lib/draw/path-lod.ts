/**
 * Render-time level of detail for movement paths.
 *
 * Reduction here is derived, never destructive: this returns indices into a
 * user's trail and the trail keeps every point, so selection, stop durations,
 * hover, the data table and export all read full-resolution truth. Only vertex
 * emission reads the result.
 *
 * Two properties it guarantees:
 *
 *  - **Bounded error.** Ramer-Douglas-Peucker keeps no original point further
 *    than `epsilon` from the drawn path, so the control is an error budget
 *    rather than a sampling rate. See simplifyBetween for the measure used.
 *  - **A vertex at every pause.** Each stop run's first and last index is
 *    pinned, so the drawn polyline visits every place the subject stopped. This
 *    is insurance, not a dependency: stop detection reads the full trail, and
 *    the effect is bounded by epsilon anyway, since RDP would keep a stop whose
 *    position sat further than epsilon from the chord. It costs ~4% more
 *    vertices.
 *
 * Cost on the largest bundled dataset (example-10/teacher.csv, 60,680 points):
 * ~4ms to build, 13,266 vertices at epsilon=1 source units.
 */

import type { DataPoint } from '../../models/dataPoint'
import type { User } from '../../models/user'

/** Points below this count are never worth reducing. */
const MIN_POINTS_TO_REDUCE = 64

interface CachedLod {
  revision: number
  epsilon: number
  indices: Int32Array
}

/**
 * Keyed on the User object so a cleared or reimported dataset drops its entry
 * without bookkeeping. `revision` catches trail edits that leave the length
 * unchanged, which is why it exists on User at all.
 */
const lodCache = new WeakMap<User, CachedLod>()

/**
 * Indices this user's path should emit vertices for, or null to emit every point.
 *
 * @param user the user whose trail to reduce
 * @param epsilon error budget in the trail's own coordinate units; <= 0 disables
 */
export function getPathLod(user: User, epsilon: number): Int32Array | null {
  const trail = user.dataTrail
  if (epsilon <= 0 || trail.length < MIN_POINTS_TO_REDUCE) return null

  const cached = lodCache.get(user)
  if (cached !== undefined && cached.revision === user.revision && cached.epsilon === epsilon) {
    return cached.indices
  }

  const indices = buildPathLod(trail, epsilon)
  lodCache.set(user, { revision: user.revision, epsilon, indices })
  return indices
}

/** Drops every cached reduction. Exposed for tests. */
export function clearPathLodCache(user: User): void {
  lodCache.delete(user)
}

/**
 * Stop-anchored Ramer-Douglas-Peucker over a trail, returning kept indices.
 *
 * Exported separately from the cache so it can be tested as a pure function.
 */
export function buildPathLod(trail: DataPoint[], epsilon: number): Int32Array {
  const keep = new Uint8Array(trail.length)
  if (trail.length === 0) return new Int32Array(0)

  keep[0] = 1
  keep[trail.length - 1] = 1
  markStopBoundaries(trail, keep)

  // RDP runs between consecutive anchors so an anchor is never simplified away.
  const anchors: number[] = []
  for (let i = 0; i < trail.length; i++) if (keep[i] === 1) anchors.push(i)

  for (let a = 0; a < anchors.length - 1; a++) {
    simplifyBetween(trail, keep, anchors[a], anchors[a + 1], epsilon)
  }

  let kept = 0
  for (let i = 0; i < trail.length; i++) kept += keep[i]
  const indices = new Int32Array(kept)
  let next = 0
  for (let i = 0; i < trail.length; i++) if (keep[i] === 1) indices[next++] = i
  return indices
}

/**
 * Marks the first and last index of every stop as an anchor.
 *
 * A stop is a run of consecutive points at identical coordinates — the same rule
 * Core.updateStopValues uses, exact float equality included, so the two agree on
 * what a stop is. See the module comment for what the pinning is and is not for.
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
 * RDP over the open interval between two anchors.
 *
 * Iterative with an explicit stack: a trail can run to six figures of points,
 * and recursion risks blowing the call stack on adversarial input.
 */
function simplifyBetween(
  trail: DataPoint[],
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

    const ax = trail[start].x ?? 0
    const ay = trail[start].y ?? 0
    const dx = (trail[end].x ?? 0) - ax
    const dy = (trail[end].y ?? 0) - ay
    const spanLengthSq = dx * dx + dy * dy

    let worstDistance = -1
    let worstIndex = -1
    for (let i = start + 1; i < end; i++) {
      const px = (trail[i].x ?? 0) - ax
      const py = (trail[i].y ?? 0) - ay

      // Must be distance to the chord as a *segment*, clamped at both ends, not
      // to the infinite line through it. The infinite-line formula is the common
      // shorthand and is cheaper, but it understates the error wherever a path
      // doubles back inside a span: a point can sit near the line while being far
      // from the piece that actually gets drawn, which breaks the budget this
      // module exists to guarantee. A zero-length span degenerates to distance
      // from its endpoint.
      let t = spanLengthSq < 1e-12 ? 0 : (px * dx + py * dy) / spanLengthSq
      if (t < 0) t = 0
      else if (t > 1) t = 1
      const distance = Math.hypot(px - t * dx, py - t * dy)

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
