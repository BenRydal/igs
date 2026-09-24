import { get } from 'svelte/store'
import UserStore from '../../stores/userStore'
import { historyStore } from '../../stores/historyStore'
import { deepClone } from './deep-clone'

/**
 * Toggle user visibility with undo
 */
export function toggleUserEnabled(userId: string): void {
  const users = get(UserStore)
  const user = users.find((u) => u.name === userId)
  if (!user) return

  const wasEnabled = user.enabled

  UserStore.update((list) =>
    list.map((u) => (u.name === userId ? { ...u, enabled: !u.enabled } : u))
  )

  historyStore.push({
    actionType: 'user.toggle',
    actionLabel: `${wasEnabled ? 'Hid' : 'Showed'} ${userId}`,
    undo: () =>
      UserStore.update((list) =>
        list.map((u) => (u.name === userId ? { ...u, enabled: wasEnabled } : u))
      ),
    redo: () =>
      UserStore.update((list) =>
        list.map((u) => (u.name === userId ? { ...u, enabled: !wasEnabled } : u))
      ),
  })
}

/**
 * Toggle user conversation visibility with undo
 */
export function toggleUserConversationEnabled(userId: string): void {
  const users = get(UserStore)
  const user = users.find((u) => u.name === userId)
  if (!user) return

  const wasEnabled = user.conversation_enabled

  UserStore.update((list) =>
    list.map((u) =>
      u.name === userId ? { ...u, conversation_enabled: !u.conversation_enabled } : u
    )
  )

  historyStore.push({
    actionType: 'user.toggle',
    actionLabel: `${wasEnabled ? 'Hid' : 'Showed'} ${userId} conversation`,
    undo: () =>
      UserStore.update((list) =>
        list.map((u) => (u.name === userId ? { ...u, conversation_enabled: wasEnabled } : u))
      ),
    redo: () =>
      UserStore.update((list) =>
        list.map((u) => (u.name === userId ? { ...u, conversation_enabled: !wasEnabled } : u))
      ),
  })
}

/**
 * Rename user with undo
 */
export function setUserName(oldName: string, newName: string): void {
  const users = get(UserStore)
  const user = users.find((u) => u.name === oldName)
  if (!user) return
  if (oldName === newName) return

  UserStore.update((list) => list.map((u) => (u.name === oldName ? { ...u, name: newName } : u)))

  historyStore.push({
    actionType: 'user.rename',
    actionLabel: `Renamed ${oldName} to ${newName}`,
    undo: () =>
      UserStore.update((list) =>
        list.map((u) => (u.name === newName ? { ...u, name: oldName } : u))
      ),
    redo: () =>
      UserStore.update((list) =>
        list.map((u) => (u.name === oldName ? { ...u, name: newName } : u))
      ),
  })
}

/**
 * Change user color with undo
 */
export function setUserColor(userId: string, color: string): void {
  const user = get(UserStore).find((u) => u.name === userId)
  if (!user) return
  commitUserColor(userId, user.color, color)
}

/**
 * Change user color with undo, from an explicit previous color
 * (the store may already hold `color` after a live picker drag)
 */
export function commitUserColor(userId: string, oldColor: string, color: string): void {
  if (oldColor === color) return

  UserStore.update((list) => list.map((u) => (u.name === userId ? { ...u, color } : u)))

  historyStore.push({
    actionType: 'user.color',
    actionLabel: `Changed ${userId} color`,
    undo: () =>
      UserStore.update((list) =>
        list.map((u) => (u.name === userId ? { ...u, color: oldColor } : u))
      ),
    redo: () =>
      UserStore.update((list) => list.map((u) => (u.name === userId ? { ...u, color } : u))),
  })
}

/**
 * Live color edits (a picker drag) that record one undo step per drag, once
 * input settles or another user's color starts changing
 */
export function createUserColorDrag(settleMs = 400) {
  let pending: { id: string; from: string } | null = null
  let timer: ReturnType<typeof setTimeout> | undefined

  function flush(): void {
    clearTimeout(timer)
    if (!pending) return
    const { id, from } = pending
    pending = null
    const to = get(UserStore).find((u) => u.name === id)?.color
    if (to) commitUserColor(id, from, to)
  }

  function input(id: string, color: string): void {
    if (pending && pending.id !== id) flush()
    pending ??= { id, from: get(UserStore).find((u) => u.name === id)?.color ?? color }
    UserStore.update((list) => list.map((u) => (u.name === id ? { ...u, color } : u)))
    clearTimeout(timer)
    timer = setTimeout(flush, settleMs)
  }

  return { input, flush }
}

/**
 * Toggle both movement and conversation visibility for a user with a single undo
 */
export function toggleUserVisibility(userId: string, currentlyVisible: boolean): void {
  const users = get(UserStore)
  const user = users.find((u) => u.name === userId)
  if (!user) return

  const wasEnabled = user.enabled
  const wasConversationEnabled = user.conversation_enabled
  const newValue = !currentlyVisible

  UserStore.update((list) =>
    list.map((u) =>
      u.name === userId ? { ...u, enabled: newValue, conversation_enabled: newValue } : u
    )
  )

  historyStore.push({
    actionType: 'user.toggle',
    actionLabel: `${newValue ? 'Showed' : 'Hid'} ${userId}`,
    undo: () =>
      UserStore.update((list) =>
        list.map((u) =>
          u.name === userId
            ? { ...u, enabled: wasEnabled, conversation_enabled: wasConversationEnabled }
            : u
        )
      ),
    redo: () =>
      UserStore.update((list) =>
        list.map((u) =>
          u.name === userId ? { ...u, enabled: newValue, conversation_enabled: newValue } : u
        )
      ),
  })
}
