import { describe, it, expect } from 'vitest'
import {
  clamp,
  mapRange,
  formatTime,
  calculateGridInterval,
  generateGridLines,
  zoomAtPoint,
  panView,
} from './utils'

// Characterization tests: these pin the timeline's pure math as it behaves
// today, so the svelte-p5 migration (and the later timeline evaluation phase)
// can refactor with a safety net.

describe('clamp', () => {
  it('passes through in-range values and clamps out-of-range ones', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(11, 0, 10)).toBe(10)
  })
})

describe('mapRange', () => {
  it('maps linearly between ranges', () => {
    expect(mapRange(5, 0, 10, 0, 100)).toBe(50)
    expect(mapRange(0, 0, 10, 20, 40)).toBe(20)
    expect(mapRange(10, 0, 10, 20, 40)).toBe(40)
  })

  it('extrapolates outside the input range (no clamping)', () => {
    expect(mapRange(15, 0, 10, 0, 100)).toBe(150)
    expect(mapRange(-5, 0, 10, 0, 100)).toBe(-50)
  })

  it('returns outStart for a degenerate input range', () => {
    expect(mapRange(7, 3, 3, 0, 100)).toBe(0)
  })
})

describe('formatTime', () => {
  it('formats hms with and without hours', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(65)).toBe('1:05')
    expect(formatTime(3600)).toBe('1:00:00')
    expect(formatTime(3661)).toBe('1:01:01')
  })

  it('handles ms and seconds formats', () => {
    // 'ms' wraps minutes at the hour (minutes are computed modulo 3600s)
    expect(formatTime(3661, 'ms')).toBe('1:01')
    expect(formatTime(1.25, 'seconds')).toBe('1.3s')
  })

  it('falls back to 0:00 for invalid input', () => {
    expect(formatTime(-5)).toBe('0:00')
    expect(formatTime(Infinity)).toBe('0:00')
    expect(formatTime(NaN)).toBe('0:00')
  })
})

describe('calculateGridInterval', () => {
  it('picks the smallest nice interval that keeps labels under the max', () => {
    expect(calculateGridInterval(10, 10)).toBe(1)
    expect(calculateGridInterval(100, 10)).toBe(10)
    expect(calculateGridInterval(600, 10)).toBe(60)
  })

  it('caps at one day for very long durations', () => {
    expect(calculateGridInterval(10_000_000, 10)).toBe(86400)
  })
})

describe('generateGridLines', () => {
  it('starts at the first interval boundary at or after viewStart', () => {
    const lines = generateGridLines(3, 30, 10)
    expect(lines[0].time).toBe(5)
    expect(lines[lines.length - 1].time).toBeLessThanOrEqual(30)
  })

  it('labels each line with formatTime', () => {
    const lines = generateGridLines(0, 30, 10)
    const at10 = lines.find((l) => l.time === 10)
    expect(at10?.label).toBe('0:10')
  })
})

describe('zoomAtPoint', () => {
  it('keeps the zoom center at the same relative position', () => {
    // View 0..100, zoom in 2x centered on 50 → 25..75
    const r = zoomAtPoint(0, 100, 0.5, 50, 0, 100, 1)
    expect(r.viewStart).toBeCloseTo(25)
    expect(r.viewEnd).toBeCloseTo(75)
  })

  it('clamps the new view to data bounds', () => {
    // Zoom out beyond the data → full data range
    const r = zoomAtPoint(20, 80, 10, 50, 0, 100, 1)
    expect(r.viewStart).toBe(0)
    expect(r.viewEnd).toBe(100)
  })

  it('respects the minimum zoom duration', () => {
    const r = zoomAtPoint(40, 60, 0.001, 50, 0, 100, 1)
    expect(r.viewEnd - r.viewStart).toBeCloseTo(1)
  })

  it('preserves the center ratio near an edge while staying in bounds', () => {
    // center 5 sits at 5% of the view; the zoomed window keeps it there
    const r = zoomAtPoint(0, 100, 0.5, 5, 0, 100, 1)
    expect(r.viewStart).toBeCloseTo(2.5)
    expect(r.viewEnd).toBeCloseTo(52.5)
  })
})

describe('panView', () => {
  it('shifts the window by deltaTime preserving duration', () => {
    const r = panView(10, 30, 5, 0, 100)
    expect(r).toEqual({ viewStart: 15, viewEnd: 35 })
  })

  it('clamps at the data start and end without shrinking', () => {
    expect(panView(10, 30, -20, 0, 100)).toEqual({ viewStart: 0, viewEnd: 20 })
    expect(panView(70, 90, 20, 0, 100)).toEqual({ viewStart: 80, viewEnd: 100 })
  })
})
