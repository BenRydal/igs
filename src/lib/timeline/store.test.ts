import { beforeEach, describe, expect, it } from 'vitest'
import { timelineV2Store } from './store'

describe('timelineV2Store.extendDataEnd', () => {
  beforeEach(() => timelineV2Store.initialize(60))

  it('grows the range and a full view without moving the playhead', () => {
    timelineV2Store.setCurrentTime(42)
    timelineV2Store.extendDataEnd(90)
    const s = timelineV2Store.getState()
    expect(s.dataEnd).toBe(90)
    expect(s.viewEnd).toBe(90)
    expect(s.currentTime).toBe(42)
  })

  it('leaves a zoomed view where it is', () => {
    timelineV2Store.setView(10, 20)
    timelineV2Store.extendDataEnd(90)
    const s = timelineV2Store.getState()
    expect(s.dataEnd).toBe(90)
    expect([s.viewStart, s.viewEnd]).toEqual([10, 20])
  })

  it('never shrinks the range', () => {
    timelineV2Store.extendDataEnd(30)
    expect(timelineV2Store.getState().dataEnd).toBe(60)
  })
})
