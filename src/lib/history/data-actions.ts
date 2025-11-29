import { get } from 'svelte/store'
import UserStore from '../../stores/userStore'
import CodeStore from '../../stores/codeStore'
import { historyStore } from '../../stores/historyStore'

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
 * Clear all user data with undo
 */
export function clearUsers(): void {
  const before = deepClone(get(UserStore))
  if (before.length === 0) return

  UserStore.set([])

  historyStore.push({
    actionType: 'data.clear',
    actionLabel: 'Cleared movement data',
    undo: () => UserStore.set(deepClone(before)),
    redo: () => UserStore.set([]),
  })
}

/**
 * Clear all codes with undo
 */
export function clearCodes(): void {
  const before = deepClone(get(CodeStore))
  if (before.length === 0) return

  CodeStore.set([])

  historyStore.push({
    actionType: 'data.clear',
    actionLabel: 'Cleared codes',
    undo: () => CodeStore.set(deepClone(before)),
    redo: () => CodeStore.set([]),
  })
}

/**
 * Clear all data with undo
 */
export function clearAllData(): void {
  const usersBefore = deepClone(get(UserStore))
  const codesBefore = deepClone(get(CodeStore))

  if (usersBefore.length === 0 && codesBefore.length === 0) return

  UserStore.set([])
  CodeStore.set([])

  historyStore.push({
    actionType: 'data.clear',
    actionLabel: 'Cleared all data',
    undo: () => {
      UserStore.set(deepClone(usersBefore))
      CodeStore.set(deepClone(codesBefore))
    },
    redo: () => {
      UserStore.set([])
      CodeStore.set([])
    },
  })
}
