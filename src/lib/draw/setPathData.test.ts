import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { SetPathData, conversationCacheKey } from './setPathData.js'
import { DataPoint } from '../../models/dataPoint.js'
import { User, nextRevision } from '../../models/user.js'
import type { IgsP5 } from '../p5/igs-p5'

// mergeConversationData is the function the conversation cache memoizes. A miss
// walks every point of every trail, movement points included, and SetPathData
// persists across frames so that the cache can actually hold between them.
// These tests pin the merge's output and what the cache key has to protect.
//
// It reads only user.dataTrail / .name / .color, so a null sketch is enough.

const setPathData = () => new SetPathData(null as unknown as IgsP5)

/** A speech point; movement points are those with an empty speech string. */
const speech = (time: number, text: string) => new DataPoint(text, time, 0, 0)
const movement = (time: number) => new DataPoint('', time, 0, 0)

const user = (name: string, color: string, dataTrail: DataPoint[]) => {
  const u = new User(dataTrail, color, true, name)
  u.conversationIsLoaded = true
  return u
}

describe('User.revision stamps', () => {
  it('is unique per user, not a per-user counter starting at zero', () => {
    const a = new User([], '#000000', true, 'ana')
    const b = new User([], '#000000', true, 'ana')
    expect(a.revision).not.toBe(b.revision)
  })

  it('is unique on every restamp', () => {
    const user = new User([], '#000000', true, 'ana')
    const seen = new Set([user.revision])
    for (let i = 0; i < 5; i++) {
      user.revision = nextRevision()
      expect(seen.has(user.revision)).toBe(false)
      seen.add(user.revision)
    }
  })

  it('increases monotonically', () => {
    const first = nextRevision()
    expect(nextRevision()).toBeGreaterThan(first)
  })

  // An invariant rather than a behaviour: `revision++` preserves uniqueness only
  // by accident, and using it cannot be caught by testing the helpers, because
  // the helpers are what the production call sites are supposed to use. The bug
  // it causes is silent and only visible after a dataset switch, so it is
  // guarded structurally.
  it('is never incremented in place anywhere in the source', () => {
    const offenders: string[] = []
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const path = `${dir}/${entry}`
        if (statSync(path).isDirectory()) {
          walk(path)
          continue
        }
        if (!/\.(ts|js|svelte)$/.test(entry) || entry.endsWith('.test.ts')) continue
        const text = readFileSync(path, 'utf8')
        // Skip the prose in models/user.ts that names the forbidden form.
        for (const line of text.split('\n')) {
          if (line.trimStart().startsWith('*')) continue
          if (/\brevision\s*(\+\+|--|\+=)/.test(line)) offenders.push(`${path}: ${line.trim()}`)
        }
      }
    }
    walk('src')
    expect(offenders).toEqual([])
  })
})

describe('conversationCacheKey', () => {
  /** A user as a dataset load leaves them: constructed, then stamped once per file. */
  const loadedUser = (name: string, color: string, fileCount: number) => {
    const user = new User([], color, true, name)
    user.conversationIsLoaded = true
    for (let i = 0; i < fileCount; i++) user.revision = nextRevision()
    return user
  }

  // Two datasets can hold the same user names and, because colours are handed
  // out in a fixed order, the same colours. The revision stamp is the only thing
  // left to distinguish them, which is why it comes from a process-wide counter
  // rather than a per-user one: a per-user counter makes the stamp a function of
  // how many files the dataset loaded, and so identical for identically shaped
  // datasets. example-18 and example-20 both load a single movement file for a
  // user called "teacher", so they would key alike and this cache would serve
  // the previous dataset's merged conversation.
  it('differs between two identically shaped datasets with the same user names', () => {
    const datasetA = [loadedUser('teacher', '#ff0000', 1)]
    const datasetB = [loadedUser('teacher', '#ff0000', 1)]
    expect(conversationCacheKey(datasetA)).not.toBe(conversationCacheKey(datasetB))
  })

  it('differs for a multi-user dataset reloaded with the same names and colours', () => {
    const names = ['adhir', 'blake', 'jeans', 'lily', 'mae']
    const colors = ['#1', '#2', '#3', '#4', '#5']
    const first = names.map((n, i) => loadedUser(n, colors[i], 6))
    const second = names.map((n, i) => loadedUser(n, colors[i], 6))
    expect(conversationCacheKey(first)).not.toBe(conversationCacheKey(second))
  })

  it('is stable when nothing changes', () => {
    const users = [loadedUser('teacher', '#ff0000', 1)]
    expect(conversationCacheKey(users)).toBe(conversationCacheKey(users))
  })

  it('changes when a trail is restamped', () => {
    const users = [loadedUser('teacher', '#ff0000', 1)]
    const before = conversationCacheKey(users)
    users[0].revision = nextRevision()
    expect(conversationCacheKey(users)).not.toBe(before)
  })

  it('changes when a colour changes, which never restamps revision', () => {
    const users = [loadedUser('teacher', '#ff0000', 1)]
    const before = conversationCacheKey(users)
    users[0].color = '#00ff00'
    expect(conversationCacheKey(users)).not.toBe(before)
  })

  it('changes when a user is renamed', () => {
    const users = [loadedUser('teacher', '#ff0000', 1)]
    const before = conversationCacheKey(users)
    users[0].name = 'student1'
    expect(conversationCacheKey(users)).not.toBe(before)
  })
})

