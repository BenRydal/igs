import { beforeEach, describe, expect, it } from 'vitest'
import { get } from 'svelte/store'
import UserStore from '../../stores/userStore'
import CodeStore from '../../stores/codeStore'
import { historyStore } from '../../stores/historyStore'
import { User } from '../../models/user'
import { DataPoint } from '../../models/dataPoint'
import { clearUsers, clearAllData, clearCodes } from './data-actions'

// clearUsers and clearAllData snapshot the UserStore by sharing its User
// objects, dataTrails and all, rather than deep-cloning them. clearAllData is on
// the path of every dataset switch and history keeps up to 50 entries, so a deep
// clone would cost tens of megabytes per snapshot at full movement resolution,
// plus a synchronous structuredClone each time.
//
// These tests pin both halves of the sharing: undo restores exactly, and it
// does so without copying trails.

const usersIn = () => get(UserStore)
const historyLength = () => get(historyStore).past.length

const userWithTrail = (name: string, pointCount: number) => {
  const trail = Array.from({ length: pointCount }, (_, i) => new DataPoint('', i, i, i))
  return new User(trail, '#123456', true, name)
}

beforeEach(() => {
  UserStore.set([])
  CodeStore.set([])
})

describe('clearUsers', () => {
  it('empties the store and records one undoable action', () => {
    UserStore.set([userWithTrail('ana', 3)])
    const before = historyLength()

    clearUsers()

    expect(usersIn()).toHaveLength(0)
    expect(historyLength()).toBe(before + 1)
  })

  it('does nothing when there is no data', () => {
    const before = historyLength()
    clearUsers()
    expect(historyLength()).toBe(before)
  })

  it('restores the users on undo', () => {
    UserStore.set([userWithTrail('ana', 3), userWithTrail('cam', 2)])
    clearUsers()
    historyStore.undo()

    expect(usersIn().map((u) => u.name)).toEqual(['ana', 'cam'])
    expect(usersIn()[0].dataTrail).toHaveLength(3)
    expect(usersIn()[1].dataTrail).toHaveLength(2)
  })

  it('restores trails by reference rather than copying them', () => {
    // The point of the change: no per-point work and no megabytes of garbage.
    const ana = userWithTrail('ana', 5)
    const originalTrail = ana.dataTrail
    const firstPoint = ana.dataTrail[0]
    UserStore.set([ana])

    clearUsers()
    historyStore.undo()

    expect(usersIn()[0]).toBe(ana)
    expect(usersIn()[0].dataTrail).toBe(originalTrail)
    expect(usersIn()[0].dataTrail[0]).toBe(firstPoint)
  })

  it('keeps the User class prototype across an undo', () => {
    // Sharing references keeps real User instances; a structuredClone snapshot
    // hands back plain objects and would fail this.
    UserStore.set([userWithTrail('ana', 2)])
    clearUsers()
    historyStore.undo()
    expect(usersIn()[0]).toBeInstanceOf(User)
    expect(usersIn()[0].dataTrail[0]).toBeInstanceOf(DataPoint)
  })

  it('restores a copy of the array, not the captured array itself', () => {
    // Guards against a later in-place UserStore.update leaking into the
    // snapshot that undo still holds.
    UserStore.set([userWithTrail('ana', 2)])
    const capturedArray = get(UserStore)
    clearUsers()
    historyStore.undo()
    expect(usersIn()).not.toBe(capturedArray)
    expect(usersIn()).toEqual(capturedArray)
  })

  it('re-clears on redo', () => {
    UserStore.set([userWithTrail('ana', 2)])
    clearUsers()
    historyStore.undo()
    expect(usersIn()).toHaveLength(1)
    historyStore.redo()
    expect(usersIn()).toHaveLength(0)
  })

  it('survives repeated undo and redo', () => {
    const ana = userWithTrail('ana', 4)
    UserStore.set([ana])
    clearUsers()
    for (let i = 0; i < 3; i++) {
      historyStore.undo()
      expect(usersIn()[0].dataTrail).toHaveLength(4)
      historyStore.redo()
      expect(usersIn()).toHaveLength(0)
    }
  })
})

describe('clearAllData', () => {
  it('clears users and codes together', () => {
    UserStore.set([userWithTrail('ana', 3)])
    CodeStore.set([{ code: 'talk', enabled: true, color: '#f00' }])

    clearAllData()

    expect(usersIn()).toHaveLength(0)
    expect(get(CodeStore)).toHaveLength(0)
  })

  it('does nothing when both stores are already empty', () => {
    const before = historyLength()
    clearAllData()
    expect(historyLength()).toBe(before)
  })

  it('restores both on undo, sharing trails but copying codes', () => {
    const ana = userWithTrail('ana', 3)
    const originalTrail = ana.dataTrail
    UserStore.set([ana])
    const code = { code: 'talk', enabled: true, color: '#f00' }
    CodeStore.set([code])

    clearAllData()
    historyStore.undo()

    expect(usersIn()[0].dataTrail).toBe(originalTrail)
    expect(get(CodeStore)).toEqual([code])
    // Codes are small, so they are still deep-cloned and come back as copies.
    expect(get(CodeStore)[0]).not.toBe(code)
  })

  it('acts when only codes are present', () => {
    CodeStore.set([{ code: 'talk', enabled: true, color: '#f00' }])
    clearAllData()
    expect(get(CodeStore)).toHaveLength(0)
    historyStore.undo()
    expect(get(CodeStore)).toHaveLength(1)
  })
})

describe('clearCodes', () => {
  it('clears and restores codes', () => {
    CodeStore.set([{ code: 'talk', enabled: true, color: '#f00' }])
    clearCodes()
    expect(get(CodeStore)).toHaveLength(0)
    historyStore.undo()
    expect(get(CodeStore).map((c) => c.code)).toEqual(['talk'])
  })

  it('does nothing when there are no codes', () => {
    const before = historyLength()
    clearCodes()
    expect(historyLength()).toBe(before)
  })
})
