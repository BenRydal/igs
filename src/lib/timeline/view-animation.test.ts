import { beforeEach, describe, expect, it } from 'vitest'
import { timelineV2Store } from './store'
import { goToView, isJump, zoomBy, zoomToFit } from './view-animation'

const view = () => {
  const { viewStart, viewEnd } = timelineV2Store.getState()
  return { start: viewStart, end: viewEnd }
}

beforeEach(() => timelineV2Store.initialize(100, 0))

describe('zoomBy', () => {
  it('halves the view around its centre', () => {
    zoomBy(0.5)
    expect(view().start).toBeCloseTo(25, 10)
    expect(view().end).toBeCloseTo(75, 10)
  })

  it('stops zooming out at the whole recording', () => {
    zoomBy(2)
    expect(view()).toEqual({ start: 0, end: 100 })
  })

  it('stops zooming in at one second', () => {
    for (let i = 0; i < 40; i++) zoomBy(0.5)
    expect(view().end - view().start).toBeCloseTo(1, 10)
  })
})

describe('zoomToFit', () => {
  it('returns to the whole recording', () => {
    timelineV2Store.setView(40, 60)
    zoomToFit()
    expect(view()).toEqual({ start: 0, end: 100 })
  })
})

describe('goToView', () => {
  it('lands on the requested view', () => {
    goToView({ start: 30, end: 50 })
    expect(view()).toEqual({ start: 30, end: 50 })
  })

  it('keeps the view inside the recording', () => {
    goToView({ start: -20, end: 140 })
    expect(view()).toEqual({ start: 0, end: 100 })
  })
})

describe('isJump', () => {
  const full = { start: 0, end: 100 }

  it('treats a wheel-sized nudge as continuous', () => {
    expect(isJump(full, { start: 2, end: 98 })).toBe(false)
    expect(isJump({ start: 20, end: 40 }, { start: 22, end: 42 })).toBe(false)
  })

  it('treats a drag-selected region as a jump', () => {
    expect(isJump(full, { start: 30, end: 50 })).toBe(true)
  })

  it('treats a long pan at the same zoom as a jump', () => {
    expect(isJump({ start: 0, end: 20 }, { start: 60, end: 80 })).toBe(true)
  })
})
