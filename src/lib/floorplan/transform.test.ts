import { describe, expect, it } from 'vitest'
import {
  effectiveRect,
  toCanvas,
  toData,
  type FloorplanGeometry,
  type FloorplanRotation,
} from './transform'

/** The pre-extraction getScaledXYPos, verbatim in behaviour, as the reference. */
function legacyScaledXYPos(x: number, y: number, g: FloorplanGeometry): [number, number] {
  let eff = { width: g.container.width, height: g.container.height, offsetX: 0, offsetY: 0 }
  if (g.preserveAspectRatio) {
    const rotated = g.rotation === 1 || g.rotation === 3
    const imgWidth = rotated ? g.image.height : g.image.width
    const imgHeight = rotated ? g.image.width : g.image.height
    const imgAspect = imgWidth / imgHeight
    const containerAspect = g.container.width / g.container.height
    if (imgAspect > containerAspect) {
      const height = g.container.width / imgAspect
      eff = {
        width: g.container.width,
        height,
        offsetX: 0,
        offsetY: (g.container.height - height) / 2,
      }
    } else {
      const width = g.container.height * imgAspect
      eff = {
        width,
        height: g.container.height,
        offsetX: (g.container.width - width) / 2,
        offsetY: 0,
      }
    }
  }
  const normX = x / g.source.width
  const normY = y / g.source.height
  switch (g.rotation) {
    case 1:
      return [eff.offsetX + eff.width - normY * eff.width, eff.offsetY + normX * eff.height]
    case 2:
      return [
        eff.offsetX + eff.width - normX * eff.width,
        eff.offsetY + eff.height - normY * eff.height,
      ]
    case 3:
      return [eff.offsetX + normY * eff.width, eff.offsetY + eff.height - normX * eff.height]
    default:
      return [eff.offsetX + normX * eff.width, eff.offsetY + normY * eff.height]
  }
}

const rotations: FloorplanRotation[] = [0, 1, 2, 3]
const image = { width: 1200, height: 800 }
const cases: { name: string; geometry: (r: FloorplanRotation) => FloorplanGeometry }[] = [
  {
    name: 'stretched to the container',
    geometry: (rotation) => ({
      container: { width: 700, height: 600 },
      image,
      source: image,
      rotation,
      preserveAspectRatio: false,
    }),
  },
  {
    name: 'aspect preserved, wide container',
    geometry: (rotation) => ({
      container: { width: 900, height: 400 },
      image,
      source: image,
      rotation,
      preserveAspectRatio: true,
    }),
  },
  {
    name: 'aspect preserved, tall container',
    geometry: (rotation) => ({
      container: { width: 300, height: 700 },
      image,
      source: image,
      rotation,
      preserveAspectRatio: true,
    }),
  },
  {
    name: 'GPS: square data space on a non-square map',
    geometry: (rotation) => ({
      container: { width: 640, height: 480 },
      image,
      source: { width: 1000, height: 1000 },
      rotation,
      preserveAspectRatio: true,
    }),
  },
]
const points = [
  [0, 0],
  [37.5, 612.25],
  [600, 400],
  [1199, 1],
]

describe('toCanvas', () => {
  for (const c of cases) {
    for (const rotation of rotations) {
      it(`matches the original transform: ${c.name}, rotation ${rotation}`, () => {
        const g = c.geometry(rotation)
        for (const [x, y] of points) {
          const [ex, ey] = legacyScaledXYPos(x, y, g)
          const [ax, ay] = toCanvas(x, y, g)
          expect(ax).toBeCloseTo(ex, 9)
          expect(ay).toBeCloseTo(ey, 9)
        }
      })
    }
  }
})

describe('toData', () => {
  for (const c of cases) {
    for (const rotation of rotations) {
      it(`inverts toCanvas: ${c.name}, rotation ${rotation}`, () => {
        const g = c.geometry(rotation)
        for (const [x, y] of points) {
          const sx = Math.min(x, g.source.width)
          const sy = Math.min(y, g.source.height)
          const [cx, cy] = toCanvas(sx, sy, g)
          const back = toData(cx, cy, g)
          expect(back.inside).toBe(true)
          expect(back.x).toBeCloseTo(sx, 6)
          expect(back.y).toBeCloseTo(sy, 6)
        }
      })
    }
  }

  it('flags and clamps positions in the letterbox margin', () => {
    const g = cases[1].geometry(0)
    const r = effectiveRect(g)
    expect(r.offsetX).toBeGreaterThan(0)
    const outside = toData(r.offsetX / 2, r.offsetY + r.height / 2, g)
    expect(outside.inside).toBe(false)
    expect(outside.x).toBe(0)
    expect(outside.y).toBeCloseTo(image.height / 2, 6)
  })
})
