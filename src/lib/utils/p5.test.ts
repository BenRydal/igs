import { afterEach, describe, expect, it, vi } from 'vitest'
import P5Store from '../../stores/p5Store'
import type { IgsP5 } from '../p5/igs-p5'
import { redrawCanvas, withRedrawSuspended } from './p5'

function installSketch() {
  const loop = vi.fn()
  P5Store.set({ loop } as unknown as IgsP5)
  return loop
}

describe('redraw requests', () => {
  afterEach(() => P5Store.set(null))

  it('asks the sketch to draw once per request', () => {
    const loop = installSketch()
    redrawCanvas()
    redrawCanvas()
    expect(loop).toHaveBeenCalledTimes(2)
  })

  it('draws once after a suspended batch, however many requests it made', async () => {
    const loop = installSketch()
    await withRedrawSuspended(async () => {
      redrawCanvas()
      await Promise.resolve()
      redrawCanvas()
      redrawCanvas()
      expect(loop).not.toHaveBeenCalled()
    })
    expect(loop).toHaveBeenCalledTimes(1)
  })

  it('does not draw after a batch that requested nothing', async () => {
    const loop = installSketch()
    await withRedrawSuspended(async () => {})
    expect(loop).not.toHaveBeenCalled()
  })

  it('holds the draw until the outermost batch finishes', async () => {
    const loop = installSketch()
    await withRedrawSuspended(async () => {
      await withRedrawSuspended(async () => redrawCanvas())
      expect(loop).not.toHaveBeenCalled()
    })
    expect(loop).toHaveBeenCalledTimes(1)
  })

  it('still draws when the batch fails', async () => {
    const loop = installSketch()
    await expect(
      withRedrawSuspended(async () => {
        redrawCanvas()
        throw new Error('import failed')
      })
    ).rejects.toThrow('import failed')
    expect(loop).toHaveBeenCalledTimes(1)
  })
})
