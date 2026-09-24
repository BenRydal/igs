import type { PathData } from '../mondrian-tool/stores/drawingState'
import type { MovementRow } from '../core/types'

/** Mondrian's store starts at 1 s; its export dialog pre-fills 10 s, so treat untouched as that. */
const UNSET_SPECULATE_SCALE = 1
const DEFAULT_SPECULATE_SECONDS = 10

export interface MondrianPerson {
  name: string
  color: string
  rows: MovementRow[]
}

/**
 * Mondrian paths as IGS movement rows, following Mondrian's export: floorplan-pixel x/y,
 * video seconds when transcribing, each path rescaled to the time scale when speculating.
 */
export function mondrianPathsToPeople(
  paths: readonly PathData[],
  options: { isTranscriptionMode: boolean; speculateScale: number }
): MondrianPerson[] {
  const scale =
    options.speculateScale === UNSET_SPECULATE_SCALE
      ? DEFAULT_SPECULATE_SECONDS
      : options.speculateScale

  return paths.flatMap((path, index) => {
    if (path.points.length === 0) return []
    const minTime = path.points[0].time
    const range = path.points[path.points.length - 1].time - minTime
    const rows = path.points.map((p) => ({
      x: p.x,
      y: p.y,
      time: options.isTranscriptionMode
        ? p.time
        : range > 0
          ? ((p.time - minTime) / range) * scale
          : 0,
    }))
    return [{ name: path.name || `Path ${index + 1}`, color: path.color, rows }]
  })
}
