import { beforeEach, describe, expect, it } from 'vitest'
import { get } from 'svelte/store'
import { timelineV2Store } from './store'

// Covers the state plumbing and coordinate conversions in store.ts;
// timeline/utils.test.ts covers the pure math they delegate to (mapRange,
// zoomAtPoint, panView).
//
// Every read path here goes through a synchronous mirror of the store value
// rather than the store itself. The mirror is only correct if it tracks every
// mutator, so each mutator below is followed by a conversion that depends on
// the field it wrote.

/** A 100-second dataset laid out across pixels 0..1000. */
const setupTimeline = () => {
  timelineV2Store.initialize(100, 0)
  timelineV2Store.updateXPositions(0, 1000)
}

beforeEach(setupTimeline)

describe('timelineV2Store.getState', () => {
  it('matches the subscribed value', () => {
    expect(timelineV2Store.getState()).toEqual(get(timelineV2Store))
  })

  it('reflects a mutation immediately, with no tick in between', () => {
    timelineV2Store.setCurrentTime(42)
    expect(timelineV2Store.getState().currentTime).toBe(42)
    expect(get(timelineV2Store).currentTime).toBe(42)
  })
})

describe('timelineV2Store coordinate conversion', () => {
  it('maps time to pixel across the full data range', () => {
    expect(timelineV2Store.timeToPixel(0)).toBe(0)
    expect(timelineV2Store.timeToPixel(50)).toBe(500)
    expect(timelineV2Store.timeToPixel(100)).toBe(1000)
  })

  it('maps pixel back to time', () => {
    expect(timelineV2Store.pixelToTime(0)).toBe(0)
    expect(timelineV2Store.pixelToTime(250)).toBe(25)
    expect(timelineV2Store.pixelToTime(1000)).toBe(100)
  })

  it('round-trips time -> pixel -> time', () => {
    expect(timelineV2Store.pixelToTime(timelineV2Store.timeToPixel(37))).toBeCloseTo(37, 10)
  })

  it('reports the view window in pixels', () => {
    // A fresh initialize sets the view to the whole data range.
    expect(timelineV2Store.getViewStartPixel()).toBe(0)
    expect(timelineV2Store.getViewEndPixel()).toBe(1000)
  })

  it('treats the full view as an identity for the view-pixel conversions', () => {
    expect(timelineV2Store.pixelToViewPixel(300)).toBeCloseTo(300, 10)
    expect(timelineV2Store.viewPixelToPixel(300)).toBeCloseTo(300, 10)
  })

  it('reports overAxis against the view window', () => {
    expect(timelineV2Store.overAxis(-1)).toBe(false)
    expect(timelineV2Store.overAxis(0)).toBe(true)
    expect(timelineV2Store.overAxis(500)).toBe(true)
    expect(timelineV2Store.overAxis(1000)).toBe(true)
    expect(timelineV2Store.overAxis(1001)).toBe(false)
  })
})

describe('timelineV2Store mirror stays in sync with every mutator', () => {
  it('tracks initialize, which is the only writer of dataStart/dataEnd', () => {
    timelineV2Store.initialize(200, 0)
    // The data range doubled, so a given time now maps to half the pixel.
    expect(timelineV2Store.timeToPixel(100)).toBe(500)
  })

  it('tracks updateXPositions', () => {
    timelineV2Store.updateXPositions(100, 600)
    expect(timelineV2Store.timeToPixel(0)).toBe(100)
    expect(timelineV2Store.timeToPixel(100)).toBe(600)
    expect(timelineV2Store.overAxis(50)).toBe(false)
    expect(timelineV2Store.overAxis(100)).toBe(true)
  })

  it('tracks setView', () => {
    timelineV2Store.setView(25, 75)
    expect(timelineV2Store.getViewStartPixel()).toBe(250)
    expect(timelineV2Store.getViewEndPixel()).toBe(750)
    expect(timelineV2Store.overAxis(100)).toBe(false)
    expect(timelineV2Store.overAxis(500)).toBe(true)
  })

  // The factor multiplies the view duration, so values below 1 zoom in and
  // values above 1 zoom out. The result is clamped to the data range, which is
  // why zoom(2) on a full view is a no-op.
  it('tracks zoom in', () => {
    timelineV2Store.zoom(0.5, 50)
    const { viewStart, viewEnd } = timelineV2Store.getState()
    expect(viewEnd - viewStart).toBeCloseTo(50, 10)
    expect(timelineV2Store.getViewStartPixel()).toBeCloseTo(250, 10)
    expect(timelineV2Store.getViewEndPixel()).toBeCloseTo(750, 10)
  })

  it('clamps zoom out at the full data range', () => {
    timelineV2Store.zoom(2, 50)
    const { viewStart, viewEnd } = timelineV2Store.getState()
    expect(viewStart).toBe(0)
    expect(viewEnd).toBe(100)
  })

  it('tracks a zoom in followed by a zoom back out', () => {
    timelineV2Store.zoom(0.5, 50)
    expect(timelineV2Store.getViewStartPixel()).toBeCloseTo(250, 10)
    timelineV2Store.zoom(2, 50)
    expect(timelineV2Store.getViewStartPixel()).toBeCloseTo(0, 10)
    expect(timelineV2Store.getViewEndPixel()).toBeCloseTo(1000, 10)
  })

  it('tracks pan', () => {
    timelineV2Store.setView(0, 50)
    timelineV2Store.pan(10)
    const { viewStart, viewEnd } = timelineV2Store.getState()
    expect(viewStart).toBeCloseTo(10, 10)
    expect(viewEnd).toBeCloseTo(60, 10)
    expect(timelineV2Store.getViewStartPixel()).toBeCloseTo(100, 10)
  })

  it('tracks zoomToFit', () => {
    timelineV2Store.setView(40, 60)
    expect(timelineV2Store.getViewStartPixel()).toBe(400)
    timelineV2Store.zoomToFit()
    expect(timelineV2Store.getViewStartPixel()).toBe(0)
    expect(timelineV2Store.getViewEndPixel()).toBe(1000)
  })

  it('tracks setCurrentTime', () => {
    timelineV2Store.setCurrentTime(80)
    expect(timelineV2Store.getState().currentTime).toBe(80)
  })
})

describe('timelineV2Store view-pixel conversions under zoom', () => {
  it('expands the zoomed window to fill the axis', () => {
    // Zoom to the middle half of the data: times 25..75, pixels 250..750.
    timelineV2Store.setView(25, 75)
    // viewPixelToPixel maps the view window back onto the full axis, so the
    // window's own edges land on the axis edges.
    expect(timelineV2Store.viewPixelToPixel(250)).toBeCloseTo(0, 10)
    expect(timelineV2Store.viewPixelToPixel(750)).toBeCloseTo(1000, 10)
    expect(timelineV2Store.viewPixelToPixel(500)).toBeCloseTo(500, 10)
  })

  it('is the inverse of pixelToViewPixel', () => {
    timelineV2Store.setView(25, 75)
    const roundTrip = timelineV2Store.viewPixelToPixel(timelineV2Store.pixelToViewPixel(300))
    expect(roundTrip).toBeCloseTo(300, 10)
  })
})
