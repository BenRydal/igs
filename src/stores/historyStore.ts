import { writable, derived, get } from 'svelte/store'

const HISTORY_STORAGE_KEY = 'igs-history-state'

export type UndoableAction =
  | 'config.toggle'
  | 'config.slider'
  | 'config.text'
  | 'config.reset'
  | 'user.toggle'
  | 'user.color'
  | 'code.toggle'
  | 'code.color'
  | 'data.clear'

export interface HistoryEntry {
  id: string
  timestamp: number
  actionType: UndoableAction | string
  actionLabel: string // Human-readable: "Toggled movement trails"
  undo: () => void // Function to undo this action
  redo: () => void // Function to redo this action
}

export interface PersistedHistoryEntry {
  id: string
  actionType: string
  actionLabel: string
  timestamp: number
}

// Legacy type alias for backwards compatibility
export type HistoryAction = Omit<HistoryEntry, 'id' | 'timestamp'>

export interface HistoryState {
  past: HistoryEntry[]
  future: HistoryEntry[]
  isUndoing: boolean
  maxSize: number
}

const initialState: HistoryState = {
  past: [],
  future: [],
  isUndoing: false,
  maxSize: 50,
}

// Transaction state for grouping multiple operations
let transactionEntries: HistoryAction[] = []
let isInTransaction = false

/**
 * Save minimal history state to sessionStorage
 * Only saves the last 20 entries for display purposes
 */
function persistHistory(past: HistoryEntry[]): void {
  // Guard against SSR - sessionStorage is only available in browser
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return
  }

  try {
    const toSave: PersistedHistoryEntry[] = past.slice(-20).map((entry) => ({
      id: entry.id,
      actionType: entry.actionType,
      actionLabel: entry.actionLabel,
      timestamp: entry.timestamp,
    }))
    sessionStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(toSave))
  } catch (e) {
    // Storage might be full or unavailable
    console.warn('Failed to persist history:', e)
  }
}

/**
 * Load persisted history entries from sessionStorage
 * These are for display only - undo/redo functions cannot be restored
 */
