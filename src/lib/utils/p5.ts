import P5Store from '../../stores/p5Store'
import { get } from 'svelte/store'

let suspendDepth = 0
let redrawPending = false

export function redrawCanvas(): void {
  if (suspendDepth > 0) {
    redrawPending = true
    return
  }
  get(P5Store)?.loop()
}

export async function withRedrawSuspended<T>(work: () => Promise<T>): Promise<T> {
  suspendDepth += 1
  try {
    return await work()
  } finally {
    suspendDepth -= 1
    if (suspendDepth === 0 && redrawPending) {
      redrawPending = false
      redrawCanvas()
    }
  }
}

export function rotateFloorplan(direction: 'left' | 'right'): void {
  const p5Instance = get(P5Store)
  if (!p5Instance?.floorPlan) return
  if (direction === 'left') p5Instance.floorPlan.setRotateLeft()
  else p5Instance.floorPlan.setRotateRight()
  redrawCanvas()
}
