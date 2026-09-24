import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { get } from 'svelte/store'
import UserStore from '../../stores/userStore'
import { historyStore } from '../../stores/historyStore'
import { User } from '../../models/user'
import { createUserColorDrag, setUserColor } from './user-actions'

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
