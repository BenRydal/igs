import { User } from '../../models/user'
import { DataPoint } from '../../models/dataPoint'
import type { CodeEntry } from '../../stores/codeStore'
import type { ConfigStoreState } from '../../stores/configStore'
import type { MondrianSettings } from '../mondrian/session'

export const SNAPSHOT_VERSION = 1

interface SavedPoint {
  time: number | null
  speech: string
  x: number | null
  y: number | null
  stopLength: number
  codes: string[]
}

interface SavedUser {
  name: string
  color: string
  enabled: boolean
  conversationEnabled: boolean
  movementIsLoaded: boolean
  conversationIsLoaded: boolean
  trail: SavedPoint[]
}

/** Everything but the floorplan and video bytes, which are stored as separate Blobs. */
export interface SessionSnapshot {
  version: number
  savedAt: number
  users: SavedUser[]
  codes: CodeEntry[]
  config: ConfigStoreState
  mondrian: { settings: MondrianSettings; drawAs: string | null }
  video: { type: 'youtube'; videoId: string } | { type: 'file' } | null
  timeline: { dataStart: number; dataEnd: number; currentTime: number }
  hasFloorplan: boolean
}

export interface SessionState {
  users: readonly User[]
  codes: readonly CodeEntry[]
  config: ConfigStoreState
  mondrian: { settings: MondrianSettings; drawAs: string | null }
  video: SessionSnapshot['video']
  timeline: SessionSnapshot['timeline']
  hasFloorplan: boolean
}

export function toSnapshot(state: SessionState, savedAt = Date.now()): SessionSnapshot {
  return {
    version: SNAPSHOT_VERSION,
    savedAt,
    users: state.users.map((u) => ({
      name: u.name,
      color: u.color,
      enabled: u.enabled,
      conversationEnabled: u.conversation_enabled,
      movementIsLoaded: u.movementIsLoaded,
      conversationIsLoaded: u.conversationIsLoaded,
      trail: u.dataTrail.map((p) => ({
        time: p.time,
        speech: p.speech,
        x: p.x,
        y: p.y,
        stopLength: p.stopLength,
        codes: [...p.codes],
      })),
    })),
    codes: state.codes.map((c) => ({ ...c })),
    config: { ...state.config },
    mondrian: { settings: { ...state.mondrian.settings }, drawAs: state.mondrian.drawAs },
    video: state.video,
    timeline: { ...state.timeline },
    hasFloorplan: state.hasFloorplan,
  }
}

/** A session worth offering back: someone to show, or a floorplan to draw on. */
export function isWorthRestoring(
  snapshot: SessionSnapshot | undefined
): snapshot is SessionSnapshot {
  return (
    !!snapshot &&
    snapshot.version === SNAPSHOT_VERSION &&
    (snapshot.users.length > 0 || snapshot.hasFloorplan)
  )
}

export function usersFromSnapshot(snapshot: SessionSnapshot): User[] {
  return snapshot.users.map((saved) => {
    const trail = saved.trail.map((p) => {
      const point = new DataPoint(p.speech, p.time, p.x, p.y)
      point.stopLength = p.stopLength
      point.codes = [...p.codes]
      return point
    })
    const user = new User(trail, saved.color, saved.enabled, saved.name)
    user.conversation_enabled = saved.conversationEnabled
    user.movementIsLoaded = saved.movementIsLoaded
    user.conversationIsLoaded = saved.conversationIsLoaded
    return user
  })
}
