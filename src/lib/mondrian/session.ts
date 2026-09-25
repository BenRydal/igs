import { get, writable } from 'svelte/store'
import UserStore from '../../stores/userStore'
import PlaybackStore, { play, pause } from '../../stores/playbackStore'
import { timelineV2Store } from '../timeline/store'
import { commitTake } from '../history/user-actions'
import { DataPoint } from '../../models/dataPoint'
import { toData, type FloorplanGeometry } from '../floorplan/transform'
import { createSampler, DEFAULT_SAMPLER_OPTIONS, type SamplerOptions } from './sampler'
import { Take } from './take'

export type AppMode = 'igs' | 'mondrian'

/** Which tool the shared session is shown in. Switching never touches the data. */
export const appMode = writable<AppMode>('igs')

/** `?mode=mondrian` lands in drawing mode; anything else is IGS. */
export const MODE_PARAM = 'mode'

export function modeFromParam(value: string | null): AppMode {
  return value === 'mondrian' ? 'mondrian' : 'igs'
}

export interface MondrianSettings extends SamplerOptions {
  /** Timeline length in seconds when drawing without a video. */
  speculateDuration: number
}

export const mondrianSettings = writable<MondrianSettings>({
  ...DEFAULT_SAMPLER_OPTIONS,
  speculateDuration: 60,
})

export interface RecorderState {
  /** Name of the person new points are drawn for. */
  drawAs: string | null
  recording: boolean
}

export const recorder = writable<RecorderState>({ drawAs: null, recording: false })

let take: Take<DataPoint> | null = null
let sampler = createSampler()
let finalizeTrail: (trail: DataPoint[]) => void = () => {}

/** Recomputes derived per-point values (stops) after a take; set once Core exists. */
export function setTrailFinalizer(finalize: (trail: DataPoint[]) => void): void {
  finalizeTrail = finalize
}

export function setDrawAs(name: string | null): void {
  if (get(recorder).recording) stopRecording()
  recorder.update((r) => ({ ...r, drawAs: name }))
}

function findUser(name: string | null) {
  return name ? get(UserStore).find((u) => u.name === name) : undefined
}

function beginTake(startTime: number): boolean {
  const user = findUser(get(recorder).drawAs)
  if (!user) return false
  sampler = createSampler(get(mondrianSettings))
  take = new Take<DataPoint>(user.dataTrail, startTime)
  return true
}

function endTake(): void {
  const finished = take
  const name = get(recorder).drawAs
  take = null
  const user = findUser(name)
  if (!finished || !name || !user) return
  if (finished.points.length === 0) return
  commitTake(name, finished.base, finished.trail(), finalizeTrail)
}

export function startRecording(): boolean {
  if (take) return true
  if (!beginTake(timelineV2Store.getState().currentTime)) return false
  recorder.update((r) => ({ ...r, recording: true }))
  play()
  return true
}

export function stopRecording(): void {
  if (!take) return
  endTake()
  recorder.update((r) => ({ ...r, recording: false }))
  if (get(PlaybackStore).mode !== 'stopped') pause()
}

export function toggleRecording(): boolean {
  if (take) {
    stopRecording()
    return false
  }
  return startRecording()
}

// If the person being drawn disappears (cleared or replaced data), fall back to the first person.
UserStore.subscribe((users) => {
  const { drawAs } = get(recorder)
  if (drawAs === null || users.some((u) => u.name === drawAs)) return
  if (take) stopRecording()
  recorder.update((r) => ({ ...r, drawAs: users[0]?.name ?? null }))
})

// Pausing from anywhere (timeline controls, end of the timeline) ends the take.
PlaybackStore.subscribe((state) => {
  if (take && state.mode === 'stopped') stopRecording()
})

/**
 * Called once per sketch frame in drawing mode with the pointer's canvas position.
 * A scrub backwards mid-take closes that take and starts a new one at the new time.
 */
export function recordFrame(
  canvasX: number,
  canvasY: number,
  geometry: FloorplanGeometry | null,
  time: number
): void {
  if (!take || !geometry) return
  if (time < take.endTime) {
    endTake()
    if (!beginTake(time)) return stopRecording()
  }

  const pos = toData(canvasX, canvasY, geometry)
  if (!pos.inside || !sampler.accept(time, pos.x, pos.y)) return
  const active = take
  if (!active || !active.add(new DataPoint('', time, pos.x, pos.y))) return

  const name = get(recorder).drawAs
  UserStore.update((list) =>
    list.map((u) =>
      u.name === name ? { ...u, dataTrail: active.trail(), movementIsLoaded: true } : u
    )
  )
  timelineV2Store.extendDataEnd(time)
}

/** Make sure the timeline is long enough to draw over, without moving the playhead. */
export function ensureTimelineCovers(seconds: number): void {
  if (!(seconds > 0)) return
  if (timelineV2Store.getState().dataEnd <= 0) timelineV2Store.initialize(seconds)
  else timelineV2Store.extendDataEnd(seconds)
}
