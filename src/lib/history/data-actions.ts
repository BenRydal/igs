import { get } from 'svelte/store'
import UserStore from '../../stores/userStore'
import CodeStore from '../../stores/codeStore'
import { historyStore } from '../../stores/historyStore'
import { deepClone } from './deep-clone'

/**
 * Clear all user data with undo.
 *
 * The snapshot shares its User objects, and with them their dataTrails, rather
 * than deep-cloning. That is sound because this action only replaces the store's
 * array: no User and no DataPoint is touched, so putting the same objects back
 * is an exact undo. It also matters — clearAllData is on the path of every
 * dataset switch, and at full movement resolution a deep clone is tens of
 * megabytes, held for up to history's 50 entries, with structuredClone blocking
 * the main thread each time. The array itself is copied so the store's own array
 * identity stays private.
 *
 * Known limit: operations that mutate DataPoints in place without going through
 * history — clearConversationData, clearCodeData, transcript edits — are not
 * captured by any snapshot, and with shared references they can also be observed
 * through one. Reaching that needs an undo, then such a mutation, then a redo
 * and a second undo.
 */
export function clearUsers(): void {
  const before = get(UserStore)
  if (before.length === 0) return

  UserStore.set([])

  historyStore.push({
    actionType: 'data.clear',
    actionLabel: 'Cleared movement data',
    undo: () => UserStore.set([...before]),
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
  // Users share structurally; see clearUsers. Codes are a handful of small
  // plain objects, so they keep the deep clone.
  const usersBefore = get(UserStore)
  const codesBefore = deepClone(get(CodeStore))

  if (usersBefore.length === 0 && codesBefore.length === 0) return

  UserStore.set([])
  CodeStore.set([])

  historyStore.push({
    actionType: 'data.clear',
    actionLabel: 'Cleared all data',
    undo: () => {
      UserStore.set([...usersBefore])
      CodeStore.set(deepClone(codesBefore))
    },
    redo: () => {
      UserStore.set([])
      CodeStore.set([])
    },
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

  CodeStore.update((list) => list.map((c) => (c.code === codeName ? { ...c, enabled } : c)))

  historyStore.push({
    actionType: 'code.toggle',
    actionLabel: `${enabled ? 'Enabled' : 'Disabled'} ${codeName}`,
    undo: () =>
      CodeStore.update((list) =>
        list.map((c) => (c.code === codeName ? { ...c, enabled: wasEnabled } : c))
      ),
    redo: () =>
      CodeStore.update((list) => list.map((c) => (c.code === codeName ? { ...c, enabled } : c))),
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

  CodeStore.update((list) => list.map((c) => (c.code === codeName ? { ...c, color } : c)))

  historyStore.push({
    actionType: 'code.color',
    actionLabel: `Changed ${codeName} color`,
    undo: () =>
      CodeStore.update((list) =>
        list.map((c) => (c.code === codeName ? { ...c, color: oldColor } : c))
      ),
    redo: () =>
      CodeStore.update((list) => list.map((c) => (c.code === codeName ? { ...c, color } : c))),
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
