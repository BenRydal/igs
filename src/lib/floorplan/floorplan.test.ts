import { beforeEach, describe, expect, it } from 'vitest'
import { FloorPlan } from './floorplan.js'
import ConfigStore, { initialConfig } from '../../stores/configStore'
import { resetGPS, setGPSMode } from '../../stores/gpsStore'
import type { IgsP5 } from '../p5/igs-p5'

// getEffectiveDimensions and getScaledXYPos are the data -> screen projection,
// reached for every point, on every view, on every frame. These pin all four
// rotation branches and both normalization modes, and the final describe pins
// the input-comparison memo getEffectiveDimensions sits behind.
//
// Neither method touches `this.sk`, so a null sketch is sufficient, and `img`
// is only ever read for .width/.height.

type ImgStub = { width: number; height: number }

/** FloorPlan with no sketch and a fake image of the given size. */
const makeFloorPlan = (img: ImgStub | null, rotation: number) => {
  const floorPlan = new FloorPlan(null as unknown as IgsP5)
  floorPlan.img = img as unknown as import('p5').Image
  floorPlan.curFloorPlanRotation = rotation
  return floorPlan
}

const container = (width: number, height: number) => ({ width, height })

beforeEach(() => {
  ConfigStore.set({ ...initialConfig })
  resetGPS()
})

describe('FloorPlan construction', () => {
  it('defaults to rotation mode 1 (90 degrees), not 0', () => {
    expect(new FloorPlan(null as unknown as IgsP5).curFloorPlanRotation).toBe(1)
  })

  it('starts with no image', () => {
    expect(new FloorPlan(null as unknown as IgsP5).getImg()).toBeNull()
  })
})

describe('FloorPlan.getEffectiveDimensions', () => {
  it('fills the container when preserveFloorplanAspectRatio is off', () => {
    // Default config has the toggle off, so image proportions are ignored.
    const fp = makeFloorPlan({ width: 100, height: 1000 }, 0)
    expect(fp.getEffectiveDimensions(container(800, 400))).toEqual({
      width: 800,
      height: 400,
      offsetX: 0,
      offsetY: 0,
    })
  })

  it('fills the container when the toggle is on but no image is loaded', () => {
    ConfigStore.set({ ...initialConfig, preserveFloorplanAspectRatio: true })
    const fp = makeFloorPlan(null, 0)
    expect(fp.getEffectiveDimensions(container(800, 400))).toEqual({
      width: 800,
      height: 400,
      offsetX: 0,
      offsetY: 0,
    })
  })

  describe('with preserveFloorplanAspectRatio on', () => {
    beforeEach(() => {
      ConfigStore.set({ ...initialConfig, preserveFloorplanAspectRatio: true })
    })

    it('fits to width and centres vertically when the image is wider than the container', () => {
      // img 1000x500 (aspect 2) in an 800x800 container (aspect 1)
      const fp = makeFloorPlan({ width: 1000, height: 500 }, 0)
      expect(fp.getEffectiveDimensions(container(800, 800))).toEqual({
        width: 800,
        height: 400,
        offsetX: 0,
        offsetY: 200,
      })
    })

    it('fits to height and centres horizontally when the image is taller than the container', () => {
      // img 500x1000 (aspect 0.5) in an 800x800 container (aspect 1)
      const fp = makeFloorPlan({ width: 500, height: 1000 }, 0)
      expect(fp.getEffectiveDimensions(container(800, 800))).toEqual({
        width: 400,
        height: 800,
        offsetX: 200,
        offsetY: 0,
      })
    })

    it('leaves no letterboxing when image and container aspects match', () => {
      const fp = makeFloorPlan({ width: 1000, height: 500 }, 0)
      expect(fp.getEffectiveDimensions(container(800, 400))).toEqual({
        width: 800,
        height: 400,
        offsetX: 0,
        offsetY: 0,
      })
    })

    it('swaps image width/height for rotation 1', () => {
      // img 1000x500 rotated 90deg presents as 500x1000 (aspect 0.5).
      const fp = makeFloorPlan({ width: 1000, height: 500 }, 1)
      expect(fp.getEffectiveDimensions(container(800, 800))).toEqual({
        width: 400,
        height: 800,
        offsetX: 200,
        offsetY: 0,
      })
    })

    it('swaps image width/height for rotation 3', () => {
      const fp = makeFloorPlan({ width: 1000, height: 500 }, 3)
      expect(fp.getEffectiveDimensions(container(800, 800))).toEqual({
        width: 400,
        height: 800,
        offsetX: 200,
        offsetY: 0,
      })
    })

    it('does not swap for rotation 2', () => {
      const fp = makeFloorPlan({ width: 1000, height: 500 }, 2)
      expect(fp.getEffectiveDimensions(container(800, 800))).toEqual({
        width: 800,
        height: 400,
        offsetX: 0,
        offsetY: 200,
      })
    })
  })
})

