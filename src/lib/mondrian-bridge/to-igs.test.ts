import { describe, expect, it } from 'vitest'
import { mondrianPathsToPeople } from './to-igs'
import type { PathData } from '../mondrian-tool/stores/drawingState'

const path = (pathId: number, times: number[], name?: string): PathData => ({
  pathId,
  color: '#ff0000',
  name,
  points: times.map((time, i) => ({ x: i * 10, y: i * 20, time, pathId })),
})

describe('mondrianPathsToPeople', () => {
  it('keeps video time and floorplan pixels when transcribing', () => {
    const [person] = mondrianPathsToPeople([path(1, [12.5, 13, 14.25], 'Teacher')], {
      isTranscriptionMode: true,
      speculateScale: 1,
    })
    expect(person.name).toBe('Teacher')
    expect(person.color).toBe('#ff0000')
    expect(person.rows).toEqual([
      { x: 0, y: 0, time: 12.5 },
      { x: 10, y: 20, time: 13 },
      { x: 20, y: 40, time: 14.25 },
    ])
  })

  it('names unnamed paths the way the path list shows them and skips empty ones', () => {
    const people = mondrianPathsToPeople([path(1, [0, 1]), path(2, []), path(3, [0, 1], '')], {
      isTranscriptionMode: true,
      speculateScale: 1,
    })
    expect(people.map((p) => p.name)).toEqual(['Path 1', 'Path 3'])
  })

  it('rescales each speculated path to the export time scale', () => {
    const [person] = mondrianPathsToPeople([path(1, [100, 150, 200])], {
      isTranscriptionMode: false,
      speculateScale: 60,
    })
    expect(person.rows.map((r) => r.time)).toEqual([0, 30, 60])
  })

  it('uses the export dialog default when no time scale was ever set', () => {
    const [person] = mondrianPathsToPeople([path(1, [0, 4, 8])], {
      isTranscriptionMode: false,
      speculateScale: 1,
    })
    expect(person.rows.map((r) => r.time)).toEqual([0, 5, 10])
  })

  it('puts a single speculated point at time zero', () => {
    const [person] = mondrianPathsToPeople([path(1, [7])], {
      isTranscriptionMode: false,
      speculateScale: 30,
    })
    expect(person.rows[0].time).toBe(0)
  })
})
