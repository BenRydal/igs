import { describe, expect, it } from 'vitest'
import { Take } from './take'
import { createSampler } from './sampler'

const pt = (time: number, x = time, y = 0) => ({ time, x, y })
const times = (trail: { time: number | null }[]) => trail.map((p) => p.time)

describe('Take', () => {
  const base = [pt(0), pt(1), pt(2), pt(3), pt(4), pt(5)]

  it('replaces only the recorded range and keeps both sides', () => {
    const take = new Take(base, 1.5)
    take.add(pt(1.5, 100))
    take.add(pt(2.5, 100))
    take.add(pt(3.2, 100))
    expect(times(take.trail())).toEqual([0, 1, 1.5, 2.5, 3.2, 4, 5])
    expect(take.replaced).toBe(2)
  })

  it('extends past the end of the existing trail', () => {
    const take = new Take(base, 4.5)
    take.add(pt(4.5))
    take.add(pt(7))
    expect(times(take.trail())).toEqual([0, 1, 2, 3, 4, 4.5, 7])
  })

  it('continues an empty trail', () => {
    const take = new Take<ReturnType<typeof pt>>([], 10)
    take.add(pt(10))
    take.add(pt(11))
    expect(times(take.trail())).toEqual([10, 11])
  })

  it('replaces a point exactly at the recorded time', () => {
    const take = new Take(base, 2)
    take.add(pt(2, 50))
    expect(take.trail().find((p) => p.time === 2)?.x).toBe(50)
    expect(times(take.trail())).toEqual([0, 1, 2, 3, 4, 5])
  })

  it('leaves the trail untouched until a point is recorded', () => {
    const take = new Take(base, 2)
    expect(take.trail()).toEqual(base)
  })

  it('rejects a point that goes back in time', () => {
    const take = new Take(base, 2)
    expect(take.add(pt(3))).toBe(true)
    expect(take.add(pt(2.5))).toBe(false)
    expect(times(take.trail())).toEqual([0, 1, 3, 4, 5])
  })

  it('does not mutate the base trail', () => {
    const copy = base.map((p) => ({ ...p }))
    const take = new Take(base, 0)
    take.add(pt(0, 9))
    take.add(pt(9))
    expect(base).toEqual(copy)
  })
})

describe('createSampler', () => {
  it('always accepts the first position, even at time zero', () => {
    const s = createSampler()
    expect(s.accept(0, 5, 5)).toBe(true)
  })

  it('samples fast while moving and slowly while still', () => {
    const s = createSampler({
      activeInterval: 0.1,
      heartbeatInterval: 1,
      minMovement: 2,
      adaptive: true,
    })
    s.accept(0, 0, 0)
    expect(s.accept(0.05, 10, 0)).toBe(false)
    expect(s.accept(0.1, 10, 0)).toBe(true)
    expect(s.accept(0.5, 10.5, 0)).toBe(false)
    expect(s.accept(1.1, 10.5, 0)).toBe(true)
  })

  it('uses a fixed interval when not adaptive', () => {
    const s = createSampler({
      activeInterval: 0.25,
      heartbeatInterval: 5,
      minMovement: 2,
      adaptive: false,
    })
    s.accept(0, 0, 0)
    expect(s.accept(0.25, 0, 0)).toBe(true)
  })

  it('starts over when time jumps backwards', () => {
    const s = createSampler()
    s.accept(10, 0, 0)
    expect(s.accept(3, 0, 0)).toBe(true)
  })
})
