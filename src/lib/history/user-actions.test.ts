import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { get } from 'svelte/store'
import UserStore from '../../stores/userStore'
import { historyStore } from '../../stores/historyStore'
import { User } from '../../models/user'
import { createUserColorDrag, setUserColor, addUser, commitTake } from './user-actions'
import { DataPoint } from '../../models/dataPoint'

const colorOf = (name: string) => get(UserStore).find((u) => u.name === name)?.color
const historyLength = () => get(historyStore).past.length

describe('createUserColorDrag', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    UserStore.set([new User([], '#000000', true, 'ana'), new User([], '#ffffff', true, 'cam')])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('updates the color live and records one undo step per drag', () => {
    const drag = createUserColorDrag(400)
    const before = historyLength()

    drag.input('ana', '#111111')
    drag.input('ana', '#222222')
    drag.input('ana', '#333333')
    expect(colorOf('ana')).toBe('#333333')
    expect(historyLength()).toBe(before)

    vi.advanceTimersByTime(400)
    expect(historyLength()).toBe(before + 1)

    historyStore.undo()
    expect(colorOf('ana')).toBe('#000000')
  })

  it("commits the previous user's drag when another user's color changes", () => {
    const drag = createUserColorDrag(400)
    const before = historyLength()

    drag.input('ana', '#111111')
    drag.input('cam', '#eeeeee')
    expect(historyLength()).toBe(before + 1)

    drag.flush()
    expect(historyLength()).toBe(before + 2)

    historyStore.undo()
    expect(colorOf('cam')).toBe('#ffffff')
    historyStore.undo()
    expect(colorOf('ana')).toBe('#000000')
  })

  it('records nothing when the drag ends on the starting color', () => {
    const drag = createUserColorDrag(400)
    const before = historyLength()

    drag.input('ana', '#123456')
    drag.input('ana', '#000000')
    drag.flush()
    expect(historyLength()).toBe(before)
  })
})

describe('setUserColor', () => {
  it('still records a single undoable change', () => {
    UserStore.set([new User([], '#000000', true, 'ana')])
    const before = historyLength()

    setUserColor('ana', '#abcdef')
    expect(colorOf('ana')).toBe('#abcdef')
    expect(historyLength()).toBe(before + 1)

    historyStore.undo()
    expect(colorOf('ana')).toBe('#000000')
  })
})

describe('addUser', () => {
  beforeEach(() => UserStore.set([new User([], '#6a3d9a', true, 'ana')]))

  it('adds a person with the next unused color, undoably', () => {
    expect(addUser('  cam ')).toBe(true)
    const cam = get(UserStore).find((u) => u.name === 'cam')
    expect(cam?.color).toBe('#ff7f00')
    expect(cam?.dataTrail).toEqual([])

    historyStore.undo()
    expect(get(UserStore).map((u) => u.name)).toEqual(['ana'])
    historyStore.redo()
    expect(get(UserStore).map((u) => u.name)).toEqual(['ana', 'cam'])
  })

  it('rejects an empty or duplicate name', () => {
    const before = historyLength()
    expect(addUser('ana')).toBe(false)
    expect(addUser('   ')).toBe(false)
    expect(historyLength()).toBe(before)
  })
})

describe('commitTake', () => {
  const trailOf = (name: string) => get(UserStore).find((u) => u.name === name)?.dataTrail ?? []

  it('swaps the trail as one undo step and recomputes derived values each way', () => {
    UserStore.set([new User([], '#000000', true, 'ana')])
    const before = [new DataPoint('', 0, 1, 1)]
    const after = [new DataPoint('', 0, 1, 1), new DataPoint('', 1, 5, 5)]
    const finalized: number[] = []

    commitTake('ana', before, after, (trail) => finalized.push(trail.length))
    expect(trailOf('ana')).toBe(after)
    expect(get(UserStore)[0].movementIsLoaded).toBe(true)

    historyStore.undo()
    expect(trailOf('ana')).toBe(before)
    expect(get(UserStore)[0].movementIsLoaded).toBe(false)

    historyStore.redo()
    expect(trailOf('ana')).toBe(after)
    expect(finalized).toEqual([2, 1, 2])
  })
})
