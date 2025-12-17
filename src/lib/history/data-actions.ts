import { get } from 'svelte/store'
import UserStore from '../../stores/userStore'
import CodeStore from '../../stores/codeStore'
import { historyStore } from '../../stores/historyStore'
import { deepClone } from './index'

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

/**
 * Toggle a specific code's enabled state with undo
 */
export function toggleCodeEnabled(codeName: string): void {
  const codes = get(CodeStore)
  const code = codes.find((c) => c.code === codeName)
  if (!code) return

  const wasEnabled = code.enabled

  CodeStore.update((list) =>
    list.map((c) => (c.code === codeName ? { ...c, enabled: !c.enabled } : c))
  )

  historyStore.push({
    actionType: 'code.toggle',
    actionLabel: `${wasEnabled ? 'Disabled' : 'Enabled'} ${codeName}`,
    undo: () =>
      CodeStore.update((list) =>
        list.map((c) => (c.code === codeName ? { ...c, enabled: wasEnabled } : c))
      ),
    redo: () =>
      CodeStore.update((list) =>
        list.map((c) => (c.code === codeName ? { ...c, enabled: !wasEnabled } : c))
      ),
  })
}

/**
 * Set a code's enabled state with undo
 */
export function setCodeEnabled(codeName: string, enabled: boolean): void {
  const codes = get(CodeStore)
  const code = codes.find((c) => c.code === codeName)
  if (!code || code.enabled === enabled) return

  const wasEnabled = code.enabled

  CodeStore.update((list) =>
    list.map((c) => (c.code === codeName ? { ...c, enabled } : c))
  )

  historyStore.push({
    actionType: 'code.toggle',
    actionLabel: `${enabled ? 'Enabled' : 'Disabled'} ${codeName}`,
    undo: () =>
      CodeStore.update((list) =>
        list.map((c) => (c.code === codeName ? { ...c, enabled: wasEnabled } : c))
      ),
    redo: () =>
      CodeStore.update((list) =>
        list.map((c) => (c.code === codeName ? { ...c, enabled } : c))
      ),
  })
}

/**
 * Change a code's color with undo
 */
export function setCodeColor(codeName: string, color: string): void {
  const codes = get(CodeStore)
  const code = codes.find((c) => c.code === codeName)
  if (!code) return

  const oldColor = code.color
  if (oldColor === color) return

  CodeStore.update((list) =>
    list.map((c) => (c.code === codeName ? { ...c, color } : c))
  )

  historyStore.push({
    actionType: 'code.color',
    actionLabel: `Changed ${codeName} color`,
    undo: () =>
      CodeStore.update((list) =>
        list.map((c) => (c.code === codeName ? { ...c, color: oldColor } : c))
      ),
    redo: () =>
      CodeStore.update((list) =>
        list.map((c) => (c.code === codeName ? { ...c, color } : c))
      ),
  })
}

/**
 * Toggle all codes enabled/disabled with undo
 */
export function toggleAllCodes(): void {
  const codes = get(CodeStore)
  if (codes.length === 0) return

  const before = deepClone(codes.map((c) => ({ code: c.code, enabled: c.enabled })))
  const allEnabled = codes.every((c) => c.enabled)
  const newState = !allEnabled

  CodeStore.update((list) => list.map((c) => ({ ...c, enabled: newState })))

  historyStore.push({
    actionType: 'code.toggle',
    actionLabel: `${newState ? 'Enabled' : 'Disabled'} all codes`,
    undo: () =>
      CodeStore.update((list) =>
        list.map((c) => {
          const prev = before.find((b) => b.code === c.code)
          return prev ? { ...c, enabled: prev.enabled } : c
        })
      ),
    redo: () => CodeStore.update((list) => list.map((c) => ({ ...c, enabled: newState }))),
  })
}
