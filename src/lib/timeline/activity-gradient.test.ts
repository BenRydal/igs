import { describe, expect, it } from 'vitest'
import { DataPoint } from '../../models/dataPoint'
import { User } from '../../models/user'
import { activityGradientCss, computeActivityBuckets } from './activity-gradient'

const person = (points: [time: number, x: number, y: number][], enabled = true) =>
  new User(
    points.map(([time, x, y]) => new DataPoint('', time, x, y)),
    '#000000',
    enabled,
    'ana'
  )

const walksThenStands = person([
  [0, 0, 0],
  [50, 500, 0],
  [100, 500, 0],
])

describe('computeActivityBuckets', () => {
  it('rates movement above standing still', () => {
    const buckets = computeActivityBuckets([walksThenStands], 0, 100)
    expect(buckets).toHaveLength(200)
    expect(buckets[10].activity).toBe(1)
    expect(buckets[150].activity).toBe(0)
    expect(buckets.every((bucket) => bucket.hasData)).toBe(true)
  })

  it('marks time nobody was recorded as having no data', () => {
    const buckets = computeActivityBuckets(
      [
        person([
          [0, 0, 0],
          [50, 100, 0],
        ]),
      ],
      0,
      100
    )
    expect(buckets[10].hasData).toBe(true)
    expect(buckets[150].hasData).toBe(false)
  })

  it('ignores people who are switched off', () => {
    const hidden = person(
      [
        [0, 0, 0],
        [100, 900, 0],
      ],
      false
    )
    const buckets = computeActivityBuckets([hidden], 0, 100)
    expect(buckets.some((bucket) => bucket.hasData)).toBe(false)
  })

  it('averages people who overlap in time', () => {
    const still = person([
      [0, 0, 0],
      [100, 0, 0],
    ])
    const alone = computeActivityBuckets([walksThenStands], 0, 100)
    const together = computeActivityBuckets([walksThenStands, still], 0, 100)
    expect(together[10].activity).toBe(alone[10].activity)
    expect(together[150].activity).toBe(0)
  })

  it('has nothing to show for an empty recording', () => {
    expect(computeActivityBuckets([walksThenStands], 0, 0)).toEqual([])
  })
})

describe('activityGradientCss', () => {
  it('is none without buckets', () => {
    expect(activityGradientCss([])).toBe('none')
  })

  it('paints each bucket as a hard-edged band across the whole recording', () => {
    const css = activityGradientCss(computeActivityBuckets([walksThenStands], 0, 100))
    expect(css.startsWith('linear-gradient(to right, rgba(0, 0, 0, 0.400) 0.000% 0.500%')).toBe(
      true
    )
    expect(css.endsWith('rgba(0, 0, 0, 0.080) 99.500% 100.000%)')).toBe(true)
  })

  it('paints unrecorded time fainter than standing still', () => {
    const css = activityGradientCss(
      computeActivityBuckets(
        [
          person([
            [0, 0, 0],
            [50, 100, 0],
          ]),
        ],
        0,
        100
      )
    )
    expect(css.endsWith('rgba(0, 0, 0, 0.03) 99.500% 100.000%)')).toBe(true)
  })
})