describe('FloorPlan.getScaledXYPos', () => {
  // img 1000x800 into an 800x400 container, aspect ratio off: scale is
  // x * 800/1000 = x * 0.8 and y * 400/800 = y * 0.5.
  const img = { width: 1000, height: 800 }
  const box = container(800, 400)

  it('returns [0, 0] when no image is loaded', () => {
    expect(makeFloorPlan(null, 0).getScaledXYPos(500, 400, box)).toEqual([0, 0])
  })

  it('scales normally for rotation 0', () => {
    expect(makeFloorPlan(img, 0).getScaledXYPos(500, 400, box)).toEqual([400, 200])
  })

  it('maps the origin and the far corner for rotation 0', () => {
    const fp = makeFloorPlan(img, 0)
    expect(fp.getScaledXYPos(0, 0, box)).toEqual([0, 0])
    expect(fp.getScaledXYPos(1000, 800, box)).toEqual([800, 400])
  })

  it('rotates 90 degrees for rotation 1', () => {
    // [width - normY * width, normX * height]
    // normX = 0.5, normY = 0.5 -> [800 - 400, 200]
    expect(makeFloorPlan(img, 1).getScaledXYPos(500, 400, box)).toEqual([400, 200])
    // An asymmetric point makes the swap visible: normX = 0.2, normY = 0.75
    expect(makeFloorPlan(img, 1).getScaledXYPos(200, 600, box)).toEqual([200, 80])
  })

  it('rotates 180 degrees for rotation 2', () => {
    // [width - normX * width, height - normY * height]
    expect(makeFloorPlan(img, 2).getScaledXYPos(200, 600, box)).toEqual([640, 100])
  })

  it('rotates 270 degrees for rotation 3', () => {
    // [normY * width, height - normX * height]
    expect(makeFloorPlan(img, 3).getScaledXYPos(200, 600, box)).toEqual([600, 320])
  })

  it('falls through to rotation 0 behaviour for an out-of-range rotation', () => {
    expect(makeFloorPlan(img, 7).getScaledXYPos(500, 400, box)).toEqual([400, 200])
  })

  it('normalizes against GPS_NORMALIZED_SIZE instead of image size in GPS mode', () => {
    setGPSMode(true)
    // GPS pixel coords live in a 0-1000 space, so 500 is the midpoint on both
    // axes regardless of the map image being 1000x800.
    expect(makeFloorPlan(img, 0).getScaledXYPos(500, 500, box)).toEqual([400, 200])
  })

  it('reads GPS mode live from the store', () => {
    const fp = makeFloorPlan(img, 0)
    // y = 500 of an 800px-tall image is 0.625 -> 250px.
    expect(fp.getScaledXYPos(500, 500, box)).toEqual([400, 250])
    setGPSMode(true)
    // y = 500 in the 1000-unit GPS space is 0.5 -> 200px.
    expect(fp.getScaledXYPos(500, 500, box)).toEqual([400, 200])
  })

  it('applies the aspect-ratio offset to the returned position', () => {
    ConfigStore.set({ ...initialConfig, preserveFloorplanAspectRatio: true })
    // img 1000x500 (aspect 2) in an 800x800 container -> 800x400 at offsetY 200.
    // The image midpoint therefore lands at y = 200 + 0.5 * 400 = 400.
    const fp = makeFloorPlan({ width: 1000, height: 500 }, 0)
    expect(fp.getScaledXYPos(500, 250, container(800, 800))).toEqual([400, 400])
  })
})

describe('FloorPlan rotation setters', () => {
  it('wraps forwards from 3 to 0', () => {
    const fp = makeFloorPlan(null, 3)
    fp.setRotateRight()
    expect(fp.curFloorPlanRotation).toBe(0)
  })

  it('wraps backwards from 0 to 3', () => {
    const fp = makeFloorPlan(null, 0)
    fp.setRotateLeft()
    expect(fp.curFloorPlanRotation).toBe(3)
  })

  it('steps through every mode in order', () => {
    const fp = makeFloorPlan(null, 0)
    const seen = [fp.curFloorPlanRotation]
    for (let i = 0; i < 4; i++) {
      fp.setRotateRight()
      seen.push(fp.curFloorPlanRotation)
    }
    expect(seen).toEqual([0, 1, 2, 3, 0])
  })
})

