import { get } from 'svelte/store'
import type { IgsP5 } from '../p5/igs-p5'
import UserStore from '../../stores/userStore'
import { timelineV2Store } from '../timeline/store'
import { toData } from '../floorplan/transform'
import { appMode, recorder, recordFrame, toggleRecording } from './session'

function drawingActive(p5: IgsP5): boolean {
  return get(appMode) === 'mondrian' && !p5.handle3D.getIs3DModeOrTransitioning()
}

function geometryOf(p5: IgsP5) {
  return p5.floorPlan.getGeometry(p5.gui.fpContainer.getContainer())
}

function canvasOf(p5: IgsP5): HTMLCanvasElement {
  return (p5.drawingContext as WebGL2RenderingContext).canvas as HTMLCanvasElement
}

// p5 listens on window, so panels and floating windows over the canvas must not count.
function pointerOnCanvas(p5: IgsP5): boolean {
  return canvasOf(p5).matches(':hover')
}

/** Per-frame drawing-mode work: record the pointer and draw the drawing cursor. */
export function mondrianFrame(p5: IgsP5): void {
  if (!drawingActive(p5)) return
  const geometry = geometryOf(p5)
  const time = timelineV2Store.getState().currentTime
  if (pointerOnCanvas(p5)) recordFrame(p5.mouseX, p5.mouseY, geometry, time)

  if (!geometry || !pointerOnCanvas(p5)) return
  if (!toData(p5.mouseX, p5.mouseY, geometry).inside) return
  const { drawAs, recording } = get(recorder)
  const color = get(UserStore).find((u) => u.name === drawAs)?.color ?? '#000000'

  p5.push()
  p5.strokeWeight(2)
  p5.stroke(color)
  if (recording) p5.fill(color)
  else p5.noFill()
  p5.circle(p5.mouseX, p5.mouseY, recording ? 12 : 16)
  p5.pop()
}

/** Handles a canvas press in drawing mode; returns true when it consumed the press. */
export function mondrianPress(p5: IgsP5, event?: MouseEvent): boolean {
  if (get(appMode) !== 'mondrian') return false
  if (!drawingActive(p5) || event?.target !== canvasOf(p5)) return true
  const geometry = geometryOf(p5)
  if (!geometry || !toData(p5.mouseX, p5.mouseY, geometry).inside) return true
  toggleRecording()
  return true
}
