import { describe, it, expect } from 'vitest'
import { hitTest } from 'svelte-p5/utils'

// Parity tests: the sketch's overRect/overCircle used to be hand-rolled
// (igsSketch.ts pre-migration) and now delegate to svelte-p5's hitTest.
// These pin the old formulas' edge semantics against the library so the
// swap cannot silently change hover/selection behavior.

/** The pre-migration formulas, verbatim. */
const legacyOverRect = (
  mouseX: number,
  mouseY: number,
  x: number,
  y: number,
  boxWidth: number,
  boxHeight: number
) => mouseX >= x && mouseX <= x + boxWidth && mouseY >= y && mouseY <= y + boxHeight

const legacyOverCircle = (mouseX: number, mouseY: number, x: number, y: number, diameter: number) =>
  Math.sqrt((x - mouseX) ** 2 + (y - mouseY) ** 2) < diameter / 2

describe('hitTest.rect parity with legacy overRect', () => {
  const cases: [number, number, number, number, number, number][] = [
    [50, 50, 0, 0, 100, 100], // inside
    [0, 0, 0, 0, 100, 100], // top-left corner (inclusive)
    [100, 100, 0, 0, 100, 100], // bottom-right corner (inclusive)
    [100.01, 50, 0, 0, 100, 100], // just past right edge
    [-0.01, 50, 0, 0, 100, 100], // just past left edge
    [50, 101, 0, 0, 100, 100], // below
    [25, 30, 20, 20, 10, 10], // small rect inside
    [19.99, 25, 20, 20, 10, 10], // just outside small rect
  ]

  it.each(cases)('(%f, %f) vs rect(%f, %f, %f, %f)', (mx, my, x, y, w, h) => {
    expect(hitTest.rect(mx, my, x, y, w, h)).toBe(legacyOverRect(mx, my, x, y, w, h))
  })
})

describe('hitTest.circle parity with legacy overCircle', () => {
  const cases: [number, number, number, number, number][] = [
    [50, 50, 50, 50, 10], // dead center
    [54.99, 50, 50, 50, 10], // just inside radius
    [55, 50, 50, 50, 10], // exactly on radius (legacy: strict <, excluded)
    [55.01, 50, 50, 50, 10], // just outside
    [53, 54, 50, 50, 10], // diagonal inside (dist = 5, on boundary)
    [52, 52, 50, 50, 10], // diagonal inside
  ]

  it.each(cases)('(%f, %f) vs circle(%f, %f, d=%f)', (mx, my, x, y, d) => {
    expect(hitTest.circle(mx, my, x, y, d)).toBe(legacyOverCircle(mx, my, x, y, d))
  })
})
