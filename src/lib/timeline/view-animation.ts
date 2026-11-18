import { timelineV2Store } from './store'
import { zoomAtPoint } from './utils'
import { redrawCanvas } from '../utils/p5'

export const MIN_VIEW_SECONDS = 1
const ZOOM_MS = 280
const JUMP_FRACTION = 0.25

interface View {
  start: number
  end: number
}

let frame = 0

function currentView(): View {
  const state = timelineV2Store.getState()
  return { start: state.viewStart, end: state.viewEnd }
}

function canAnimate(): boolean {
  return (
    typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function showView(view: View): void {
  timelineV2Store.setView(view.start, view.end)
  redrawCanvas()
}

function cancelTween(): void {
  if (frame) cancelAnimationFrame(frame)
  frame = 0
}

function tweenTo(to: View): void {
  cancelTween()
  if (!canAnimate()) {
    showView(to)
    return
  }
  const from = currentView()
  const started = performance.now()
  const step = (now: number) => {
    const progress = Math.min(1, (now - started) / ZOOM_MS)
    const eased = 1 - Math.pow(1 - progress, 3)
    showView({
      start: from.start + (to.start - from.start) * eased,
      end: from.end + (to.end - from.end) * eased,
    })
    frame = progress < 1 ? requestAnimationFrame(step) : 0
  }
  frame = requestAnimationFrame(step)
}

export function isJump(from: View, to: View): boolean {
  const span = from.end - from.start
  if (span <= 0) return false
  return (
    Math.abs(to.end - to.start - span) / span > JUMP_FRACTION ||
    Math.abs(to.start - from.start) / span > JUMP_FRACTION
  )
}

export function goToView(to: View): void {
  if (isJump(currentView(), to)) {
    tweenTo(to)
  } else {
    cancelTween()
    showView(to)
  }
}

export function zoomBy(factor: number): void {
  const state = timelineV2Store.getState()
  const { viewStart, viewEnd } = zoomAtPoint(
    state.viewStart,
    state.viewEnd,
    factor,
    (state.viewStart + state.viewEnd) / 2,
    state.dataStart,
    state.dataEnd,
    MIN_VIEW_SECONDS
  )
  tweenTo({ start: viewStart, end: viewEnd })
}

export function zoomToFit(): void {
  const state = timelineV2Store.getState()
  tweenTo({ start: state.dataStart, end: state.dataEnd })
}
