import { get } from 'svelte/store'
import UserStore from '../../stores/userStore'
import { historyStore } from '../../stores/historyStore'
import type { User } from '../../models/user'

/**
 * Deep clone utility for undo/redo state preservation
 * Uses structuredClone if available, otherwise JSON parse/stringify
 */
function deepClone<T>(obj: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj)
  }
  return JSON.parse(JSON.stringify(obj)) as T
}

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
 * Change user color with undo
 */
export function setUserColor(userId: string, color: string): void {
  const users = get(UserStore)
  const user = users.find((u) => u.name === userId)
  if (!user) return

  const oldColor = user.color
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
 * Toggle all users visibility
 */
export function toggleAllUsers(enabled: boolean): void {
  const before = deepClone(get(UserStore).map((u) => ({ name: u.name, enabled: u.enabled })))

  UserStore.update((list) => list.map((u) => ({ ...u, enabled })))

  historyStore.push({
    actionType: 'user.toggle',
    actionLabel: `${enabled ? 'Showed' : 'Hid'} all users`,
    undo: () =>
      UserStore.update((list) =>
        list.map((u) => {
          const prev = before.find((b) => b.name === u.name)
          return prev ? { ...u, enabled: prev.enabled } : u
        })
      ),
    redo: () => UserStore.update((list) => list.map((u) => ({ ...u, enabled }))),
  })
}

/**
 * Toggle all users conversation visibility
 */
export function toggleAllUsersConversation(enabled: boolean): void {
  const before = deepClone(
    get(UserStore).map((u) => ({
      name: u.name,
      conversation_enabled: u.conversation_enabled,
    }))
  )

  UserStore.update((list) => list.map((u) => ({ ...u, conversation_enabled: enabled })))

  historyStore.push({
    actionType: 'user.toggle',
    actionLabel: `${enabled ? 'Showed' : 'Hid'} all conversations`,
    undo: () =>
      UserStore.update((list) =>
        list.map((u) => {
          const prev = before.find((b) => b.name === u.name)
          return prev ? { ...u, conversation_enabled: prev.conversation_enabled } : u
        })
      ),
    redo: () =>
      UserStore.update((list) => list.map((u) => ({ ...u, conversation_enabled: enabled }))),
  })
}