describe('FloorPlan.getEffectiveDimensions memoization', () => {
  // getEffectiveDimensions is memoized because it runs once per data point per
  // frame. A stale memo is the failure mode that buys, so every input to the
  // memo is exercised against a single reused instance.

  it('recomputes when the container size changes', () => {
    const fp = makeFloorPlan({ width: 1000, height: 500 }, 0)
    expect(fp.getEffectiveDimensions(container(800, 400)).width).toBe(800)
    expect(fp.getEffectiveDimensions(container(200, 100))).toEqual({
      width: 200,
      height: 100,
      offsetX: 0,
      offsetY: 0,
    })
  })

  it('recomputes when the rotation changes on the same instance', () => {
    ConfigStore.set({ ...initialConfig, preserveFloorplanAspectRatio: true })
    const fp = makeFloorPlan({ width: 1000, height: 500 }, 0)
    // Unrotated, the 2:1 image fits to width.
    expect(fp.getEffectiveDimensions(container(800, 800))).toEqual({
      width: 800,
      height: 400,
      offsetX: 0,
      offsetY: 200,
    })
    fp.setRotateRight() // -> rotation 1, image presents as 1:2
    expect(fp.getEffectiveDimensions(container(800, 800))).toEqual({
      width: 400,
      height: 800,
      offsetX: 200,
      offsetY: 0,
    })
  })

  it('recomputes when preserveFloorplanAspectRatio is toggled', () => {
    const fp = makeFloorPlan({ width: 1000, height: 500 }, 0)
    expect(fp.getEffectiveDimensions(container(800, 800)).height).toBe(800)
    ConfigStore.set({ ...initialConfig, preserveFloorplanAspectRatio: true })
    expect(fp.getEffectiveDimensions(container(800, 800)).height).toBe(400)
  })

  it('recomputes when the image is replaced with one of different dimensions', () => {
    ConfigStore.set({ ...initialConfig, preserveFloorplanAspectRatio: true })
    const fp = makeFloorPlan({ width: 1000, height: 500 }, 0)
    expect(fp.getEffectiveDimensions(container(800, 800)).height).toBe(400)
    // A Mapbox style change swaps in a new image, possibly a different size.
    fp.img = { width: 500, height: 1000 } as unknown as import('p5').Image
    expect(fp.getEffectiveDimensions(container(800, 800))).toEqual({
      width: 400,
      height: 800,
      offsetX: 200,
      offsetY: 0,
    })
  })

  it('returns the same values on a repeated call with unchanged inputs', () => {
    ConfigStore.set({ ...initialConfig, preserveFloorplanAspectRatio: true })
    const fp = makeFloorPlan({ width: 1000, height: 500 }, 0)
    const box = container(800, 800)
    expect(fp.getEffectiveDimensions(box)).toEqual(fp.getEffectiveDimensions(box))
  })

  it('propagates a memo-invalidating change through getScaledXYPos', () => {
    // The memo lives behind getScaledXYPos, which is what the draw layer calls.
    ConfigStore.set({ ...initialConfig, preserveFloorplanAspectRatio: true })
    const fp = makeFloorPlan({ width: 1000, height: 500 }, 0)
    const box = container(800, 800)
    // 800x400 at offsetY 200 -> midpoint y = 200 + 200 = 400.
    expect(fp.getScaledXYPos(500, 250, box)).toEqual([400, 400])
    ConfigStore.set({ ...initialConfig, preserveFloorplanAspectRatio: false })
    // Now stretched to fill: midpoint y = 400.
    expect(fp.getScaledXYPos(500, 250, box)).toEqual([400, 400])
    // ...but a non-midpoint reveals the difference.
    ConfigStore.set({ ...initialConfig, preserveFloorplanAspectRatio: true })
    expect(fp.getScaledXYPos(0, 0, box)).toEqual([0, 200])
    ConfigStore.set({ ...initialConfig, preserveFloorplanAspectRatio: false })
    expect(fp.getScaledXYPos(0, 0, box)).toEqual([0, 0])
  })
})
