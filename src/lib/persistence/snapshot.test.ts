import { describe, expect, it } from 'vitest'
import { User } from '../../models/user'
import { DataPoint } from '../../models/dataPoint'
import { initialConfig } from '../../stores/configStore'
import { DEFAULT_SAMPLER_OPTIONS } from '../mondrian/sampler'
import { isWorthRestoring, toSnapshot, usersFromSnapshot, type SessionState } from './snapshot'

function state(overrides: Partial<SessionState> = {}): SessionState {
  const point = new DataPoint('hello', 2, 10, 20)
  point.stopLength = 3
  point.codes = ['a']
  const ana = new User([point], '#123456', true, 'ana')
  ana.conversation_enabled = false
  ana.movementIsLoaded = true
  return {
    users: [ana],
    codes: [{ code: 'a', color: '#ff0000', enabled: true }],
    config: initialConfig,
    mondrian: { settings: { ...DEFAULT_SAMPLER_OPTIONS, speculateDuration: 90 }, drawAs: 'ana' },
    video: { type: 'youtube', videoId: 'abc' },
    timeline: { dataStart: 0, dataEnd: 90, currentTime: 12 },
    hasFloorplan: true,
    ...overrides,
  }
}

describe('session snapshot', () => {
  it('round-trips people and their trails into real model instances', () => {
    const snapshot = structuredClone(toSnapshot(state()))
    const [ana] = usersFromSnapshot(snapshot)
    expect(ana).toBeInstanceOf(User)
    expect(ana.dataTrail[0]).toBeInstanceOf(DataPoint)
    expect(ana.dataTrail[0]).toMatchObject({
      speech: 'hello',
      time: 2,
      x: 10,
      y: 20,
      stopLength: 3,
    })
    expect(ana.dataTrail[0].codes).toEqual(['a'])
    expect(ana.conversation_enabled).toBe(false)
    expect(ana.movementIsLoaded).toBe(true)
    expect(snapshot.mondrian.drawAs).toBe('ana')
  })

  it('does not share arrays with the live state', () => {
    const live = state()
    const snapshot = toSnapshot(live)
    snapshot.users[0].trail[0].codes.push('b')
    expect(live.users[0].dataTrail[0].codes).toEqual(['a'])
  })

  it('offers a session back only when it holds something', () => {
    expect(isWorthRestoring(undefined)).toBe(false)
    expect(isWorthRestoring(toSnapshot(state({ users: [], hasFloorplan: false })))).toBe(false)
    expect(isWorthRestoring(toSnapshot(state({ users: [] })))).toBe(false)
    expect(isWorthRestoring({ ...toSnapshot(state()), version: 0 })).toBe(false)
  })
})
