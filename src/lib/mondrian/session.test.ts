import { beforeEach, describe, expect, it } from 'vitest'
import { get } from 'svelte/store'
import UserStore from '../../stores/userStore'
import PlaybackStore, { pause } from '../../stores/playbackStore'
import { historyStore } from '../../stores/historyStore'
import { timelineV2Store } from '../timeline/store'
import { User } from '../../models/user'
import { DataPoint } from '../../models/dataPoint'
import type { FloorplanGeometry } from '../floorplan/transform'
import { recorder, recordFrame, setDrawAs, startRecording, stopRecording } from './session'

// 100x100 image drawn 1:1 in a 100x100 container, so canvas px == data px.
const geometry: FloorplanGeometry = {
  container: { width: 100, height: 100 },
  image: { width: 100, height: 100 },
  source: { width: 100, height: 100 },
  rotation: 0,
  preserveAspectRatio: false,
}
const trail = () => get(UserStore).find((u) => u.name === 'ana')?.dataTrail ?? []
const times = () => trail().map((p) => p.time)

describe('recording session', () => {
  beforeEach(() => {
    stopRecording()
    const existing = [0, 1, 2, 3, 4].map((t) => new DataPoint('', t, 50, 50))
    const ana = new User(existing, '#000000', true, 'ana')
    ana.movementIsLoaded = true
    UserStore.set([ana])
    timelineV2Store.initialize(10)
    setDrawAs('ana')
  })

  it('records over a range, live and then as one undo step', () => {
    timelineV2Store.setCurrentTime(1.5)
    expect(startRecording()).toBe(true)
    expect(get(PlaybackStore).mode).not.toBe('stopped')

    recordFrame(10, 10, geometry, 1.5)
    recordFrame(20, 20, geometry, 2.5)
    expect(times()).toEqual([0, 1, 1.5, 2.5, 3, 4])

    const before = get(historyStore).past.length
    pause()
    expect(get(recorder).recording).toBe(false)
    expect(get(historyStore).past.length).toBe(before + 1)

    historyStore.undo()
    expect(times()).toEqual([0, 1, 2, 3, 4])
  })

  it('ignores the pointer off the floorplan', () => {
    timelineV2Store.setCurrentTime(6)
    startRecording()
    recordFrame(150, 10, geometry, 6)
    stopRecording()
    expect(times()).toEqual([0, 1, 2, 3, 4])
  })

  it('splits a take when the playhead jumps backwards', () => {
    timelineV2Store.setCurrentTime(5)
    startRecording()
    recordFrame(10, 10, geometry, 5)
    recordFrame(20, 10, geometry, 6)
    const before = get(historyStore).past.length
    recordFrame(30, 10, geometry, 0.5)
    expect(get(historyStore).past.length).toBe(before + 1)
    recordFrame(40, 10, geometry, 0.7)
    stopRecording()
    expect(times()).toEqual([0, 0.5, 0.7, 1, 2, 3, 4, 5, 6])
  })

  it('extends the timeline as it records past the end', () => {
    timelineV2Store.setCurrentTime(9.5)
    startRecording()
    recordFrame(10, 10, geometry, 9.5)
    recordFrame(20, 10, geometry, 12)
    stopRecording()
    expect(timelineV2Store.getState().dataEnd).toBe(12)
  })

  it('does not record without someone to draw as', () => {
    setDrawAs(null)
    expect(startRecording()).toBe(false)
  })
})