function loadPersistedHistory(): PersistedHistoryEntry[] {
  // Guard against SSR - sessionStorage is only available in browser
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return []
  }

  try {
    const saved = sessionStorage.getItem(HISTORY_STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

// Debounce timeout for persisting history
let persistTimeout: ReturnType<typeof setTimeout> | null = null

function createHistoryStore() {
  const { subscribe, set, update } = writable<HistoryState>(initialState)

  return {
    subscribe,

    /**
     * Push a new action to the history
     * Clears the future stack and respects maxSize
     */
    push(entry: HistoryAction): void {
      // If we're in a transaction, collect entries instead of pushing immediately
      if (isInTransaction) {
        transactionEntries.push(entry)
        return
      }

      update((state) => {
        // Don't record history during undo/redo operations
        if (state.isUndoing) {
          return state
        }

        // Generate unique ID and timestamp
        const historyEntry: HistoryEntry = {
          ...entry,
          id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
        }

        // Check for debouncing - if last action was same type within 300ms, replace it
        const lastEntry = state.past[state.past.length - 1]
        if (
          lastEntry &&
          lastEntry.actionType === historyEntry.actionType &&
          historyEntry.timestamp - lastEntry.timestamp < 300 &&
          historyEntry.actionType === 'config.slider'
        ) {
          // Replace the last entry with the new one for slider changes
          const newPast = [...state.past]
          newPast[newPast.length - 1] = historyEntry
          return {
            ...state,
            past: newPast,
            future: [], // Clear future on new action
          }
        }

        // Add to past and clear future
        const newPast = [...state.past, historyEntry]

        // Respect maxSize by removing oldest entries
        if (newPast.length > state.maxSize) {
          newPast.shift()
        }

        return {
          ...state,
          past: newPast,
          future: [], // Clear future when new action is pushed
        }
      })
    },

    /**
     * Undo the last action
     * @returns The action label if successful, null if nothing to undo
     */
    undo(): string | null {
      let actionLabel: string | null = null

      update((state) => {
        if (state.past.length === 0) {
          return state
        }

        // Get the last action from past
        const lastAction = state.past[state.past.length - 1]
        actionLabel = lastAction.actionLabel

        // Set isUndoing flag to prevent recursive history entries
        const newState = { ...state, isUndoing: true }

        // Execute the undo function
        try {
          lastAction.undo()
        } catch (error) {
          console.error('Error executing undo:', error)
          return { ...state, isUndoing: false }
        }

        // Move from past to future
        const newPast = state.past.slice(0, -1)
        const newFuture = [...state.future, lastAction]

        return {
          ...newState,
          past: newPast,
          future: newFuture,
          isUndoing: false,
        }
      })

      return actionLabel
    },

    /**
     * Redo the last undone action
     * @returns The action label if successful, null if nothing to redo
     */
    redo(): string | null {
      let actionLabel: string | null = null

      update((state) => {
        if (state.future.length === 0) {
          return state
        }

        // Get the last undone action from future
        const lastUndone = state.future[state.future.length - 1]
        actionLabel = lastUndone.actionLabel

        // Set isUndoing flag to prevent recursive history entries
        const newState = { ...state, isUndoing: true }

        // Execute the redo function
        try {
          lastUndone.redo()
        } catch (error) {
          console.error('Error executing redo:', error)
          return { ...state, isUndoing: false }
        }

        // Move from future to past
        const newFuture = state.future.slice(0, -1)
        const newPast = [...state.past, lastUndone]

        // Respect maxSize
        if (newPast.length > state.maxSize) {
          newPast.shift()
        }

        return {
          ...newState,
          past: newPast,
          future: newFuture,
          isUndoing: false,
        }
      })

      return actionLabel
    },

    /**
     * Clear both past and future history
     */
    clear(): void {
      set({
        ...initialState,
        maxSize: get({ subscribe }).maxSize,
      })
    },

    /**
     * Begin a transaction to group multiple operations
     * Operations will be batched until commitTransaction is called
     */
    beginTransaction(): void {
      isInTransaction = true
      transactionEntries = []
    },

    /**
     * Commit a transaction, creating a single history entry for all operations
     * @param label Human-readable label for the grouped operations
     */
    commitTransaction(label: string): void {
      if (!isInTransaction) {
        console.warn('No transaction in progress')
        return
      }

      if (transactionEntries.length === 0) {
        isInTransaction = false
        return
      }

      // Create a combined undo/redo that executes all operations
      const combinedUndo = () => {
        // Execute undos in reverse order
        for (let i = transactionEntries.length - 1; i >= 0; i--) {
          transactionEntries[i].undo()
        }
      }

      const combinedRedo = () => {
        // Execute redos in forward order
        for (let i = 0; i < transactionEntries.length; i++) {
          transactionEntries[i].redo()
        }
      }

      // Use the action type from the first entry
      const actionType = transactionEntries[0].actionType

      // Push the combined entry
      isInTransaction = false
      this.push({
        actionType,
        actionLabel: label,
        undo: combinedUndo,
        redo: combinedRedo,
      })

      transactionEntries = []
    },

    /**
     * Rollback a transaction without creating a history entry
     * Undoes all operations performed during the transaction
     */
    rollbackTransaction(): void {
      if (!isInTransaction) {
        console.warn('No transaction in progress')
        return
      }

      // Execute undos in reverse order
      for (let i = transactionEntries.length - 1; i >= 0; i--) {
        transactionEntries[i].undo()
      }

      isInTransaction = false
      transactionEntries = []
    },

    /**
     * Get persisted history entries from sessionStorage
     * These are for display only - actual undo/redo functions cannot be restored
     */
    getPersistedHistory(): PersistedHistoryEntry[] {
      return loadPersistedHistory()
    },
  }
}

export const historyStore = createHistoryStore()

// Subscribe to store changes and persist history (debounced)
historyStore.subscribe((state) => {
  if (persistTimeout) clearTimeout(persistTimeout)
  persistTimeout = setTimeout(() => {
    persistHistory(state.past)
  }, 1000) // Debounce 1 second
})

export const canUndo = derived(historyStore, ($h) => $h.past.length > 0)
export const canRedo = derived(historyStore, ($h) => $h.future.length > 0)
