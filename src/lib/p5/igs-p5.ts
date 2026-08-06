import type { ExtendedP5 } from 'svelte-p5'
import type { SketchGUI, Handle3D } from '../sketch-gui'
import type { FloorPlan } from '../floorplan'

/**
 * Members the IGS sketch installs onto the p5 instance.
 *
 * The sketch function (`igsSketch`) assigns all of these during construction,
 * so by the time the instance is observable outside the sketch it is already
 * the extended type. See svelte-p5's `SketchFn<Ext>` docs.
 */
export interface IgsSketchExt {
  /** On-canvas GUI composition (floorplan container, highlight selection, slicers) */
  gui: SketchGUI
  /** 2D ⇄ 3D transition state and translation */
  handle3D: Handle3D
  /** Floorplan image loading, rotation, and data→pixel scaling */
  floorPlan: FloorPlan

  /** View constant: floorplan (plan) view */
  PLAN: number
  /** View constant: space-time view */
  SPACETIME: number

  /** Current canvas size derived from the canvas container element */
  getContainerSize(): { width: number; height: number }

  /**
   * The canvas's viewport-left offset, cached once per frame. Timeline x
   * bounds (timelineV2Store.leftX/rightX) are viewport coordinates; anything
   * drawn on the canvas must subtract this to become canvas-relative.
   */
  canvasLeft: number
  /** Refreshes the cached canvasLeft from the container's bounding rect */
  updateCanvasOffset(): void

  /** True when the value is neither null nor undefined */
  dataIsLoaded(data: unknown): boolean
  /** True when the value is a non-empty array */
  arrayIsLoaded(data: unknown): boolean

  /** Draws the floorplan and all loaded movement/conversation data */
  visualizeData(): void

  /** Is the mouse inside the given rectangle (canvas coordinates)? */
  overRect(x: number, y: number, boxWidth: number, boxHeight: number): boolean
  /** Is the mouse inside the given circle (canvas coordinates)? */
  overCircle(x: number, y: number, diameter: number): boolean
  /** Is the mouse over the timeline interaction area (viewport coordinates)? */
  isMouseOverTimeline(): boolean

  /** Exports start/end code times for the enabled user as a CSV download */
  saveCodeFile(): void

  /** Advances or ends playback depending on the timeline position */
  updateAnimation(): void
  /** Steps the animation clock (frame-based or video-driven) */
  continueAnimation(): void

  /** Maps a view pixel to canvas pixel space (2D) or the space-time cube axis (3D) */
  mapSelectTimeToPixelTime(value: number): number
  /** Maps a full-timeline pixel through the zoomed view window, then to canvas/cube space */
  mapToSelectTimeThenPixelTime(value: number): number

  /**
   * Rebuilds size-dependent state (SketchGUI, Handle3D) after a resize.
   * Driven by the library <Sketch>'s onResize callback — the single resize
   * path; the sketch intentionally defines no p5-native windowResized.
   */
  rebuildAfterResize(): void
}

/** The IGS p5 instance: p5 plus everything the sketch installs on it. */
export type IgsP5 = ExtendedP5<IgsSketchExt>
