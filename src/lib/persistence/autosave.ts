import { get, writable, type Readable } from 'svelte/store'
import UserStore from '../../stores/userStore'
import CodeStore from '../../stores/codeStore'
import ConfigStore from '../../stores/configStore'
import VideoStore, { type VideoSource } from '../../stores/videoStore'
import floorplanStore from '../../stores/floorplanStore'
import { timelineV2Store } from '../timeline/store'
import { mondrianSettings, recorder } from '../mondrian/session'
import { idbAvailable, idbDelete, idbGet, idbSet } from './idb'
import { isWorthRestoring, toSnapshot, type SessionSnapshot } from './snapshot'

const KEYS = { snapshot: 'snapshot', floorplan: 'floorplan', video: 'video' } as const
const SAVE_DELAY_MS = 250

export interface RecoveryOffer {
  snapshot: SessionSnapshot
  floorplan: Blob | null
  video: Blob | null
}

/** A saved session waiting to be restored or discarded; saving pauses until then. */
export const recoveryOffer = writable<RecoveryOffer | null>(null)

let enabled = false
let timer: ReturnType<typeof setTimeout> | undefined
let floorplanBlob: () => Promise<Blob | null> = async () => null
let savedVideoUrl: string | null = null

function videoSummary(source: VideoSource): SessionSnapshot['video'] {
  if (source.type === 'youtube' && source.videoId)
    return { type: 'youtube', videoId: source.videoId }
  if (source.type === 'file') return { type: 'file' }
  return null
}

async function saveSnapshot(): Promise<void> {
  clearTimeout(timer)
  if (!enabled) return
  const timeline = timelineV2Store.getState()
  const snapshot = toSnapshot({
    users: get(UserStore),
    codes: get(CodeStore),
    config: get(ConfigStore),
    mondrian: { settings: get(mondrianSettings), drawAs: get(recorder).drawAs },
    video: videoSummary(get(VideoStore).source),
    timeline: {
      dataStart: timeline.dataStart,
      dataEnd: timeline.dataEnd,
      currentTime: timeline.currentTime,
    },
    hasFloorplan: !!get(floorplanStore),
  })
  if (isWorthRestoring(snapshot)) await idbSet(KEYS.snapshot, snapshot)
  else await clearStored()
}

function scheduleSave(): void {
  if (!enabled) return
  clearTimeout(timer)
  timer = setTimeout(() => void saveSnapshot().catch(logFailure), SAVE_DELAY_MS)
}

async function saveFloorplan(): Promise<void> {
  if (!enabled) return
  const blob = get(floorplanStore) ? await floorplanBlob() : null
  if (blob) await idbSet(KEYS.floorplan, blob)
  else await idbDelete(KEYS.floorplan)
}

async function saveVideo(source: VideoSource): Promise<void> {
  if (!enabled) return
  if (source.type !== 'file' || !source.fileUrl) {
    savedVideoUrl = null
    return idbDelete(KEYS.video)
  }
  if (source.fileUrl === savedVideoUrl) return
  savedVideoUrl = source.fileUrl
  const blob = await fetch(source.fileUrl).then((r) => r.blob())
  await idbSet(KEYS.video, blob)
}

function clearStored(): Promise<unknown> {
  return Promise.all([idbDelete(KEYS.snapshot), idbDelete(KEYS.floorplan), idbDelete(KEYS.video)])
}

function logFailure(error: unknown): void {
  console.error('Autosave failed:', error)
}

function onChange<T>(store: Readable<T>, handler: (value: T) => void): () => void {
  let first = true
  return store.subscribe((value) => {
    if (first) {
      first = false
      return
    }
    handler(value)
  })
}

/**
 * Saves the session to IndexedDB on every change (debounced) and immediately when the
 * tab is hidden. If an earlier session exists, it is offered back first and saving
 * waits for that decision, so opening IGS can never overwrite it.
 */
export async function startAutosave(options: {
  floorplanBlob: () => Promise<Blob | null>
}): Promise<() => void> {
  if (!idbAvailable()) return () => {}
  floorplanBlob = options.floorplanBlob

  const saved = await idbGet<SessionSnapshot>(KEYS.snapshot).catch(() => undefined)
  if (isWorthRestoring(saved)) {
    const [floorplan, video] = await Promise.all([
      idbGet<Blob>(KEYS.floorplan).catch(() => undefined),
      idbGet<Blob>(KEYS.video).catch(() => undefined),
    ])
    recoveryOffer.set({ snapshot: saved, floorplan: floorplan ?? null, video: video ?? null })
  } else {
    enabled = true
  }

  let lastSource = get(VideoStore).source
  const unsubscribers = [
    onChange(UserStore, scheduleSave),
    onChange(CodeStore, scheduleSave),
    onChange(ConfigStore, scheduleSave),
    onChange(mondrianSettings, scheduleSave),
    onChange(recorder, scheduleSave),
    onChange(floorplanStore, () => {
      scheduleSave()
      void saveFloorplan().catch(logFailure)
    }),
    onChange(VideoStore, (state) => {
      if (state.source === lastSource) return
      lastSource = state.source
      scheduleSave()
      void saveVideo(state.source).catch(logFailure)
    }),
  ]

  const flush = () => void saveSnapshot().catch(logFailure)
  const onVisibility = () => document.visibilityState === 'hidden' && flush()
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('pagehide', flush)

  return () => {
    unsubscribers.forEach((unsub) => unsub())
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('pagehide', flush)
    clearTimeout(timer)
  }
}

/** Ends the pause after a restore or discard, and saves the session as it now stands. */
export function resumeAutosave(): void {
  recoveryOffer.set(null)
  enabled = true
  void Promise.all([saveSnapshot(), saveFloorplan(), saveVideo(get(VideoStore).source)]).catch(
    logFailure
  )
}

export async function discardSavedSession(): Promise<void> {
  await clearStored().catch(logFailure)
  resumeAutosave()
}
