import { get } from 'svelte/store'
import type { Core } from '../core/core'
import type { IgsP5 } from '../p5/igs-p5'
import UserStore from '../../stores/userStore'
import VideoStore from '../../stores/videoStore'
import { toastStore } from '../../stores/toastStore'
import { drawingState } from '../mondrian-tool/stores/drawingState'
import { drawingConfig } from '../mondrian-tool/stores/drawingConfig'
import { mondrianPathsToPeople } from './to-igs'

/** What the bridge needs from the mounted Mondrian tool. */
export interface MondrianHandle {
  getFloorPlanDataUrl(): string | null
  getVideoUrl(): string | null
  hasFloorPlan(): boolean
  receiveFloorPlan(url: string): void
  receiveVideo(url: string): void
}

// People this bridge created in IGS, so a deleted Mondrian path removes only its own person.
const syncedNames = new Set<string>()
let lastFloorPlanUrl: string | null = null
let warnedAboutYouTube = false

/** Mondrian to IGS, on switching to IGS: the same result as exporting and importing, minus files. */
export function syncMondrianIntoIgs(core: Core, mondrian: MondrianHandle): void {
  const floorPlanUrl = mondrian.getFloorPlanDataUrl()
  if (floorPlanUrl && floorPlanUrl !== lastFloorPlanUrl) {
    core.loadFloorplanImage(floorPlanUrl)
    lastFloorPlanUrl = floorPlanUrl
  }

  const videoUrl = mondrian.getVideoUrl()
  if (videoUrl && get(VideoStore).source.fileUrl !== videoUrl) core.prepVideoFromFile(videoUrl)

  const people = mondrianPathsToPeople(get(drawingState).paths, get(drawingConfig))
  const current = new Set(people.map((p) => p.name))
  const removed = [...syncedNames].filter((name) => !current.has(name))
  if (removed.length > 0)
    UserStore.update((users) => users.filter((u) => !removed.includes(u.name)))
  removed.forEach((name) => syncedNames.delete(name))

  for (const person of people) {
    core.updateUsersForMovement(person.rows, person.name)
    UserStore.update((users) =>
      users.map((user) => {
        if (user.name !== person.name) return user
        user.dataTrail.sort((a, b) => (a.time ?? 0) - (b.time ?? 0))
        core.updateStopValues(user.dataTrail)
        user.color = person.color
        return user
      })
    )
    syncedNames.add(person.name)
  }
}

/** IGS to Mondrian, on switching to Mondrian: hand over media only where Mondrian has none. */
export function handIgsMediaToMondrian(p5: IgsP5 | null, mondrian: MondrianHandle): void {
  // p5.Image keeps a backing canvas at runtime that its type definitions omit.
  const canvas = (p5?.floorPlan.img as unknown as { canvas?: HTMLCanvasElement } | null)?.canvas
  if (!mondrian.hasFloorPlan() && canvas) mondrian.receiveFloorPlan(canvas.toDataURL('image/png'))

  const { source } = get(VideoStore)
  if (mondrian.getVideoUrl()) return
  if (source.type === 'file' && source.fileUrl) mondrian.receiveVideo(source.fileUrl)
  else if (source.type === 'youtube' && !warnedAboutYouTube) {
    warnedAboutYouTube = true
    toastStore.info('Mondrian transcribes from a video file; YouTube videos stay in IGS.')
  }
}