describe('SetPathData.mergeConversationData', () => {
  it('returns speech points only, dropping movement points', () => {
    const ana = user('ana', '#f00', [movement(0), speech(1, 'hi'), movement(2)])
    const merged = setPathData().mergeConversationData([ana])
    expect(merged.map((m) => m.point.speech)).toEqual(['hi'])
  })

  it('merges two users into one time-ordered sequence', () => {
    const ana = user('ana', '#f00', [speech(0, 'first'), speech(4, 'third')])
    const cam = user('cam', '#00f', [speech(2, 'second'), speech(6, 'fourth')])
    const merged = setPathData().mergeConversationData([ana, cam])
    expect(merged.map((m) => m.point.speech)).toEqual(['first', 'second', 'third', 'fourth'])
    expect(merged.map((m) => m.speaker)).toEqual(['ana', 'cam', 'ana', 'cam'])
  })

  it('carries each speaker name and colour onto the merged entries', () => {
    // This is why colour has to be part of the cache key: it is baked into the
    // merged output, so a recolour must invalidate the cache.
    const ana = user('ana', '#ff0000', [speech(0, 'hi')])
    const merged = setPathData().mergeConversationData([ana])
    expect(merged[0]).toMatchObject({ speaker: 'ana', color: '#ff0000' })
  })

  it('interleaves correctly when one user starts later', () => {
    const ana = user('ana', '#f00', [speech(10, 'late')])
    const cam = user('cam', '#00f', [speech(1, 'a'), speech(2, 'b'), speech(3, 'c')])
    const merged = setPathData().mergeConversationData([ana, cam])
    expect(merged.map((m) => m.point.speech)).toEqual(['a', 'b', 'c', 'late'])
  })

  it('skips points with a null time', () => {
    const ana = user('ana', '#f00', [new DataPoint('no time', null), speech(1, 'kept')])
    const merged = setPathData().mergeConversationData([ana])
    expect(merged.map((m) => m.point.speech)).toEqual(['kept'])
  })

  it('returns an empty array for a user with no speech', () => {
    const ana = user('ana', '#f00', [movement(0), movement(1)])
    expect(setPathData().mergeConversationData([ana])).toEqual([])
  })

  it('returns an empty array for no users', () => {
    expect(setPathData().mergeConversationData([])).toEqual([])
  })

  // An in-place time edit changes the merged output without changing
  // dataTrail.length — which is why the cache key is keyed on revision. The
  // output here is still the edited value, so a stale cache would show the old
  // time on the visualization.
  it('reflects an in-place time edit that leaves the length unchanged', () => {
    const ana = user('ana', '#f00', [speech(0, 'first'), speech(5, 'second')])
    const sp = setPathData()
    expect(sp.mergeConversationData([ana]).map((m) => m.point.time)).toEqual([0, 5])

    // Simulate TranscriptPanel.saveEditing retiming 'second'.
    ana.dataTrail[1].time = 3
    expect(ana.dataTrail).toHaveLength(2) // length is unchanged
    expect(sp.mergeConversationData([ana]).map((m) => m.point.time)).toEqual([0, 3])
  })

  // Documents a precondition, not an endorsement: the merge is a k-way merge
  // over per-user trails it assumes are already sorted by time, so it advances
  // each user's cursor forward only and hands back trail order when that
  // assumption breaks. Nothing currently feeds it an unsorted trail —
  // Core.finalizeUserData and TranscriptPanel.saveEditing both sort — so this
  // pins what the merge owes its callers rather than a reachable bug.
  it('emits in trail order, not time order, when a trail is unsorted', () => {
    const ana = user('ana', '#f00', [speech(0, 'first'), speech(5, 'second')])
    ana.dataTrail[1].time = -1 // now out of order within the trail
    expect(
      setPathData()
        .mergeConversationData([ana])
        .map((m) => m.point.speech)
    ).toEqual(['first', 'second'])
  })
})
