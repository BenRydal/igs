import type { User } from '../../models/user'

const NUM_BUCKETS = 200
const MIN_OPACITY = 0.08
const MAX_OPACITY = 0.4
const NO_DATA_COLOR = 'rgba(0, 0, 0, 0.03)'

export interface ActivityBucket {
  startTime: number
  endTime: number
  hasData: boolean
  activity: number
}

export function computeActivityBuckets(
  users: User[],
  dataStart: number,
  dataEnd: number
): ActivityBucket[] {
  const duration = dataEnd - dataStart
  if (duration <= 0) return []

  const bucketDuration = duration / NUM_BUCKETS
  const distance = new Float64Array(NUM_BUCKETS)
  const time = new Float64Array(NUM_BUCKETS)

  for (const user of users) {
    if (!user.enabled) continue
    const trail = user.dataTrail
    for (let i = 1; i < trail.length; i++) {
      const prev = trail[i - 1]
      const curr = trail[i]
      if (
        prev.x === null ||
        prev.y === null ||
        curr.x === null ||
        curr.y === null ||
        prev.time === null ||
        curr.time === null
      )
        continue
      const dt = curr.time - prev.time
      if (dt <= 0) continue

      const speed = Math.hypot(curr.x - prev.x, curr.y - prev.y) / dt
      const first = Math.max(0, Math.floor(((prev.time - dataStart) / duration) * NUM_BUCKETS))
      const last = Math.min(
        NUM_BUCKETS - 1,
        Math.floor(((curr.time - dataStart) / duration) * NUM_BUCKETS)
      )
      for (let b = first; b <= last; b++) {
        const bucketStart = dataStart + b * bucketDuration
        const overlap =
          Math.min(curr.time, bucketStart + bucketDuration) - Math.max(prev.time, bucketStart)
        if (overlap <= 0) continue
        distance[b] += speed * overlap
        time[b] += overlap
      }
    }
  }

  const speeds: number[] = []
  for (let b = 0; b < NUM_BUCKETS; b++) if (time[b] > 0) speeds.push(distance[b] / time[b])
  speeds.sort((a, b) => a - b)
  const p95 = speeds[Math.floor(speeds.length * 0.95)] || speeds[speeds.length - 1] || 0

  return Array.from({ length: NUM_BUCKETS }, (_, b) => {
    const hasData = time[b] > 0
    const speed = hasData ? distance[b] / time[b] : 0
    return {
      startTime: dataStart + b * bucketDuration,
      endTime: dataStart + (b + 1) * bucketDuration,
      hasData,
      activity: p95 > 0 ? Math.min(1, speed / p95) : speed,
    }
  })
}

export function activityGradientCss(buckets: ActivityBucket[]): string {
  if (buckets.length === 0) return 'none'
  const start = buckets[0].startTime
  const duration = buckets[buckets.length - 1].endTime - start
  const stops = buckets.map((bucket) => {
    const color = bucket.hasData
      ? `rgba(0, 0, 0, ${(MIN_OPACITY + bucket.activity * (MAX_OPACITY - MIN_OPACITY)).toFixed(3)})`
      : NO_DATA_COLOR
    const from = (((bucket.startTime - start) / duration) * 100).toFixed(3)
    const to = (((bucket.endTime - start) / duration) * 100).toFixed(3)
    return `${color} ${from}% ${to}%`
  })
  return `linear-gradient(to right, ${stops.join(', ')})`
}
